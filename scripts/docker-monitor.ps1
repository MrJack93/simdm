# Docker Health Monitor — Checks container health and resource usage
# Run this periodically to monitor for hangs and resource exhaustion

param(
    [switch]$Watch,
    [int]$Interval = 30
)

function Get-DockerHealth {
    Write-Host "`n$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') — Docker Health Check" -ForegroundColor Cyan

    # Check if Docker daemon is responding
    try {
        $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-Host "✓ Docker daemon is responsive" -ForegroundColor Green
        Write-Host $containers
    }
    catch {
        Write-Host "✗ Docker daemon NOT responding! (may be hung)" -ForegroundColor Red
        Write-Host "  Attempting to restart Docker Desktop..." -ForegroundColor Yellow

        # Force restart Docker
        Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 15

        Write-Host "  Docker Desktop restarted. Please check status manually." -ForegroundColor Yellow
        return
    }

    # Check container resource usage
    Write-Host "`n📊 Container Resource Usage:" -ForegroundColor Cyan
    $stats = docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    Write-Host $stats

    # Check for unhealthy containers
    Write-Host "`n🏥 Container Health Status:" -ForegroundColor Cyan
    $unhealthy = docker ps --format "table {{.Names}}\t{{.State}}" | Where-Object { $_ -match "unhealthy|exited" }

    if ($unhealthy) {
        Write-Host "⚠️ Unhealthy containers detected:" -ForegroundColor Yellow
        Write-Host $unhealthy
    }
    else {
        Write-Host "✓ All containers are healthy" -ForegroundColor Green
    }

    # Check WSL memory usage
    Write-Host "`n💾 WSL Memory Usage:" -ForegroundColor Cyan
    $wslMemory = wsl -d docker-desktop -u root free -h | Select-Object -Skip 1 | Select-Object -First 1
    Write-Host $wslMemory
}

if ($Watch) {
    Write-Host "🔄 Monitoring Docker every $Interval seconds (press Ctrl+C to stop)..." -ForegroundColor Cyan
    while ($true) {
        Get-DockerHealth
        Start-Sleep -Seconds $Interval
    }
}
else {
    Get-DockerHealth
}
