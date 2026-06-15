---
description: "Check Docker Compose stack status and backend connectivity"
---

# Docker Status

Quick check of the SIMDM Docker Compose stack: PostgreSQL + Backend + Frontend.

## Usage

```
/docker-status
```

## Procedure

1. Show container status:
   ```bash
   docker compose ps
   ```

2. Wait for health checks to stabilize (if containers are starting):
   ```bash
   until docker compose ps 2>/dev/null | grep "frontend" | grep -vq "health: starting"; do sleep 3; done
   ```

3. Test backend connectivity:
   ```bash
   curl -s http://localhost:3001/api/health && echo "" && \
   curl -s -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"inginer","password":"admin"}' | head -c 150
   ```

4. Report: ✅ All services healthy / ⚠️ Some starting / ❌ Down

## Expected containers

| Container | Port | Role |
|-----------|------|------|
| simdm-postgres | 5432 | PostgreSQL 16 |
| simdm-backend | 3001 | Express 5.2 API |
| simdm-frontend | 5173 | React + Vite dev server |
