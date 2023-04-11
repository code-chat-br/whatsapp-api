#!/bin/bash

NET='codechat-net'

if !(docker network ls | grep ${NET} > /dev/null)
then
  docker network create -d bridge ${NET}
fi

sudo mkdir -p /data/instances

docker build -t whatsappapi/codechat .

# docker run --restart 'always' --name 'api-codechat' --mount 'type=bind,source=/data/instances,target=/home/api/instances' --publish '8083:8083' --hostname 'codechat-api' --network ${NET} whatsappapi/codechat:latest

docker run --restart 'always' -d --name 'api-codechat' --mount 'type=bind,source=/data/instances,target=/home/api/instances' --publish '8083:8083' --hostname 'codechat-api' --network ${NET} whatsappapi/codechat:latest
                                                                                         