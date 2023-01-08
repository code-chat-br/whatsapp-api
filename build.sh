#!/bin/sh

source "$(pwd)/.sh/progress.sh"

if [ "$DOCKER_ENV" = "true" ];
then
  echo -en "\x1b[33mEnabling environment variables for Docker\n\r"
  echo -en "\x1b[33mDOCKER_ENV=$DOCKER_ENV\n\r"
fi

start_spinner "\x1b[36m > removing dist \x1b[0m"
rm -rf ./dist
stop_spinner $?

echo
start_spinner "\x1b[36m > transpiling... \x1b[0m"
tsc
cp ./src/env.yml ./dist/src
stop_spinner $?

echo
echo -en "\x1b[1m\x1b[34m > Successfully build \x1b[0m "
echo

echo
start_spinner "\e[1;32m > Starting application... \x1b[0m"
sleep 2
stop_spinner $?
echo
node ./dist/src/main.js


