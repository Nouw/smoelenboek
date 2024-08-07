FROM node:20

WORKDIR /app

COPY . .
RUN npm install -g typescript 
RUN yarn
RUN yarn workspace smoelenboek-types compile # First compile the types 
RUN yarn workspace smoelenboek-backend compile
CMD ["node", "--env-file", ".env", "packages/smoelenboek-backend/dist/index.js"]
