```sh
/whatsapp-api
├── /.github
│   └── /workflows
│       ├─ docker-image.yaml
│       └── release-tag.yaml
│
├── /.vscode
│   └── settings.json
│
├── /docs
│   └── swagger.yaml
│
├── /instances
│
├── /postgres
│   └── docker-compose.yaml
│
├── /prisma
│   ├── /migrations
│   └── schema.prisma
│
├── /public
│   ├── /css
│   │   └── dark-theme-swagger.css
│   └── /images
│
├── /src
│   ├── /cache
│   │   └── redis.ts
│   ├── /config
│   │   ├── env.config.ts
│   │   ├── error.config.ts
│   │   ├── event.config.ts
│   │   ├── logger.config.ts
│   │   ├── path.config.ts
│   │   └── swagger.config.ts
│   ├── /exceptions
│   │   ├── 400.exception.ts
│   │   ├── 401.exception.ts
│   │   ├── 403.exception.ts
│   │   ├── 404.exception.ts
│   │   ├── 500.exception.ts
│   │   └── index.ts
│   ├── /guards
│   │   ├── auth.guard.ts
│   │   └── instance.guard.ts
│   ├── /integrations
│   │   └── /minio
│   │       ├── minio.utils.ts
│   │       ├── s3.router.ts
│   │       └── s3.service.ts
│   ├── /middle
│   │   ├── error.middle.ts
│   │   └── logger.middle.ts
│   ├── /repository
│   │   └── repository.service.ts
│   ├── /utils
│   │   └── use-multi-file-auth-state-redis-db.ts
│   ├── /validate
│   │   ├── router.validate.ts
│   │   └── validate.schema.ts
│   ├── /whatsapp
│   │   ├── /controllers
│   │   │   ├── chat.controller.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── instance.controller.ts
│   │   │   ├── sendMessage.controller.ts
│   │   │   ├── views.controller.ts
│   │   │   └── webhook.controller.ts
│   │   ├── /dto
│   │   │   ├── chat.dto.ts
│   │   │   ├── group.dto.ts
│   │   │   ├── instance.dto.ts
│   │   │   ├── media.dto.ts
│   │   │   ├── sendMessage.dto.ts
│   │   │   └── webhook.dto.ts
│   │   ├── /routers
│   │   │   ├── chat.router.ts
│   │   │   ├── group.router.ts
│   │   │   ├── instance.router.ts
│   │   │   ├── sendMessage.router.ts
│   │   │   ├── views.router.ts
│   │   │   └── webhook.router.ts
│   │   └── /services
│   │       ├── instance.service.ts
│   │       ├── monitor.service.ts
│   │       ├── webhook.service.ts
│   │       └── whatsapp.service.ts
│   ├── app.module.ts
│   └── main.ts
│
├── /views
│   └── qrcode.hbd
│
├── .env.dev
├── .eslintrc.js
├── .gitignore
├── .prettierrc.js
├── CHANGELOG.md
├── deploy_db.sh
├── docker-compose.yaml
├── Dockerfile
├── LICENSE
├── package.json
├── PROJECT_STRUCTURE.md
├── README.md
├── start.sh
├── thunder-collection_codechat_v1.3.0.json
└── tsconfig.json
```