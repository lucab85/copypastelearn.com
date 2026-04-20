---
title: "Bash Scripting for DevOps"
slug: "bash-scripting-devops-engineers"
date: "2026-02-12"
category: "DevOps"
tags: ["Bash", "Scripting", "Linux", "Automation", "DevOps"]
excerpt: "Essential Bash scripting for DevOps. Variables, conditionals, loops, functions, error handling, and real-world automation scripts."
description: "Essential Bash scripting skills for DevOps engineers. Variables, conditionals, loops, functions, error handling, and practical automation scripts for daily operations."
---

Every DevOps engineer writes Bash scripts. They glue together tools, automate deployments, and handle the tasks that do not justify a full program.

## Script Basics

```bash
#!/bin/bash
set -euo pipefail

# -e: Exit on any error
# -u: Treat unset variables as errors
# -o pipefail: Pipe fails if any command in pipe fails
```

Always start with `set -euo pipefail`. It catches bugs that would otherwise silently pass.

## Variables

```bash
# Assignment (no spaces around =)
NAME="production"
PORT=3000
BACKUP_DIR="/backups/${NAME}"

# Read-only
readonly DATABASE_URL="postgresql://localhost/mydb"

# Default values
ENVIRONMENT="${1:-development}"    # First arg, default "development"
LOG_LEVEL="${LOG_LEVEL:-info}"     # Env var, default "info"

# Command output
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HOSTNAME=$(hostname -f)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

## Conditionals

```bash
# String comparison
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "Production deploy"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "Staging deploy"
else
    echo "Unknown environment"
fi

# File checks
if [[ -f "/etc/nginx/nginx.conf" ]]; then
    echo "Config exists"
fi

if [[ -d "$BACKUP_DIR" ]]; then
    echo "Directory exists"
fi

if [[ ! -x "/usr/local/bin/docker" ]]; then
    echo "Docker not installed or not executable"
    exit 1
fi

# Numeric comparison
if (( DISK_USAGE > 90 )); then
    echo "WARNING: Disk almost full"
fi

# Command success
if docker ps &>/dev/null; then
    echo "Docker is running"
fi
```

## Loops

```bash
# For loop
for server in web1 web2 web3; do
    echo "Deploying to $server"
    ssh "$server" "sudo systemctl restart app"
done

# File iteration
for file in /backups/*.sql.gz; do
    echo "Processing: $file"
done

# Range
for i in {1..10}; do
    echo "Attempt $i"
done

# While loop
while read -r line; do
    echo "Processing: $line"
done < servers.txt

# Until (retry pattern)
RETRIES=0
until curl -sf http://localhost:3000/health; do
    ((RETRIES++))
    if (( RETRIES > 30 )); then
        echo "Health check failed after 30 attempts"
        exit 1
    fi
    echo "Waiting for app... (attempt $RETRIES)"
    sleep 2
done
```

## Functions

```bash
log() {
    local level="${1}"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] $*"
}

die() {
    log "ERROR" "$@"
    exit 1
}

retry() {
    local max_attempts="${1}"
    local delay="${2}"
    shift 2
    local attempt=1

    while true; do
        if "$@"; then
            return 0
        fi
        if (( attempt >= max_attempts )); then
            log "ERROR" "Command failed after $max_attempts attempts: $*"
            return 1
        fi
        log "WARN" "Attempt $attempt failed, retrying in ${delay}s..."
        sleep "$delay"
        ((attempt++))
    done
}

# Usage
log "INFO" "Starting deployment"
retry 5 10 curl -sf http://api.internal/health || die "API unreachable"
```

## Error Handling

```bash
#!/bin/bash
set -euo pipefail

# Trap errors
cleanup() {
    local exit_code=$?
    log "INFO" "Cleaning up..."
    rm -f "$TEMP_FILE"
    if (( exit_code != 0 )); then
        log "ERROR" "Script failed with exit code $exit_code"
        # Send alert
        curl -s -X POST "$SLACK_WEBHOOK" \
            -d "{\"text\": \"Deploy failed: exit code $exit_code\"}"
    fi
}
trap cleanup EXIT

TEMP_FILE=$(mktemp)
```

## Real-World Scripts

### Deployment Script

```bash
#!/bin/bash
set -euo pipefail

APP_NAME="${1:?Usage: deploy.sh <app-name> <version>}"
VERSION="${2:?Usage: deploy.sh <app-name> <version>}"
ENVIRONMENT="${ENVIRONMENT:-production}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "Deploying $APP_NAME v$VERSION to $ENVIRONMENT"

# Pull new image
log "Pulling image..."
docker pull "registry.internal/${APP_NAME}:${VERSION}"

# Health check current version
if ! curl -sf "http://localhost:3000/health" > /dev/null; then
    log "WARNING: Current version unhealthy"
fi

# Stop old container
log "Stopping old container..."
docker stop "$APP_NAME" 2>/dev/null || true
docker rm "$APP_NAME" 2>/dev/null || true

# Start new container
log "Starting $APP_NAME v$VERSION..."
docker run -d \
    --name "$APP_NAME" \
    --restart unless-stopped \
    -p 3000:3000 \
    --env-file "/etc/${APP_NAME}/.env" \
    "registry.internal/${APP_NAME}:${VERSION}"

# Wait for health
log "Waiting for health check..."
for i in {1..30}; do
    if curl -sf "http://localhost:3000/health" > /dev/null; then
        log "Deploy successful! $APP_NAME v$VERSION is healthy"
        exit 0
    fi
    sleep 2
done

log "ERROR: Health check failed after 60s"
log "Rolling back to previous version..."
docker stop "$APP_NAME"
docker rm "$APP_NAME"
# Rollback logic here
exit 1
```

### Backup Script

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-myapp}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

cleanup() {
    log "Removing backups older than $RETENTION_DAYS days"
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
}

log "Starting backup of $DB_NAME"

mkdir -p "$BACKUP_DIR"

DUMP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"
pg_dump -U postgres "$DB_NAME" | gzip > "$DUMP_FILE"

SIZE=$(du -h "$DUMP_FILE" | cut -f1)
log "Backup completed: $DUMP_FILE ($SIZE)"

cleanup

# Upload to S3 (optional)
if command -v aws &>/dev/null; then
    aws s3 cp "$DUMP_FILE" "s3://my-backups/db/$DB_NAME/"
    log "Uploaded to S3"
fi
```

## Useful Patterns

```bash
# Check if command exists
command -v docker &>/dev/null || die "Docker not installed"

# Read config file
source /etc/myapp/config.sh

# Process CSV
while IFS=',' read -r name ip role; do
    echo "Server: $name ($ip) - Role: $role"
done < servers.csv

# Parallel execution
for server in web{1..10}; do
    ssh "$server" "sudo apt update && sudo apt upgrade -y" &
done
wait  # Wait for all background jobs

# Temporary directory
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
```

## What's Next?

Our **SELinux for System Admins** course covers Linux system administration. **Ansible Automation in 30 Minutes** teaches automating what you would script manually. First lessons are free.
