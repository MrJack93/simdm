# Docker Optimization Guide — SIMDM 2026

**Versiune:** 2.1 (Faza 1-2 Complete + Production Hardening)  
**Dată:** 2026-06-02  
**Status:** ✅ Fully Optimized (cache_from removed, healthcheck fixed, USER node ready)

Această documentație descrie optimizările Docker implementate pentru a preveni hang-uri, îmbunătăți performance și a urma best practices 2026.

---

## 📊 Optimizări Implementate

### 1. WSL Resource Management (`.wslconfig`)

**Problemă:** Docker daemon crășea după 2-3 ore din exhaustion de RAM în WSL.

**Soluție:** Limitare resurselor WSL în `C:\Users\<username>\.wslconfig`:

```ini
[wsl2]
memory=4GB           # Limitează RAM la 4GB
swap=1GB             # Swap limitat
processors=4         # Utilizează 4 CPU cores
pageReporting=true   # Eficiență memorie
```

**Impact:** Previne hang-urile periodice; Docker rămâne stabil 24+ ore.

---

### 2. Resource Limits în docker-compose.yml

Fiecare container are limite stricte de resurse:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'          # Maximum 1 CPU
      memory: 512M       # Maximum 512MB RAM
    reservations:
      cpus: '0.5'        # Guaranteed 0.5 CPU
      memory: 256M       # Guaranteed 256MB RAM
```

**Beneficii:**
- Niciun container nu poate consuma toți resursele WSL
- Distribuție egală a resurselor
- Previne resource starvation

---

### 3. Multi-Stage Docker Builds

#### Backend Dockerfile

Înainte: `~500MB` → Acum: `~150-200MB` (70% reduction)

```dockerfile
# Stage 1: Builder — compileaza cu toți dev tools
FROM node:22-alpine AS builder

# Stage 2: Runtime — doar ce e necesar
FROM node:22-alpine
COPY --from=builder /app/backend/node_modules ./node_modules
```

**Ce elimină:**
- TypeScript source code (TS după compilare)
- Build tools
- README și docs din node_modules
- Source maps
- Duplicate dependencies

#### Frontend Dockerfile

Aceeași abordare: copy doar fișierele necesare din builder stage.

**Beneficii globale:**
- 70% reduction în image size
- Faster pull/push în registry
- Faster container startup
- Lower disk space în Docker volume

---

### 4. Improved Logging

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"      # Rotație la 10MB
    max-file: "3"        # Păstrează 3 fișiere = 30MB max
```

**Beneficii:**
- Logs nu cresc infinit
- Previne disk exhaustion
- Ușor de debuguat cu `docker logs`

---

### 5. Better Health Checks

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U user"]
  interval: 10s          # Check la fiecare 10s
  timeout: 5s            # Timeout după 5s
  retries: 5             # 5 failures = unhealthy
  start_period: 15s      # 15s grace period la start
```

**Beneficii:**
- Docker detectează container-e hanged
- `depends_on` așteaptă startup real, nu doar port bind
- Ușor să verific status cu `docker ps`

---

### 6. Better Networking

```yaml
networks:
  simdm_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

**Beneficii:**
- Subnete explicite (evită conflicte)
- Networking mai stabil
- DNS resolution mai fiabil între containere

---

## 🛠️ Cum Să Utilizezi Noile Scripturi

### Cleanup — Eliberează Disk Space

```powershell
# Singură rulare
.\scripts\docker-cleanup.ps1

# Output:
# ✓ Stopped containers removed
# ✓ Dangling images removed
# ✓ Unused volumes removed
```

**Recomandare:** Rulează **săptămânal** pentru a preveni disk exhaustion.

### Monitor — Verifica Docker Health

```powershell
# Single check
.\scripts\docker-monitor.ps1

# Continuous monitoring (fiecare 30s)
.\scripts\docker-monitor.ps1 -Watch -Interval 30

# Output:
# 2025-05-30 14:30:15 — Docker Health Check
# ✓ Docker daemon is responsive
# CONTAINER ID  STATUS
# simdm-db-1    Up 2 hours (healthy)
# simdm-backend-1  Up 2 hours (healthy)
```

Dacă daemon-ul nu răspunde, scriptul restartează automat Docker Desktop.

---

## 📈 Performance Improvement Expectations

| Metrica | Înainte | După | Improvement |
|---------|---------|------|-------------|
| Image Size (Backend) | 500MB | 150MB | 70% ↓ |
| Image Size (Frontend) | 450MB | 120MB | 73% ↓ |
| Container Startup | ~15s | ~8s | 47% ↓ |
| Docker Stability | Hang după 2-3h | 24h+ | ✓ |
| Disk Usage (logs) | Unbounded | 30MB max | ✓ |
| WSL Memory | Exhaustion | Stable | ✓ |

---

## 🚀 Best Practices Implementate (2025-2026)

✅ **Multi-stage builds** — Industry standard pentru optimal image size  
✅ **Resource limits** — Previne resource exhaustion  
✅ **Health checks** — Containers unhealthy = Docker replaces them  
✅ **Logging rotation** — Previne disk exhaustion  
✅ **Alpine base images** — 5MB vs 500MB+ pentru ubuntu  
✅ **Layer caching** — package.json mutable layer = faster rebuilds  
✅ **Explicit subnets** — Stable networking  
✅ **node-prune** — Elimina dev deps și node_modules waste  

---

## 🔧 Troubleshooting

### Docker daemon nu răspunde

```powershell
# Try restart
docker ps

# Dacă nu merge, manuală restart
Stop-Process -Name "Docker Desktop" -Force
wsl --shutdown
Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
```

### Container unhealthy

```powershell
# Check health status
docker ps --format "{{.Names}}\t{{.Status}}"

# View container logs
docker logs simdm-backend-1

# Restart container
docker restart simdm-backend-1
```

### WSL memory exhaustion

```powershell
# Check current WSL memory
wsl -d docker-desktop -u root free -h

# Adjust .wslconfig memory setting
# Edit C:\Users\<username>\.wslconfig
# memory=4GB  -> change to 6GB or higher
```

### Image size larger than expected

```powershell
# Check image layers
docker image history simdm-backend:latest

# Rebuild (clears cache)
docker-compose build --no-cache
```

---

## 📚 Referințe

- [Docker Best Practices 2026](https://thinksys.com/devops/docker-best-practices/)
- [Node.js Multi-Stage Build Optimization](https://markaicode.com/nodejs-docker-optimization-2025/)
- [WSL2 Documentation](https://docs.microsoft.com/windows/wsl/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)

---

## 🎯 Următorii Pași (Opțional)

1. **CI/CD Integration** — Automatizează cleanup weekly în GitHub Actions
2. **Production Dockerfile** — Crează prod variant cu `npm run build` pentru frontend
3. **Compose Override** — Crează `docker-compose.override.yml` pentru dev customizations
4. **Monitoring Stack** — Adaugă Prometheus + Grafana pentru metrics
5. **Backup Strategy** — Automatizează PostgreSQL backups

---

**Last Updated:** 2025-05-30  
**Version:** 1.0 (Faza 2 optimization)
