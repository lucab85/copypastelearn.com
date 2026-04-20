---
title: "PostgreSQL for DevOps Engineers"
slug: "postgresql-devops-engineers"
date: "2026-03-07"
category: "DevOps"
tags: ["PostgreSQL", "Database", "DevOps", "Backup", "Performance"]
excerpt: "PostgreSQL essentials for DevOps. Backup strategies, replication, monitoring, connection pooling, and infrastructure automation."
description: "PostgreSQL essentials for DevOps teams. Backup and restore, streaming replication, performance monitoring, connection pooling with PgBouncer, and Ansible automation recipes."
---

As a DevOps engineer, you don't write SQL all day — but you manage the infrastructure that keeps PostgreSQL running. This covers what you actually need to know.

## Installation and Setup

```bash
# Ubuntu/Debian
sudo apt install postgresql-16

# Start and enable
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create a database and user
sudo -u postgres psql
```

```sql
CREATE USER appuser WITH PASSWORD 'secure_password';
CREATE DATABASE myapp OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE myapp TO appuser;
\q
```

## Backup Strategies

### pg_dump (Logical Backup)

```bash
# Full database backup
pg_dump -h localhost -U appuser -Fc myapp > backup.dump

# Restore
pg_restore -h localhost -U appuser -d myapp backup.dump

# Schema only
pg_dump -h localhost -U appuser --schema-only myapp > schema.sql

# Data only
pg_dump -h localhost -U appuser --data-only myapp > data.sql

# All databases
pg_dumpall -h localhost -U postgres > all_databases.sql
```

### Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/pg-backup.sh
BACKUP_DIR="/backups/postgresql"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup
pg_dump -h localhost -U appuser -Fc myapp > "$BACKUP_DIR/myapp_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/myapp_$DATE.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/myapp_$DATE.dump.gz" s3://my-backups/postgresql/

# Cleanup old backups
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
```

### WAL Archiving (Point-in-Time Recovery)

`postgresql.conf`:

```ini
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://my-backups/wal/%f'
```

Restore to any point in time:

```bash
# Restore base backup
pg_restore -d myapp base_backup.dump

# Apply WAL up to specific time
# recovery.conf:
restore_command = 'aws s3 cp s3://my-backups/wal/%f %p'
recovery_target_time = '2026-04-10 14:30:00'
```

## Connection Pooling with PgBouncer

PostgreSQL creates a new process per connection. Without pooling, 500 connections = 500 processes.

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
myapp = host=localhost port=5432 dbname=myapp

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

pool_mode = transaction
default_pool_size = 20
max_client_conn = 500
max_db_connections = 50
```

Your app connects to PgBouncer (port 6432) instead of PostgreSQL directly.

## Monitoring Queries

```sql
-- Active connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC
LIMIT 10;

-- Table sizes
SELECT tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
FROM pg_statio_user_tables;

-- Index usage
SELECT relname, idx_scan, seq_scan,
  CASE WHEN idx_scan + seq_scan > 0
    THEN round(100.0 * idx_scan / (idx_scan + seq_scan), 1)
    ELSE 0 END AS idx_ratio
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

## Replication

### Streaming Replication

Primary (`postgresql.conf`):

```ini
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
```

Primary (`pg_hba.conf`):

```
host replication replicator 10.0.1.0/24 scram-sha-256
```

Replica setup:

```bash
pg_basebackup -h primary-server -U replicator -D /var/lib/postgresql/16/main -Fp -Xs -P -R
```

The `-R` flag creates `standby.signal` and configures replication automatically.

## Performance Tuning

Key `postgresql.conf` settings:

```ini
# Memory (set based on available RAM)
shared_buffers = 4GB           # 25% of RAM
effective_cache_size = 12GB    # 75% of RAM
work_mem = 64MB                # Per-query sort memory
maintenance_work_mem = 1GB     # For VACUUM, CREATE INDEX

# WAL
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Connections
max_connections = 200          # Use PgBouncer for more

# Parallelism
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

## Ansible Automation

```yaml
- name: Configure PostgreSQL
  hosts: dbservers
  become: true
  roles:
    - role: geerlingguy.postgresql
      vars:
        postgresql_databases:
          - name: myapp
        postgresql_users:
          - name: appuser
            password: "{{ vault_db_password }}"
            db: myapp
            priv: "ALL"
        postgresql_hba_entries:
          - type: host
            database: myapp
            user: appuser
            address: "10.0.0.0/8"
            auth_method: scram-sha-256
```

## What's Next?

Our **Node.js REST APIs** course builds a production API backed by PostgreSQL. Our **Docker Fundamentals** course covers running PostgreSQL in containers. First lessons are free.
