# HabitArcade Scripts

Database backup and restore scripts for HabitArcade.

## Overview

| Script | Purpose | Location on Parker |
|--------|---------|-------------------|
| `backup-database.sh` | Creates compressed database backup | `/home/mgerasolo/backups/habitarcade/` |
| `restore-database.sh` | Restores database from backup | `/home/mgerasolo/backups/habitarcade/` |

## Backup Configuration

- **Schedule:** Daily at 7:00 AM Eastern Time (cron)
- **Retention:** 14 days (older backups auto-deleted)
- **Format:** Compressed SQL (`habitarcade_YYYYMMDD_HHMMSS.sql.gz`)
- **Location:** `/home/mgerasolo/backups/habitarcade/`
- **Log file:** `/home/mgerasolo/backups/habitarcade/backup.log`

## Usage

### Check Backup Status

```bash
# List all backups
ssh parker "ls -lh /home/mgerasolo/backups/habitarcade/*.sql.gz"

# View recent backup log entries
ssh parker "tail -50 /home/mgerasolo/backups/habitarcade/backup.log"

# Check cron job
ssh parker "crontab -l | grep habitarcade"
```

### Manual Backup

```bash
ssh parker "/home/mgerasolo/backups/habitarcade/backup-database.sh"
```

### Restore from Backup

```bash
# List available backups
ssh parker "/home/mgerasolo/backups/habitarcade/restore-database.sh"

# Restore specific backup (will prompt for confirmation)
ssh parker "/home/mgerasolo/backups/habitarcade/restore-database.sh /home/mgerasolo/backups/habitarcade/habitarcade_20260102_070000.sql.gz"
```

**Warning:** Restore will overwrite all current data. The script requires typing "yes" to confirm.

### Verify Backup Contents

```bash
# View first 100 lines of a backup
ssh parker "zcat /home/mgerasolo/backups/habitarcade/habitarcade_YYYYMMDD_HHMMSS.sql.gz | head -100"

# Check backup file size
ssh parker "du -h /home/mgerasolo/backups/habitarcade/*.sql.gz"
```

## Technical Details

### Database Connection

- **Container:** `habitarcade-db` (PostgreSQL 17 Alpine)
- **Database:** `habitarcade`
- **User:** `habitarcade`
- **Port:** 5433 (mapped from container's 5432)

### Backup Process

1. Runs `pg_dump` inside the Docker container
2. Outputs SQL with `--clean --if-exists` (allows restore to overwrite)
3. Compresses with gzip
4. Deletes backups older than 14 days

### Cron Entry

```
0 7 * * * /home/mgerasolo/backups/habitarcade/backup-database.sh >> /home/mgerasolo/backups/habitarcade/backup.log 2>&1
```

## Troubleshooting

### Backup fails with "container not found"

Check if the database container is running:
```bash
ssh parker "docker ps | grep habitarcade-db"
```

### Restore fails with "permission denied"

Ensure the backup file exists and is readable:
```bash
ssh parker "ls -la /home/mgerasolo/backups/habitarcade/"
```

### Empty or small backup file

Check if the database has data:
```bash
ssh parker "docker exec habitarcade-db psql -U habitarcade -d habitarcade -c '\dt'"
```

## Deployment

To update scripts on Parker after local changes:

```bash
scp scripts/backup-database.sh parker:/home/mgerasolo/backups/habitarcade/
scp scripts/restore-database.sh parker:/home/mgerasolo/backups/habitarcade/
ssh parker "chmod +x /home/mgerasolo/backups/habitarcade/*.sh"
```
