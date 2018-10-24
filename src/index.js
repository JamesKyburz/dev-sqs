const db = require('level')('/tmp/sqs-db', { valueEncoding: 'json' })
const server = require('server-base')
const collect = require('stream-collector')
const uuid = require('uuid')
const crypto = require('crypto')
const xmlResponse = require('./xml-response')

server({
  '@setup' (ctx) {
    ctx.middlewareFunctions = []
  },
  '/*': {
    async post (req, res) {
      const payload = await req.form({ log: false })
      const { Action: action } = payload
      if (action === 'ListQueues') {
        const queueStream = db.createValueStream({
          gt: 'queueName!\x00',
          lt: 'queueName!\xff'
        })
        collect(queueStream, (err, queues) => {
          if (err) return res.error(err)
          res.end(xmlResponse.listQueues(queues))
        })
      } else if (action === 'CreateQueue') {
        const { QueueName: queueName } = payload
        const queueUrl = `${process.env.BASE_URL ||
          'http://localhost:9324'}/queue/${queueName}`
        await db.put(`queueName!${queueName}`, queueUrl)
        res.end(xmlResponse.createQueue(queueUrl))
      } else if (action === 'ReceiveMessage') {
        const {
          QueueUrl: queueUrl,
          WaitTimeSeconds: waitTimeInSeconds
        } = payload
        const messageStream = db.createReadStream({
          gt: `message!${queueUrl}!\x00`,
          lt: `message!${queueUrl}!\xff`,
          limit: 10
        })
        collect(messageStream, (err, messages) => {
          if (err) return res.error(err)
          const end = () => res.end(xmlResponse.receiveMessage(messages))
          if (!messages.length) {
            setTimeout(end, Math.min(waitTimeInSeconds || 0.1) * 1000)
          } else {
            end()
          }
        })
      } else if (action === 'DeleteMessage') {
        const { QueueUrl: queueUrl, ReceiptHandle: receiptHandle } = payload
        await db.del(`message!${queueUrl}!${receiptHandle}`)
        res.end(xmlResponse.deleteMessage())
      } else if (action === 'DeleteMessageBatch') {
        const { QueueUrl: queueUrl } = payload
        const ids = [...Array(10)].map((x, i) => i + 1)
        const messages = ids
          .filter(id => payload[`DeleteMessageBatchRequestEntry.${id}.Id`])
          .map(id => {
            const receiptHandle =
              payload[`DeleteMessageBatchRequestEntry.${id}.ReceiptHandle`]
            return {
              type: 'del',
              id,
              key: `message!${queueUrl}!${receiptHandle}`
            }
          })
        await db.batch(messages)
        res.end(xmlResponse.deleteMessageBatch(messages))
      } else if (action === 'SendMessage') {
        const { QueueUrl: queueUrl } = payload
        const id = uuid.v4()
        const md5 = crypto
          .createHash('md5')
          .update(payload.MessageBody)
          .digest('hex')
        const message = { id, body: payload.MessageBody, md5 }
        await db.put(`message!${queueUrl}!${id}`, message)
        res.end(xmlResponse.sendMessage(message))
      } else if (action === 'SendMessageBatch') {
        const { QueueUrl: queueUrl } = payload
        const ids = [...Array(10)]
          .map((x, i) => i + 1)
          .filter(id => payload[`SendMessageBatchRequestEntry.${id}.Id`])

        const messages = ids.map(id => {
          const body = payload[`SendMessageBatchRequestEntry.${id}.MessageBody`]
          const messageId = payload[`SendMessageBatchRequestEntry.${id}.Id`]
          id = uuid.v4()
          const md5 = crypto
            .createHash('md5')
            .update(body)
            .digest('hex')
          return {
            type: 'put',
            messageId,
            key: `message!${queueUrl}!${id}`,
            value: { body, md5, id }
          }
        })
        await db.batch(messages)
        res.end(xmlResponse.sendMessageBatch(messages))
      } else {
        res.writeHead(400)
        res.end(`${action} not supported`)
      }
    }
  }
}).start(9324)
