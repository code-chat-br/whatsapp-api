#!/bin/bash

NET='codechat-net'
IMAGE='codechat/api:local'

# Check if the network exists and create it if not
if !(docker network ls | grep -q ${NET})
then
  docker network create -d bridge ${NET}
fi

# Create the directory for the bind mount if it does not exist
if [ ! -d "/data/instances" ]; then
  sudo mkdir -p /data/instances
fi

# Build the Docker image
docker build -t ${IMAGE} .

# Run the Docker container
docker run -d --restart 'always' --name 'codechat_api' --mount 'type=bind,source=/data/instances,target=/codechat/instances' --publish '8083:8083' --hostname 'codechat' --network ${NET} ${IMAGE}
