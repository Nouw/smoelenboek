FROM node:20

WORKDIR /app

COPY . .
RUN yarn 
RUN npm install -g typescript 
RUN yarn && yarn workspace smoelenboek-backend compile
CMD ["node", "packages/smoelenboek-backend/dist/index.js"]
