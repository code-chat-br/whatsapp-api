### BASE IMAGE
FROM node:18.16-bullseye-slim AS base

RUN apt update -y
RUN apt upgrade -y
RUN apt install -y git
RUN npm install -g npm

### BUILD IMAGE
FROM base AS builder

WORKDIR /codechat

COPY ./package.json .

RUN npm install

COPY ./tsconfig.json .
COPY ./src ./src

RUN npm run build

### RELEASE IMAGE
FROM base AS release

WORKDIR /codechat
COPY --from=builder /codechat/package*.json .
RUN npm ci --omit=dev

LABEL version="1.2.2" description="Api to control whatsapp features through http requests." 
LABEL maintainer="Cleber Wilson" git="https://github.com/jrCleber"
LABEL contact="contato@codechat.dev" whatsapp="https://chat.whatsapp.com/HyO8X8K0bAo0bfaeW8bhY5" telegram="https://t.me/codechatBR"

COPY --from=builder /codechat/dist .

COPY ./tsconfig.json .
COPY ./src ./src
RUN mkdir instances

EXPOSE 8080

# All settings must be in the env.yml file, passed as a volume to the container

CMD [ "node", "./src/main.js" ]

