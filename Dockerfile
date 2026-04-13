# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci (more reliable)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies for production
RUN npm ci --omit=dev

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
