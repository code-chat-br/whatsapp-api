### BASE IMAGE
FROM node:24-bullseye-slim AS base

# Opcional: timezone/locale mínimos, se precisar.
# RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*

### BUILD IMAGE
FROM base AS builder
WORKDIR /codechat

# Dependências de SO necessárias no build (git/ffmpeg se usados em build)
RUN apt-get update && apt-get install -y git ffmpeg && rm -rf /var/lib/apt/lists/*

# Instalar TODAS as deps (inclui dev) para conseguir rodar tsc
COPY package*.json ./
# Use npm ci para builds reprodutíveis
RUN npm i --force

# Copiar código
COPY tsconfig.json .
COPY ./src ./src
COPY ./public ./public
COPY ./docs ./docs
COPY ./prisma ./prisma
COPY ./views ./views
COPY .env.dev .env

# Variável para gerar Prisma Client (não precisa apontar p/ DB real)
ENV DATABASE_URL="mysql://mysql:pass@localhost/db_test"

# Gerar prisma e compilar TS -> JS
RUN npx prisma generate
RUN npm run build

# Remover devDependencies para preparar node_modules "de produção"
# RUN npm prune --omit=dev

### PRODUCTION IMAGE
FROM base AS production
WORKDIR /codechat

# Instale apenas o que o app precisa em runtime (ex.: ffmpeg)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

LABEL com.api.version="1.3.3" \
      com.api.mantainer="https://github.com/code-chat-br" \
      com.api.repository="https://github.com/code-chat-br/whatsapp-api" \
      com.api.issues="https://github.com/code-chat-br/whatsapp-api/issues"

# Copiar artefatos já prontos e node_modules podado
COPY --from=builder /codechat/dist ./dist
COPY --from=builder /codechat/docs ./docs
COPY --from=builder /codechat/prisma ./prisma
COPY --from=builder /codechat/views ./views
COPY --from=builder /codechat/public ./public
COPY --from=builder /codechat/package*.json ./
COPY --from=builder /codechat/.env ./
COPY --from=builder /codechat/node_modules ./node_modules
COPY ./deploy_db.sh ./

RUN chmod +x ./deploy_db.sh && mkdir -p instances

ENV DOCKER_ENV=true

# Se seu deploy_db.sh precisa do shell, mantenha o bash -c
ENTRYPOINT ["/bin/bash", "-c", ". ./deploy_db.sh && node ./dist/src/main"]
