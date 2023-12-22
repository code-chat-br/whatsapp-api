### BASE IMAGE
FROM node:18.16-bullseye-slim AS base

### BUILD IMAGE
FROM base AS builder

WORKDIR /codechat

COPY package*.json ./
RUN npm i --force

COPY tsconfig.json .
COPY ./src ./src
COPY ./public ./public
COPY ./docs ./docs
COPY ./prisma ./prisma
COPY ./views ./views
COPY .env.dev .env

# Definindo a variável de ambiente DATABASE_URL aqui para a construção
ENV DATABASE_URL=postgres://postgres:pass@localhost/db_test
RUN npx prisma generate

RUN npm run build

### PRODUCTION IMAGE
FROM base AS production

WORKDIR /codechat

# Copiando arquivos construídos do estágio builder
COPY --from=builder /codechat/dist ./dist
COPY --from=builder /codechat/docs ./docs
COPY --from=builder /codechat/prisma ./prisma
COPY --from=builder /codechat/views ./views
COPY --from=builder /codechat/node_modules ./node_modules
COPY --from=builder /codechat/package*.json ./
COPY --from=builder /codechat/.env ./
COPY --from=builder /codechat/public ./public
COPY ./deploy_db.sh ./

RUN chmod +x ./deploy_db.sh

RUN mkdir instances

ENV DOCKER_ENV=true

ENTRYPOINT [ "/bin/bash", "-c", ". ./deploy_db.sh && node ./dist/src/main" ]
