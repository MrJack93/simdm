# Docker Cleanup Script — Removes unused images, volumes, and containers
# Run this weekly to free up disk space and prevent WSL exhaustion

Write-Host "🧹 Starting Docker cleanup..." -ForegroundColor Cyan

# Remove stopped containers
Write-Host "▸ Removing stopped containers..."
docker container prune -f --filter "label!=keep"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Stopped containers removed" -ForegroundColor Green
}

# Remove dangling images
Write-Host "▸ Removing dangling images..."
docker image prune -f
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dangling images removed" -ForegroundColor Green
}

# Remove unused volumes (be careful with this)
Write-Host "▸ Removing unused volumes..."
docker volume prune -f
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Unused volumes removed" -ForegroundColor Green
}

# Remove unused networks
Write-Host "▸ Removing unused networks..."
docker network prune -f
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Unused networks removed" -ForegroundColor Green
}

# Show disk usage after cleanup
Write-Host "`n📊 Docker system usage after cleanup:" -ForegroundColor Cyan
docker system df

Write-Host "`n✓ Cleanup completed!" -ForegroundColor Green
