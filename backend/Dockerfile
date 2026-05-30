# Backend — Node.js + Express + Prisma (Multi-Stage Build)
# Stage 1: Builder — install all dependencies and compile
FROM node:22-alpine AS builder

WORKDIR /app/backend

# Copy package files only (for better layer caching)
COPY backend/package*.json ./

# Install all dependencies (including dev deps for building)
RUN npm ci

# Copy source code
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Runtime — minimal production image
FROM node:22-alpine

WORKDIR /app/backend

# Copy everything from builder (keep all node_modules for dev mode)
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY backend/package*.json ./
COPY backend/src ./src

# Clean up unnecessary files to reduce image size
# Keep dev dependencies since this is development mode
RUN find node_modules -type f \( -name "*.md" -o -name "*.map" \) -delete 2>/dev/null || true && \
    find node_modules -type d \( -name ".bin" \) -prune -o -type f -name "*.ts" -delete 2>/dev/null || true

# Port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Start: apply migrations, seed, then run dev server
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && npm run dev"]
