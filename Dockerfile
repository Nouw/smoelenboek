FROM node:20

WORKDIR /app

COPY . .
RUN npm install -g typescript 
RUN yarn
RUN npx tsc --showConfig
RUN yarn workspace smoelenboek-backend compile
CMD ["node", "--env-file", ".env", "packages/smoelenboek-backend/dist/index.js"]
