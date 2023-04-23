#!/bin/bash

NET='codechat-net'
IMAGE='codechat/api:git'

if !(docker network ls | grep ${NET} > /dev/null)
then
  docker network create -d bridge ${NET}
fi

sudo mkdir -p /data/instances

docker build -t ${IMAGE} .

# docker run --restart 'always' --name 'codechat_api' --mount 'type=bind,source=/data/instances,target=/home/api/instances' --publish '8083:8083' --hostname 'codechat' --network ${NET} ${IMAGE}

docker run -d --restart 'always' --name 'codechat_api' --mount 'type=bind,source=/data/instances,target=/codechat/instances' --publish '8083:8083' --hostname 'codechat' --network ${NET} ${IMAGE}
