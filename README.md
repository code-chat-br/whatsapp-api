</br>
<hr style="height: 5px;background: #007500;margin: 20px 0;box-shadow: 0px 3px 5px 0px rgb(204 204 204);">

<div align="center">

[![Telegram Group](https://img.shields.io/badge/Group-Telegram-%2333C1FF)](https://t.me/codechatBR)
[![Whatsapp Group](https://img.shields.io/badge/Group-WhatsApp-%2322BC18)](https://chat.whatsapp.com/HyO8X8K0bAo0bfaeW8bhY5)
[![License](https://img.shields.io/badge/license-GPL--3.0-orange)](./LICENSE)
[![Support](https://img.shields.io/badge/Buy%20me-coffe-orange)](https://app.picpay.com/user/cleber.wilson.oliveira)
[![Support](https://img.shields.io/badge/Buy%20me%20coffe-pix-blue)](#pix-2b526ada-4ef4-4db4-bbeb-f60da2421fce)

</div>
  
<div align="center"><img src="./public/images/cover.png"></div>

## WhatsApp-Api-NodeJs

This code is an implementation of [Baileys](https://github.com/WhiskeySockets/Baileys), as a RestFull Api service, which controls whatsapp functions.</br>
With this one you can create multiservice chats, service bots or any other system that uses whatsapp. With this code you don't need to know javascript for nodejs , just start the server and make the language requests that you feel most comfortable with.

## Infrastructure

### Nvm installation

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```
>
> After finishing, restart the terminal to load the new information.
>

### Docker installation \[optional\]

```sh
curl -fsSL https://get.docker.com -o get-docker.sh

sudo sh get-docker.sh

sudo usermod -aG docker ${USER}
```
### Nodejs installation

```sh
nvm install 20
```

### pm2 installation
```sh
npm i -g pm2
```

```sh
docker --version

node --version
```
## PostgreSql [required]

After installing docker and docker-compose, up the container.
  - [compose from postgres](./postgres/docker-compose.yaml)

In the same directory where the file is located, run the following command:
```sh
bash docker.sh
```
Using the database is optional.

## Application startup

Cloning the Repository
```
git clone https://github.com/code-chat-br/whatsapp-api.git
```

Go to the project directory and install all dependencies.

### Database Setup

#### Usando o Prisma ORM

O aplicativo aproveita o Prisma ORM para lidar com operações de banco de dados. O Prisma simplifica o acesso, a migração e o gerenciamento de banco de dados.

Em ambiente de desenvolvimento:
```sh
npx prisma migrate dev
```

Em ambiente de produção:

```sh
nps prisma migrate deploy
```

#### Estúdio prisma

Veja os seus dados:
```sh
npx prisma studio
```

>
> Give preference to **npm** as it has greater compatibility.
>

```sh
cd whatsapp-api-v2

npm install --force
```

Finally, run the command below to start the application:
```sh
npm run start:dev

npm run start:prod

# pm2
pm2 start 'npm run start:prod' --name ApiCodechat
```

## Swagger - OpenAPI 3.0.0

* Route: `http://localhost:8083/docs`
* YAML file: [swagger.yaml](./src/docs/swagger.yaml)

## Authentication

You can define two authentication **types** for the routes in the **[env file](./dev-env.yml)**.
Authentications must be inserted in the request header.

1. **jwt:** A JWT is a standard for authentication and information exchange defined with a signature.

> Authentications are generated at instance creation time.

**Note:** There is also the possibility to define a global api key, which can access and control all instances.

### App in Docker
  - [docker-compose](./docker-compose.yml)
  - [env for docker](./Docker/.env)
  - [DockerHub-codechat/api](https://hub.docker.com/r/codechat/api)

After building the application, in the same directory as the files above, run the following command:
```sh
docker-compose up
```
## Send Messages
|     |   |
|-----|---|
| Send Text | ✔ |
| Send Buttons | ❌ |
| Send Template | ❌ |
| Send Media: audio - video - image - document - gif <br></br>base64: ```true``` | ✔ |
| Send Media File | ✔ |
| Send Audio type WhatsApp | ✔ |
| Send Audio type WhatsApp - File | ✔ |
| Send Location | ✔ |
| Send List | ❌ |
| Send Link Preview | ❌ |
| Send Contact | ✔ |
| Send Reaction - emoji | ✔ |

## Postman collections
  - [Postman Json](./postman.json)
  - [![Run in Postman](https://run.pstmn.io/button.svg)](https://elements.getpostman.com/redirect?entityId=14064846-194eec6c-c3d6-48d1-9660-93d8085fd83a&entityType=collection)

## Webhook Events

| Name | Event | TypeData | Description |
|------|-------|-----------|------------|
| QRCODE_UPDATED | qrcode.updated | json | Sends the base64 of the qrcode for reading |
| CONNECTION_UPDATE | connection.update | json | Informs the status of the connection with whatsapp |
| MESSAGES_SET | message.set | json | Sends a list of all your messages uploaded on whatsapp</br>This event occurs only once |
| MESSAGES_UPSERT | message.upsert | json |  Notifies you when a message is received |
| MESSAGES_UPDATE | message.update | json | Tells you when a message is updated |
| SEND_MESSAGE | send.message | json | Notifies when a message is sent |
| CONTACTS_SET | contacts.set | json | Performs initial loading of all contacts</br>This event occurs only once |
| CONTACTS_UPSERT | contacts.upsert | json | Reloads all contacts with additional information</br>This event occurs only once |
| CONTACTS_UPDATE | contacts.update | json | Informs you when the chat is updated |
| PRESENCE_UPDATE | presence.update | json |  Informs if the user is online, if he is performing some action like writing or recording and his last seen</br>'unavailable' | 'available' | 'composing' | 'recording' | 'paused' |
| CHATS_SET | chats.set | json | Send a list of all loaded chats |
| CHATS_UPDATE | chats.update | json | Informs you when the chat is updated |
| CHATS_UPSERT | chats.upsert | json | Sends any new chat information |
| GROUPS_UPSERT | groups.upsert | JSON | Notifies when a group is created |
| GROUPS_UPDATE | groups.update | JSON | Notifies when a group has its information updated |
| GROUP_PARTICIPANTS_UPDATE | group-participants.update | JSON | Notifies when an action occurs involving a participant</br>'add' | 'remove' | 'promote' | 'demote' |
| NEW_TOKEN | new.jwt | JSON | Notifies when the token (jwt) is updated

## Env File

See additional settings that can be applied through the **env** file by clicking **[here](./.env.dev)**.

> **⚠️Attention⚠️:** copy the **.env.dev** file to **.env**.

## SSL

To install the SSL certificate, follow the **[instructions](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal)** below.

# Note

This code is in no way affiliated with WhatsApp. Use at your own discretion. Don't spam this.

This code was produced based on the baileys library and it is still under development.

# Donate to the project.

#### Pix: 2b526ada-4ef4-4db4-bbeb-f60da2421fce

#### PicPay

<div align="center">
  <a href="https://app.picpay.com/user/cleber.wilson.oliveira" target="_blank" rel="noopener noreferrer">
    <img src="./public/images/picpay-image.png" style="width: 50% !important;">
  </a>
</div>

</br>