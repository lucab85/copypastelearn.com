---
title: "Systemd Service Files Explained"
slug: "systemd-service-files-explained"
date: "2026-03-08"
category: "DevOps"
tags: ["Systemd", "Linux", "Services", "Sysadmin", "DevOps"]
excerpt: "Write systemd service files for your applications. Unit configuration, restart policies, dependencies, timers, and debugging services."
description: "Write systemd service files for application management. Unit configuration, restart policies, dependency ordering, timer units, and debugging techniques for Linux services."
---

systemd manages every service on modern Linux. If you deploy applications on Linux servers, you need to write service files.

## Basic Service File

Create `/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=My Web Application
Documentation=https://example.com/docs
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node /opt/myapp/server.js
Restart=always
RestartSec=5

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/myapp/.env

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/myapp/data /var/log/myapp

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp
sudo systemctl status myapp
```

## Service Types

| Type | Behavior | Use When |
|---|---|---|
| `simple` | Process stays in foreground | Most applications (Node, Python, Go) |
| `forking` | Process forks and parent exits | Traditional daemons (nginx, Apache) |
| `oneshot` | Runs once and exits | Scripts, migrations, setup tasks |
| `notify` | Process sends ready notification | Apps using sd_notify |

```ini
# Oneshot example (database migration)
[Service]
Type=oneshot
ExecStart=/opt/myapp/migrate.sh
RemainAfterExit=yes
```

## Restart Policies

```ini
# Always restart (production services)
Restart=always
RestartSec=5

# Only restart on failure (not on clean exit)
Restart=on-failure
RestartSec=10

# Limit restart attempts
StartLimitIntervalSec=300
StartLimitBurst=5
# 5 restarts in 300 seconds, then give up
```

| Policy | On Success | On Failure | On Signal |
|---|---|---|---|
| `no` | No | No | No |
| `always` | Yes | Yes | Yes |
| `on-failure` | No | Yes | Yes |
| `on-abnormal` | No | No | Yes |
| `on-success` | Yes | No | No |

## Dependencies and Ordering

```ini
[Unit]
# Start after these services
After=network.target postgresql.service redis.service

# Start these services if not running
Wants=postgresql.service redis.service

# Fail if these aren't available
Requires=postgresql.service

# Only start if this is present
ConditionPathExists=/opt/myapp/server.js
```

## Multiple Commands

```ini
[Service]
# Pre-start commands
ExecStartPre=/opt/myapp/check-config.sh
ExecStartPre=/opt/myapp/migrate.sh

# Main process
ExecStart=/usr/bin/node /opt/myapp/server.js

# Graceful reload
ExecReload=/bin/kill -HUP $MAINPID

# Cleanup on stop
ExecStopPost=/opt/myapp/cleanup.sh
```

## Resource Limits

```ini
[Service]
# Memory limit (kill if exceeded)
MemoryMax=512M
MemoryHigh=384M

# CPU quota (50% of one core)
CPUQuota=50%

# File descriptor limit
LimitNOFILE=65536

# Process limit
LimitNPROC=4096
```

## Timers (Cron Replacement)

Create `/etc/systemd/system/backup.timer`:

```ini
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

Create `/etc/systemd/system/backup.service`:

```ini
[Unit]
Description=Backup job

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
User=backup
```

```bash
sudo systemctl enable backup.timer
sudo systemctl start backup.timer
systemctl list-timers
```

### Timer Schedules

```ini
OnCalendar=hourly              # Every hour
OnCalendar=daily               # Every day at midnight
OnCalendar=weekly              # Every Monday at midnight
OnCalendar=*-*-* 06:00:00     # Every day at 6 AM
OnCalendar=Mon-Fri *-*-* 09:00:00  # Weekdays at 9 AM
OnCalendar=*-*-01 00:00:00    # First of every month
```

## Debugging Services

```bash
# Check status
systemctl status myapp

# View logs
journalctl -u myapp -f              # Follow live
journalctl -u myapp --since "1h ago"  # Last hour
journalctl -u myapp -p err          # Errors only

# Check why a service failed
systemctl show myapp --property=Result
systemctl show myapp --property=ExecMainStatus

# Analyze boot order
systemd-analyze blame
systemd-analyze critical-chain myapp.service
```

## Security Hardening

```ini
[Service]
# Run as non-root
User=appuser
Group=appgroup

# Filesystem restrictions
ProtectSystem=strict        # Mount / as read-only
ProtectHome=true            # Hide /home
PrivateTmp=true             # Isolated /tmp
ReadWritePaths=/opt/myapp/data

# Network restrictions
PrivateNetwork=false        # Set true if no network needed
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

# System call filtering
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

# Other hardening
NoNewPrivileges=true
ProtectKernelModules=true
ProtectKernelTunables=true
ProtectControlGroups=true
```

## What's Next?

Our **Ansible Automation in 30 Minutes** course automates service deployment and management across fleets of servers. Our **SELinux for System Admins** course covers service security policies. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

