const { test } = require('tap')
const SQS = require('./sqs')
const rimraf = require('rimraf')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

let server

!process.env.NO_SERVER &&
  test('start server', t => {
    rimraf('/tmp/sqs-db', err => {
      t.error(err, 'remove db')
      server = spawn(
        'node',
        [path.join(__dirname, '../src')],
        process.env.DEBUG
          ? {
            stdio: 'inherit'
          }
          : {}
      )
      process.on('exit', server.kill.bind(server))
      t.end()
    })
  })

test('server ready', t => {
  ;(function ping () {
    const request = http.get('http://localhost:9324/ping', res => {
      if (res.statusCode === 200) return t.end()
      setTimeout(ping, 300)
    })
    request.on('error', setTimeout.bind(null, ping, 300))
  })()
})

test('create queue', t => {
  t.plan(1)
  const sqs = SQS()
  const params = {
    QueueName: 'q'
  }
  sqs.createQueue(params, err => {
    t.error(err, 'create queue')
  })
})

test('list queues', t => {
  t.plan(2)
  const sqs = SQS()
  sqs.listQueues((err, { QueueUrls: queues }) => {
    t.error(err, 'list queues')
    t.equals('http://localhost:9324/queue/q', queues.toString())
  })
})

test('send and receive using sendMessage, receiveMessage and deleteMessage', t => {
  const q = 'http://localhost:9324/queue/q'
  const sqs = SQS()
  let messageCount = 0
  const poll = () => {
    sqs.receiveMessage(
      { QueueUrl: q, WaitTimeSeconds: 0.1 },
      (err, { Messages: messages }) => {
        t.error(err)
        if (!messages) {
          if (messageCount === 1) {
            t.end()
            return
          } else {
            return process.nextTick(poll)
          }
        }
        messageCount += messages.length
        sqs.deleteMessage(
          { QueueUrl: q, ReceiptHandle: messages[0].ReceiptHandle },
          err => {
            t.error(err)
            process.nextTick(poll)
          }
        )
      }
    )
  }
  poll()
  sqs.sendMessage(
    { QueueUrl: q, MessageBody: JSON.stringify('first-message') },
    err => {
      t.error(err)
    }
  )
})

test('send and receive 10 messages using sendMessage, receiveMessage and deleteMessage', t => {
  const q = 'http://localhost:9324/queue/q'
  const sqs = SQS()
  let messageCount = 0
  const poll = () => {
    sqs.receiveMessage(
      { QueueUrl: q, WaitTimeSeconds: 0.1 },
      (err, { Messages: messages }) => {
        t.error(err)
        if (!messages) {
          if (messageCount === 10) {
            t.end()
            return
          } else {
            return process.nextTick(poll)
          }
        }
        messageCount += messages.length
        let pendingDelete = messages.length
        for (let i = 0; i < pendingDelete; i++) {
          sqs.deleteMessage(
            { QueueUrl: q, ReceiptHandle: messages[i].ReceiptHandle },
            err => {
              t.error(err)
              pendingDelete--
              if (!pendingDelete) {
                process.nextTick(poll)
              }
            }
          )
        }
      }
    )
  }
  poll()

  for (let i = 0; i < 10; i++) {
    sqs.sendMessage({ QueueUrl: q, MessageBody: i.toString() }, err => {
      t.error(err)
    })
  }
})

test('send and receive 5000 messages using sendMessageBatch, receiveMessage and deleteMessageBatch', t => {
  const q = 'http://localhost:9324/queue/q'
  const sqs = SQS()
  const expectedMessageCount = 5000
  let messageCount = 0
  const payloads = [...Array(expectedMessageCount)].map(() => Math.random())
  const sum = payloads.reduce((a, b) => a + b)
  messageCount = 0
  const poll = () => {
    sqs.receiveMessage({ QueueUrl: q, WaitTimeSeconds: 0.4 }, (err, data) => {
      t.error(err)
      const { Messages: messages } = data
      if (!messages) {
        if (messageCount === expectedMessageCount) {
          const diff = Math.max(poll.sum, sum) - Math.min(poll.sum, sum)
          t.ok(diff < 0.00000000001, 'sum ok')
          t.end()
          return
        } else {
          return process.nextTick(poll)
        }
      }
      messageCount += messages.length
      poll.sum += messages.map(x => Number(x.Body)).reduce((a, b) => a + b)
      sqs.deleteMessageBatch(
        {
          QueueUrl: q,
          Entries: messages.map(x => ({
            Id: x.MessageId,
            ReceiptHandle: x.ReceiptHandle
          }))
        },
        err => {
          t.error(err)
          process.nextTick(poll)
        }
      )
    })
  }
  poll.sum = 0
  poll()

  const batches = []
  let i = 0
  while (payloads.length) {
    batches.push(payloads.splice(0, 10))
  }
  for (const batch of batches) {
    const Entries = batch.map((x, j) => ({
      Id: (++i + j + 1).toString(),
      MessageBody: x.toString()
    }))
    const params = {
      QueueUrl: q,
      Entries
    }
    sqs.sendMessageBatch(params, err => {
      t.error(err)
    })
  }
})

!process.env.NO_SERVER &&
  test('stop server', t => {
    if (server) server.kill()
    t.end()
  })
