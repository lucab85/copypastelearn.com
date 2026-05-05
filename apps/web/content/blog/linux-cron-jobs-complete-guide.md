---
title: "Linux Cron Jobs Complete Guide"
slug: "linux-cron-jobs-complete-guide"
date: "2026-02-18"
category: "DevOps"
tags: ["Linux", "Cron", "Automation", "System Administration", "DevOps"]
excerpt: "Master Linux cron jobs. Crontab syntax, common schedules, error handling, logging, systemd timers, and production best practices."
description: "Master Linux cron jobs for scheduling. Crontab syntax, common patterns, error handling, output logging, and systemd timer alternatives."
author: "Luca Berton"
---

Cron is the standard Linux scheduler. It runs commands at specified times — backups at midnight, log rotation weekly, health checks every minute.

## Crontab Syntax

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * * command
```

## Common Schedules

```bash
# Every minute
* * * * * /path/to/script.sh

# Every 5 minutes
*/5 * * * * /path/to/script.sh

# Every hour at minute 0
0 * * * * /path/to/script.sh

# Daily at 2:30 AM
30 2 * * * /path/to/script.sh

# Monday to Friday at 9 AM
0 9 * * 1-5 /path/to/script.sh

# First day of every month at midnight
0 0 1 * * /path/to/script.sh

# Every 15 minutes during business hours
*/15 9-17 * * 1-5 /path/to/script.sh

# Twice daily (8 AM and 8 PM)
0 8,20 * * * /path/to/script.sh

# Sunday at 3 AM (weekly maintenance)
0 3 * * 0 /path/to/script.sh
```

## Managing Crontabs

```bash
# Edit your crontab
crontab -e

# List your crontab
crontab -l

# Edit another user's crontab (root)
crontab -e -u www-data

# Remove your crontab (careful!)
crontab -r

# Remove with confirmation
crontab -ri
```

## Writing Reliable Cron Scripts

### Always Use Full Paths

Cron has a minimal environment:

```bash
#!/bin/bash
# Bad — cron can't find commands
pg_dump mydb > backup.sql

# Good — full paths
/usr/bin/pg_dump mydb > /backups/db-$(date +\%Y\%m\%d).sql
```

### Set PATH Explicitly

```bash
# At the top of your crontab
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SHELL=/bin/bash
MAILTO=admin@example.com

0 2 * * * /opt/scripts/backup.sh
```

### Logging

```bash
# Redirect stdout and stderr to a log file
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# With timestamp
0 2 * * * /opt/scripts/backup.sh 2>&1 | while read line; do echo "$(date '+\%Y-\%m-\%d \%H:\%M:\%S') $line"; done >> /var/log/backup.log

# Suppress output (only errors via MAILTO)
0 2 * * * /opt/scripts/backup.sh > /dev/null
```

### Prevent Overlapping Runs

```bash
# Using flock (best method)
* * * * * /usr/bin/flock -n /tmp/myjob.lock /opt/scripts/long-running.sh

# Flock with timeout (wait up to 60s for lock)
* * * * * /usr/bin/flock -w 60 /tmp/myjob.lock /opt/scripts/process.sh
```

### Error Handling in Scripts

```bash
#!/bin/bash
set -euo pipefail

LOG="/var/log/backup.log"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG"; }

log "Starting backup"

if /usr/bin/pg_dump -U postgres mydb > "$BACKUP_DIR/db-$DATE.sql"; then
    log "Database backup completed"
else
    log "ERROR: Database backup failed"
    exit 1
fi

# Cleanup old backups (keep 7 days)
find "$BACKUP_DIR" -name "db-*.sql" -mtime +7 -delete
log "Cleanup completed"
```

## Systemd Timers (Modern Alternative)

### Timer Unit

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

### Service Unit

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Database backup

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
User=backup
Nice=10
IOSchedulingClass=idle
```

### Enable and Monitor

```bash
sudo systemctl enable --now backup.timer

# List all timers
systemctl list-timers --all

# Check last run
systemctl status backup.service

# View logs
journalctl -u backup.service --since today
```

### Why Systemd Timers Over Cron?

| Feature | Cron | Systemd Timer |
|---|---|---|
| Missed run catch-up | No | Yes (`Persistent=true`) |
| Random delay | No | Yes (`RandomizedDelaySec`) |
| Resource limits | No | Yes (CPUQuota, MemoryMax) |
| Dependencies | No | Yes (After=, Requires=) |
| Logging | Manual | Journald (built-in) |
| Status monitoring | `crontab -l` | `systemctl list-timers` |
| Overlap prevention | Manual (flock) | Built-in (oneshot) |

## Debugging Cron

```bash
# Check if cron is running
systemctl status cron

# View cron logs
grep CRON /var/log/syslog
journalctl -u cron --since "1 hour ago"

# Test your script manually first
sudo -u www-data /opt/scripts/backup.sh

# Check cron mail
cat /var/mail/$(whoami)
```

## Security

```bash
# Restrict who can use cron
# /etc/cron.allow — only listed users can use cron
# /etc/cron.deny  — listed users cannot use cron

echo "deploy" >> /etc/cron.allow

# Never run cron jobs as root unless necessary
# Use a dedicated service account
crontab -e -u backupuser
```

## What's Next?

Our **SELinux for System Admins** course covers securing cron jobs with SELinux policies. **Ansible Automation in 30 Minutes** teaches automating scheduled tasks across fleets. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

