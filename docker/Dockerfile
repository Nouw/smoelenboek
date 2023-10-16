FROM node:20

WORKDIR /app

COPY . .

RUN yarn

# CMD ["yarn", "workspace", "smoelenboek-backend", "compile"]
CMD ["yarn", "workspace", "smoelenboek-backend", "start:dev"]
