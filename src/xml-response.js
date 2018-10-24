const escapeXml = require('xml-escape')
const uuid = require('uuid')
const crypto = require('crypto')
const blankMd5 = crypto
  .createHash('md5')
  .update('')
  .digest('hex')

module.exports = {
  listQueues (queues) {
    return `
    <ListQueuesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ListQueuesResult>
        ${queues.map(url => `<QueueUrl>${url}</QueueUrl>`)}
      </ListQueuesResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ListQueuesResponse>
    `
  },
  createQueue (queueUrl) {
    return `
    <CreateQueueResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <CreateQueueResult>
        <QueueUrl>${queueUrl}</QueueUrl>
      </CreateQueueResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </CreateQueueResponse>
    `
  },
  receiveMessage (messages) {
    return `
    <ReceiveMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ReceiveMessageResult>
      ${messages
    .map(
      x => `
        <Message>
          <MessageId>${uuid.v4()}</MessageId>
          <ReceiptHandle>${x.value.id}</ReceiptHandle>
          <MD5OfBody>${x.value.md5}</MD5OfBody>
          <Body>${escapeXml(x.value.body)}</Body>
        </Message>
      `
    )
    .join('\n')}
      </ReceiveMessageResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </ReceiveMessageResponse>
    `
  },
  sendMessage ({ md5, id }) {
    return `
    <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <SendMessageResult>
        <MD5OfMessageAttributes>${blankMd5}</MD5OfMessageAttributes>
        <MD5OfMessageBody>${md5}</MD5OfMessageBody>
        <MessageId>${id}</MessageId>
      </SendMessageResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </SendMessageResponse>
    `
  },
  sendMessageBatch (messages) {
    return `
    <SendMessageBatchResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <SendMessageBatchResult>
        ${messages
    .map(
      message => `
          <SendMessageBatchResultEntry>
            <Id>${message.messageId}</Id>
            <MD5OfMessageAttributes>${blankMd5}</MD5OfMessageAttributes>
            <MD5OfMessageBody>${message.value.md5}</MD5OfMessageBody>
            <MessageId>${message.value.id}</MessageId>
          </SendMessageBatchResultEntry>
      `
    )
    .join('\n')}
      </SendMessageBatchResult>
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </SendMessageBatchResponse>
    `
  },
  deleteMessage () {
    return `
    <DeleteMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </DeleteMessageResponse>
    `
  },
  deleteMessageBatch (messages) {
    return `
    <DeleteMessageBatchResponse>
        <DeleteMessageBatchResult>
          ${messages
    .map(
      x => `
            <DeleteMessageBatchResultEntry>
                <Id>${x.id}</Id>
            </DeleteMessageBatchResultEntry>
          `
    )
    .join('\n')}
        </DeleteMessageBatchResult>
        <ResponseMetadata>
            <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
        </ResponseMetadata>
    </DeleteMessageBatchResponse>
    `
  }
}
