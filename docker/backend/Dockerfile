FROM node:20 AS development

WORKDIR /app

COPY . .

RUN yarn 

EXPOSE 3000

CMD ["yarn", "workspace", "backend", "start:debug"]

FROM node:20 AS production

WORKDIR /app

COPY . . 

RUN yarn 

RUN yarn workspace backend build

EXPOSE 3000

CMD ["yarn", "workspace", "backend", "start:prod"]

