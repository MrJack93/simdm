# Backup zilnic PostgreSQL (Windows PowerShell)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
$backupFile = "$backupDir\simdm_$timestamp.sql.gz"

# Creează directory dacă nu există
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Dump și comprima
docker exec simdm_postgres pg_dump -U simdm_user simdm_db | gzip > $backupFile

# Șterge backup-uri mai vechi de 30 zile
Get-ChildItem "$backupDir\simdm_*.sql.gz" -ErrorAction SilentlyContinue |
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force

Write-Host "✅ Backup: $backupFile"
