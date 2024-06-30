FROM node:20

WORKDIR /app

COPY . .
RUN npm install -g typescript 
RUN yarn
RUN yarn workspace smoelenboek-backend tsc --showConfig
RUN yarn workspace smoelenboek-backend compile
CMD ["node", "--env-file", ".env", "packages/smoelenboek-backend/dist/index.js"]
