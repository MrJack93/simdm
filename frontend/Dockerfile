# Frontend — Node.js + Vite (Multi-Stage Build)
# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app/frontend

# Copy package files only (for better layer caching)
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Stage 2: Runtime — minimal image
FROM node:22-alpine

WORKDIR /app/frontend

# Copy only what we need from builder
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY frontend/package*.json ./
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/eslint.config.js ./

# Port
EXPOSE 5173

# Health check with improved timeout
HEALTHCHECK --interval=10s --timeout=8s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173 || exit 1

# Start Vite dev server (bind to 0.0.0.0 for Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
