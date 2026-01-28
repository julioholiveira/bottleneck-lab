FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose ports if needed
EXPOSE 3000

# Command will be specified in docker-compose
CMD ["node", "dist/index.js"]
