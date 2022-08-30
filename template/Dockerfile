FROM alpine:latest

RUN ["adduser", "user0", "--disabled-password", "gecos ''"]
WORKDIR /home/user0

COPY ./function ./function
COPY ./runner-host ./runner-host
RUN chmod -R 777 /home/user0
RUN chown -R user0. /home/user0
RUN apk add --update nodejs npm

USER user0

WORKDIR /home/user0/function
RUN npm install

WORKDIR /home/user0/runner-host
RUN npm ci

EXPOSE 3000

ENTRYPOINT ["/usr/bin/node", "/home/user0/runner-host/index.js"]
