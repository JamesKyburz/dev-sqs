# dev-sqs

[![npm version](https://img.shields.io/npm/v/dev-sqs.svg)](https://npm.im/dev-sqs)
[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![build status](https://api.travis-ci.org/JamesKyburz/dev-sqs.svg)](https://travis-ci.org/JamesKyburz/dev-sqs)
[![Docker Build Status](https://github.com/jameskyburz/dev-sqs/workflows/Docker%20Image%20CI/badge.svg)](https://github.com/JamesKyburz/dev-sqs/tree/master/.github/workflows)
[![downloads](https://img.shields.io/npm/dm/dev-sqs.svg)](https://npmjs.org/package/dev-sqs)
[![Docker Pulls](https://img.shields.io/docker/pulls/jameskyburz/dev-sqs.svg)](<>) [![Greenkeeper badge](https://badges.greenkeeper.io/JamesKyburz/dev-sqs.svg)](https://greenkeeper.io/)

# local development sqs

Only partial api support to support a local sqs for development purposes only.

Partial support for

- sendMessage
- sendMessageBatch
- receiveMessage
- deleteMessage
- deleteMessageBatch
- createQueue
- listQueues

No support for FIFO queues

## Node

```sh
npm start
```

## Docker

Docker images hosted at <https://hub.docker.com/r/jameskyburz/dev-sqs>

docker pull jameskyburz/dev-sqs

## Running in docker

```sh
ᐅ docker run \
  --name dev-sqs \
  -e LOG_PRETTY=1 \
  -p 9324:9324 \
  jameskyburz/dev-sqs
```

# license

[Apache License, Version 2.0](LICENSE)
