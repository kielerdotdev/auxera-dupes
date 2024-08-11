#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:15-alpine
RUN apk add bash

ENV STORAGE_DIR /storage
VOLUME /storage

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

CMD ["./start.sh"]

EXPOSE 3000
