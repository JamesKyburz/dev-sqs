FROM jameskyburz/node:10.16.1-alpine-devtools as devtools

LABEL maintainer="James Kyburz james.kyburz@gmail.com"

WORKDIR /usr/src/app

ENV NPM_CONFIG_LOGLEVEL warn

COPY package.json package-lock*.json npm-shrinkwrap*.json /usr/src/app/
RUN npm i

FROM node:10.16.1-alpine

WORKDIR /usr/src/app

COPY . /usr/src/app
COPY --from=devtools /usr/src/app/node_modules /usr/src/app/node_modules

USER node

ENTRYPOINT ["node", "src/index"]
CMD []
