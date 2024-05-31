FROM node:20-bullseye-slim

WORKDIR /worker

LABEL API_VERSION="0.0.1"
LABEL MANTAINER="https://github.com/code-chat-br"
LABEL REPOSITORY="https://github.com/code-chat-br/whatsapp-api"

COPY package*.json ./

RUN apt-get update && apt-get install -y git && npm install

COPY ./index.mjs .

RUN mkdir instances

ENV DOCKER_ENV=true

ENTRYPOINT [ "npm", "start" ]
