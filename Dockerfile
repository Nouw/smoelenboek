FROM node:18

WORKDIR /usr/src/app

COPY ./ ./

RUN yarn set version 3.6.2

RUN yarn install

EXPOSE 8000

CMD ["yarn", "workspace", "smoelenboek-frontend", "dev"]
