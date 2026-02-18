#!/bin/bash
# =============================================================================
# School Hub - Automated Backup Script
# =============================================================================
# Run via cron: 0 2 * * * /path/to/backup.sh
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="school_messaging"
DB_USER="${DB_USER:-sms_user}"
DB_HOST="${POSTGRES_HOST:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# =============================================================================
# Database Backup
# =============================================================================
log "Starting database backup..."

DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"

cd "${BACKUP_DIR}"

# Perform database dump
if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --clean --if-exists --create \
    > "${DB_BACKUP_FILE}"; then
    
    # Compress the backup
    gzip "${DB_BACKUP_FILE}"
    DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"
    
    log "Database backup completed: ${DB_BACKUP_FILE}"
    
    # Calculate size
    SIZE=$(du -h "${DB_BACKUP_FILE}" | cut -f1)
    log "Backup size: ${SIZE}"
    
else
    error "Database backup failed!"
    exit 1
fi

# =============================================================================
# File Uploads Backup (if using local storage)
# =============================================================================
log "Starting uploads backup..."

UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz"

if [ -d "/app/uploads" ]; then
    if tar -czf "${UPLOADS_BACKUP_FILE}" -C /app uploads; then
        log "Uploads backup completed: ${UPLOADS_BACKUP_FILE}"
        
        SIZE=$(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1)
        log "Uploads backup size: ${SIZE}"
    else
        warn "Uploads backup failed (continuing anyway)"
    fi
else
    warn "Uploads directory not found, skipping"
fi

# =============================================================================
# Upload to S3 (if configured)
# =============================================================================
if [ -n "${S3_BUCKET}" ]; then
    log "Uploading backups to S3..."
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        warn "AWS CLI not found, skipping S3 upload"
    else
        # Upload database backup
        aws s3 cp "${DB_BACKUP_FILE}" "s3://${S3_BUCKET}/backups/database/" \
            --storage-class STANDARD_IA
        
        # Upload files backup if exists
        if [ -f "${UPLOADS_BACKUP_FILE}" ]; then
            aws s3 cp "${UPLOADS_BACKUP_FILE}" "s3://${S3_BUCKET}/backups/uploads/" \
                --storage-class STANDARD_IA
        fi
        
        log "S3 upload completed"
    fi
fi

# =============================================================================
# Cleanup Old Backups
# =============================================================================
log "Cleaning up backups older than ${RETENTION_DAYS} days..."

# Local cleanup
find "${BACKUP_DIR}" -name "db_backup_*.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "uploads_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

log "Local cleanup completed"

# S3 cleanup (if configured)
if [ -n "${S3_BUCKET}" ] && command -v aws &> /dev/null; then
    log "Cleaning up S3 backups older than ${RETENTION_DAYS} days..."
    
    aws s3 ls "s3://${S3_BUCKET}/backups/database/" | \
        awk "{if (\$1 < \"$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)\") print \$4}" | \
        xargs -I {} aws s3 rm "s3://${S3_BUCKET}/backups/database/{}"
    
    aws s3 ls "s3://${S3_BUCKET}/backups/uploads/" | \
        awk "{if (\$1 < \"$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)\") print \$4}" | \
        xargs -I {} aws s3 rm "s3://${S3_BUCKET}/backups/uploads/{}"
    
    log "S3 cleanup completed"
fi

# =============================================================================
# Health Check
# =============================================================================
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "db_backup_*.gz" | wc -l)
log "Total backups in retention: ${BACKUP_COUNT}"

log "Backup process completed successfully!"

# Send notification (optional)
# curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
#     -H 'Content-Type: application/json' \
#     -d "{\"text\":\"✅ School Hub backup completed: ${TIMESTAMP}\"}"

exit 0
