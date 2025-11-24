FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src

# Persist deviceKey config
VOLUME [ "/root/.ecosync" ]

CMD ["node", "src/collector.js"]
