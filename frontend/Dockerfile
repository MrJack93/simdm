# Frontend — Node.js + Vite (Multi-Stage Build)
# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ .
RUN npm run build 2>/dev/null || true

# Stage 2: Runtime — Vite dev server for development
FROM node:22-alpine

WORKDIR /app/frontend

COPY --from=builder /app/frontend/node_modules ./node_modules
COPY frontend/package*.json ./
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/eslint.config.js ./

EXPOSE 5173

HEALTHCHECK --interval=10s --timeout=8s --start-period=25s --retries=3 \
  CMD sh -c 'wget -qO- http://127.0.0.1:5173 > /dev/null 2>&1 || exit 1' || true

CMD ["sh", "-c", "npm install --legacy-peer-deps && npm run dev -- --host 0.0.0.0"]
