### BASE IMAGE
FROM node:24-bullseye-slim AS base

### BUILD IMAGE
FROM base AS builder

WORKDIR /codechat

# Instalar dependências de construção primeiro
RUN apt-get update && apt-get install -y git ffmpeg && rm -rf /var/lib/apt/lists/*

# Copiar arquivos package.json e instalar dependências
COPY package*.json ./
RUN npm install --force

# Copiar os demais arquivos necessários para o build
COPY tsconfig.json .
COPY ./src ./src
COPY ./public ./public
COPY ./docs ./docs
COPY ./prisma ./prisma
COPY ./views ./views
COPY .env.dev .env
COPY prisma.config.mjs .

# Definir variável de ambiente para a construção
ENV DATABASE_URL=postgres://postgres:pass@localhost/db_test
RUN npx prisma generate

RUN npm run build

### PRODUCTION IMAGE
FROM base AS production

WORKDIR /codechat

LABEL com.api.mantainer="https://github.com/code-chat-br"
LABEL com.api.repository="https://github.com/code-chat-br/whatsapp-api"
LABEL com.api.issues="https://github.com/code-chat-br/whatsapp-api/issues"

# Copiar arquivos construídos do estágio builder
COPY --from=builder /codechat/dist ./dist
COPY --from=builder /codechat/docs ./docs
COPY --from=builder /codechat/prisma ./prisma
COPY --from=builder /codechat/views ./views
COPY --from=builder /codechat/node_modules ./node_modules
COPY --from=builder /codechat/package*.json ./
COPY --from=builder /codechat/.env ./
COPY --from=builder /codechat/prisma.config.mjs ./
COPY --from=builder /codechat/public ./public
COPY ./deploy_db.sh ./

RUN chmod +x ./deploy_db.sh

RUN mkdir instances

ENV DOCKER_ENV=true

ENTRYPOINT [ "/bin/bash", "-c", ". ./deploy_db.sh && node ./dist/src/main" ]
