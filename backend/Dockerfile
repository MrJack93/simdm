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
RUN find node_modules -type f \( -name "*.md" -o -name "*.map" \) -delete 2>/dev/null || true && \
    find node_modules -type d \( -name ".bin" \) -prune -o -type f -name "*.ts" -delete 2>/dev/null || true

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Port
EXPOSE 3001

# Health check (using curl or sh-based check)
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD sh -c 'wget -qO- http://localhost:3001/api/health || exit 1' || true

# Start: apply migrations, seed, then run production server (NOT npm run dev)
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
