FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]