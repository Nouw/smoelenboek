FROM node:20

WORKDIR /app

COPY . .
RUN yarn 
RUN npm install -g typescript 
RUN yarn && yarn workspace smoelenboek-backend compile
CMD ["node", "--env-file", ".env", "packages/smoelenboek-backend/dist/index.js"]
