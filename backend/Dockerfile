# Backend — Node.js + Express + Prisma
FROM node:22-alpine

WORKDIR /app

# Copy entire backend folder
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci

# Copy all backend files
COPY backend/ .

# Prisma generate
RUN npx prisma generate

# Port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Start: apply migrations, seed, then run dev server
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && npm run dev"]
