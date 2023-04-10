#!/bin/sh

if [ "$DOCKER_ENV" = "true" ];
then
  cp ./src/env.yml ./dist/src
  echo "Enabling environment variables for Docker"
  echo "DOCKER_ENV=$DOCKER_ENV"
  echo
fi
echo "> removing dist"
rm -rf ./dist
echo
echo "> transpiling..."
tsc

echo
echo "> Successfully build "

echo
echo "> Starting application..."
echo
node ./dist/src/main.js
