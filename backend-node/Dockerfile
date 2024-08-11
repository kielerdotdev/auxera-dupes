#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:15.6.0-alpine AS builder

RUN apk add lua lua-cjson  

WORKDIR /app

ARG GITHUB_TOKEN
COPY . .

RUN yarn
RUN yarn build

CMD [ "yarn", "start" ]

EXPOSE 3000
