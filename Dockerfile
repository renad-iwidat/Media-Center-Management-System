# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies for production
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
