FROM node:16.17.0

LABEL version="2.0.0" description="Api to control whatsapp features through http requests." 
LABEL maintainer="Cleber Wilson" git="https://github.com/jrCleber"
LABEL contact="suporte@codechat.rest"

RUN apt-get update -y
RUN apt-get upgrade -y

WORKDIR /~/Projects

COPY . .

# Set this value to "true" to enable environment variables for the container
ENV DOCKER_ENV=true

RUN npm i

EXPOSE 8080

CMD [ "npm", "run", "start:prod" ]
