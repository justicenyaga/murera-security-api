#!/bin/sh

if [ "$NODE_ENV" = "development" ]; then
  npm install -g nodemon
  exec nodemon
elif [ "$NODE_ENV" = "production" ]; then
  exec npm start
fi
