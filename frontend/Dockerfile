# Frontend — Node.js + Vite dev server
FROM node:22-alpine

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy all frontend files
COPY frontend/ .

# Port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173 || exit 1

# Start Vite dev server (bind to 0.0.0.0 for Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
