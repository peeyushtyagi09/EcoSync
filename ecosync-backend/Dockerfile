FROM node:18-alpine

WORKDIR /app

# Copy package files first (to use Docker caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend project
COPY . .

ENV NODE_ENV=production

# Your backend entry point
CMD ["node", "server.js"]
