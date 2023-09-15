FROM node:alpine

WORKDIR /app

COPY ./package*.json .

COPY ./packages/smoelenboek-frontend ./packages/smoelenboek-frontend
COPY ./packages/smoelenboek-types ./packages/smoelenboek-types

RUN yarn workspace smoelenboek-frontend install

WORKDIR /app/packages/smoelenboek-frontend
CMD ["yarn", "dev"]
