#!/bin/bash
#
# HabitArcade Database Backup Script
# Runs daily at 7:00 AM Eastern Time
#
# Creates compressed PostgreSQL backup and rotates old backups
#

set -e

# Configuration
BACKUP_DIR="/home/mgerasolo/backups/habitarcade"
DB_NAME="habitarcade"
DB_USER="habitarcade"
POSTGRES_CONTAINER="habitarcade-db"
RETENTION_DAYS=14

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/habitarcade_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting HabitArcade database backup..."

# Create backup using docker exec
# pg_dump runs inside the postgres container
docker exec "${POSTGRES_CONTAINER}" pg_dump \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "${BACKUP_FILE}"

# Check if backup was successful
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "[$(date)] ERROR: Backup failed or empty file created"
    exit 1
fi

# Rotate old backups - delete files older than RETENTION_DAYS
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "habitarcade_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List remaining backups
echo "[$(date)] Current backups:"
ls -lh "${BACKUP_DIR}"/habitarcade_*.sql.gz 2>/dev/null || echo "No backups found"

echo "[$(date)] Backup complete!"
