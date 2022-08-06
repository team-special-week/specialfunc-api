FROM ubuntu:latest
MAINTAINER ballbot <5252bb@daum.net>

RUN mkdir -p /app/dist
WORKDIR /app
COPY ./dist /app/dist
COPY ./package-lock.json /app
COPY ./package.json /app
COPY ./nest-cli.json /app

RUN apt-get update
RUN apt-get install curl --yes
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install nodejs --yes
RUN npm ci

EXPOSE 3000
CMD ["node", "/app/dist/main.js"]
