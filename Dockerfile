FROM node:22.6.0-alpine3.20

WORKDIR /app

COPY package*.json ./

RUN npm install --include=optional

COPY . .

EXPOSE 9000

RUN mv docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["docker-entrypoint.sh"]
