#!/bin/bash
# Backup zilnic PostgreSQL

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/simdm_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR

# Dump și comprima
docker exec simdm_postgres pg_dump -U simdm_user simdm_db | gzip > $BACKUP_FILE

# Păstrează doar ultimele 30 backup-uri
find $BACKUP_DIR -name "simdm_*.sql.gz" -mtime +30 -delete

echo "✅ Backup creat: $BACKUP_FILE"
