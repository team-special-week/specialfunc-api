FROM docker:latest
MAINTAINER ballbot <5252bb@daum.net>

RUN mkdir -p /app/dist
WORKDIR /app
COPY ./ /app

RUN apk add --update nodejs npm
RUN apk --update add redis 
RUN npm ci
RUN npm run build

EXPOSE 3000
ENTRYPOINT ["node", "/app/dist/main.js"]
