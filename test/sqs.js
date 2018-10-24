const AWS = require('aws-sdk')

const local = {
  endpoint: 'http://localhost:9324',
  region: 'elasticmq',
  accessKeyId: 'x',
  secretAccessKey: 'x'
}

module.exports = () => new AWS.SQS(local)
