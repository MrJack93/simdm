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
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "run", "dev"]
