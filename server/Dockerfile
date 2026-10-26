# EduSetu Backend Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install native compilation dependencies for bcrypt / crypto packages
RUN apk add --no-cache python3 make g++

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend REST & WebSocket port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Node.js production server
CMD ["node", "src/server.js"]
