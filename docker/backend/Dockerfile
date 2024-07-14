FROM node:20

WORKDIR /app

COPY . .
RUN npm install -g typescript
RUN yarn
RUN yarn workspace backend build
CMD ["yarn", "workspace", "backend", "start:prod"]
