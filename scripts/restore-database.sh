#!/bin/bash
#
# HabitArcade Database Restore Script
# Restores database from a backup file
#
# Usage: ./restore-database.sh [backup_file]
#   If no backup file specified, lists available backups
#

set -e

# Configuration
BACKUP_DIR="/home/mgerasolo/backups/habitarcade"
DB_NAME="habitarcade"
DB_USER="habitarcade"
POSTGRES_CONTAINER="habitarcade-db"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Available backups:${NC}"
    echo ""
    ls -lh "${BACKUP_DIR}"/habitarcade_*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ${BACKUP_DIR}/habitarcade_20260102_070000.sql.gz"
    exit 0
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}ERROR: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}WARNING: This will restore the database from:${NC}"
echo "  ${BACKUP_FILE}"
echo ""
echo -e "${RED}This will OVERWRITE all current data in the ${DB_NAME} database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "[$(date)] Starting database restore..."

# Restore database
zcat "${BACKUP_FILE}" | docker exec -i "${POSTGRES_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo ""
echo -e "${GREEN}[$(date)] Database restored successfully from ${BACKUP_FILE}${NC}"
