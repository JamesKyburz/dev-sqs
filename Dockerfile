FROM jameskyburz/node:10.13.0-alpine

LABEL maintainer="James Kyburz james.kyburz@gmail.com"

USER node

ENTRYPOINT ["node", "src/index"]
CMD []
