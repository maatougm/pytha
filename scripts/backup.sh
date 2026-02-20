#!/bin/bash
# Automated backup script

BACKUP_DIR="/opt/school-hub/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "💾 Starting backup at $(date)"

# Backup database
echo "📊 Backing up database..."
docker exec sms_postgres_prod pg_dump -U sms_user school_messaging | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup uploads
echo "📁 Backing up uploads..."
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /opt/school-hub uploads_data 2>/dev/null || echo "No uploads to backup"

# Backup environment
echo "🔐 Backing up environment..."
cp /opt/school-hub/.env $BACKUP_DIR/env_backup_$DATE

# Clean old backups
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup complete: $BACKUP_DIR"
ls -lh $BACKUP_DIR
