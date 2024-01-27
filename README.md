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

## Project Structure

* [Look here](./PROJECT_STRUCTURE.md)

## WhatsApp-Api-NodeJs

This code is an implementation of [WhiskeySockets](https://github.com/WhiskeySockets/Baileys), as a RestFull Api service, which controls whatsapp functions.</br>
With this one you can create multiservice chats, service bots or any other system that uses whatsapp. With this code you don't need to know javascript for nodejs , just start the server and make the language requests that you feel most comfortable with.

## Infrastructure

### 1. Docker installation

* First, let's install Docker. Docker is a platform that allows us to quickly create, test and deploy applications in isolated environments called containers.

```sh
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ${USER}
```

### 2. Installing the database

> PostgreSql [required]

* Now, we have configured our PostgreSQL database using Docker Compose.
* Access your postgre manager and create a database.

[compose from postgres](./postgres/docker-compose.yaml)

### 3. Nvm installation

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
>
> After finishing, restart the terminal to load the new information.
>

#### 3.1 Nodejs installation

* Installing Node.js using NVM, a version manager that allows us to switch between different versions of Node.js easily.

```sh
nvm install 20
```

### 4. pm2 installation
```sh
npm i -g pm2
```

### 5. Application startup

Cloning the Repository
```
git clone https://github.com/code-chat-br/whatsapp-api.git
```

Go to the project directory and install all dependencies.

>
> Give preference to **npm** as it has greater compatibility.
>

```sh
cd whatsapp-api-v2

npm install
# or
npm install --force
```

### 6. Environment variables
See additional settings that can be applied through the **env** file by clicking **[here](./.env.dev)**.

> **⚠️Attention⚠️:** copy the **.env.dev** file to **.env**.
```sh
cp .env.dev .env
```

### 7. Prism ORM

* We're going to use Prisma ORM to manage our database. Prisma simplifies database access and ensures operations are secure and easy to maintain.
* **Commands and Explanations:**
  * **In development environment: npx prisma migrate dev**
    * We use `migrate dev` in development to automatically create and apply migrations, making working with the database easier.
  * **In production environment: npx prisma migrate deploy**
    * In production, we use `migrate deploy` to apply migrations in a controlled and secure way.
  * **Data visualization: npx prisma studio**
    * Prisma Studio is a visual tool that helps us manage and visualize bank data in an intuitive way.

Define the [DATABASE_URL](https://github.com/code-chat-br/whatsapp-api/blob/6d0ab3e27932c5d1a6d8275dc3c6cb5097ff099e/.env.dev#L48) environment variable for the database deployment.

* Performing the database [deployment](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-deploy).
```sh
bash deploy_db.sh
```

Finally, run the command below to start the application:
```sh
npm run start:dev

npm run start:prod

# pm2
pm2 start 'npm run start:prod' --name CodeChat_API_v1.3.0
```
---

## Swagger - OpenAPI 3.0.0

* Route: `http://localhost:8083/docs`
* YAML file: [swagger.yaml](./src/docs/swagger.yaml)

## Authentication

You can define two authentication **types** for the routes in the **[env file](./env.dev)**.
Authentications must be inserted in the request header.

1. **jwt:** A JWT is a standard for authentication and information exchange defined with a signature.

> Authentications are generated at instance creation time.

**Note:** There is also the possibility to define a global api key, which can access and control all instances.

### App in Docker
  - [docker-compose](./docker-compose.yml)
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