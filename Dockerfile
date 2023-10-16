FROM node:18

WORKDIR /app

# COPY . .

RUN yarn 

CMD ["yarn", "workspace", "smoelenboek-backend", "dev"]
