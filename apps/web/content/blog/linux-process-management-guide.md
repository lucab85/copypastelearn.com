---
title: "Linux Process Management Guide"
slug: "linux-process-management-guide"
date: "2026-01-23"
category: "DevOps"
tags: ["Linux", "Process Management", "System Administration", "DevOps", "Signals"]
excerpt: "Manage Linux processes effectively. ps, top, htop, kill signals, background jobs, nice, systemd services, and zombie process cleanup."
description: "Manage Linux processes. ps, top, kill signals, background jobs, nice priorities, systemd services, and zombie process cleanup."
---

Everything running on Linux is a process. Knowing how to find, monitor, and manage them is fundamental DevOps knowledge.

## Viewing Processes

### ps

```bash
# All processes (full format)
ps aux

# Process tree
ps auxf

# Specific user
ps -u www-data

# Find by name
ps aux | grep nginx

# Custom columns
ps -eo pid,ppid,user,%cpu,%mem,comm --sort=-%cpu | head -20
```

### top / htop

```bash
# Interactive process viewer
top

# Better alternative
htop

# Sort by memory in top
top   # then press M

# Filter in htop
htop  # then press F4 and type process name
```

### Other Useful Commands

```bash
# Process count
ps aux | wc -l

# What's using a port
lsof -i :3000
fuser 3000/tcp

# What's using a file
lsof /var/log/syslog
fuser /var/log/syslog

# Process details
cat /proc/PID/status
cat /proc/PID/cmdline
ls -la /proc/PID/fd/   # Open file descriptors
```

## Signals

| Signal | Number | Action | Use |
|---|---|---|---|
| SIGHUP | 1 | Reload config | `kill -1 PID` |
| SIGINT | 2 | Interrupt | Ctrl+C |
| SIGQUIT | 3 | Quit + core dump | Debugging |
| SIGKILL | 9 | Force kill | Last resort |
| SIGTERM | 15 | Graceful shutdown | Default `kill` |
| SIGUSR1 | 10 | User-defined | App-specific |
| SIGSTOP | 19 | Pause process | `kill -STOP PID` |
| SIGCONT | 18 | Resume process | `kill -CONT PID` |

```bash
# Graceful shutdown (SIGTERM — default)
kill PID
kill -15 PID
kill -TERM PID

# Force kill (SIGKILL — unblockable)
kill -9 PID
kill -KILL PID

# Reload configuration
kill -HUP $(cat /var/run/nginx.pid)

# Kill all processes by name
killall nginx
pkill -f "node server.js"

# Kill by pattern
pkill -f "python.*worker"
```

### Graceful Shutdown Order

1. Send SIGTERM first (let the process clean up)
2. Wait 10-30 seconds
3. Send SIGKILL only if SIGTERM did not work

```bash
# In a script
PID=$(cat /var/run/app.pid)
kill "$PID"
for i in $(seq 1 30); do
    kill -0 "$PID" 2>/dev/null || break
    sleep 1
done
kill -0 "$PID" 2>/dev/null && kill -9 "$PID"
```

## Background Jobs

```bash
# Run in background
long-command &

# Run immune to hangup (survives terminal close)
nohup long-command > output.log 2>&1 &

# Background a running process
# Press Ctrl+Z to suspend, then:
bg        # Resume in background
fg        # Bring back to foreground

# List background jobs
jobs

# Disown a running background process
disown %1
```

## Priority (nice / renice)

```bash
# Nice values: -20 (highest priority) to 19 (lowest)

# Start with low priority
nice -n 19 ./heavy-task.sh

# Start with high priority (requires root)
nice -n -10 ./important-task.sh

# Change priority of running process
renice -n 10 -p PID

# All processes of a user
renice -n 5 -u backup
```

## Systemd Services

```bash
# Service management
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx    # Reload config without restart
sudo systemctl status nginx

# Enable/disable at boot
sudo systemctl enable nginx
sudo systemctl disable nginx

# View logs
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx -f   # Follow live
```

### Custom Service

```ini
# /etc/systemd/system/my-app.service
[Unit]
Description=My Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=app
Group=app
WorkingDirectory=/opt/my-app
ExecStart=/usr/bin/node server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
Environment=PORT=3000

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/my-app/data

# Resource limits
MemoryMax=512M
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now my-app
```

## Zombie Processes

A zombie is a finished process whose parent has not read its exit status:

```bash
# Find zombies
ps aux | grep Z
ps -eo pid,ppid,stat,comm | grep Z

# Cannot kill zombies directly (they are already dead)
# Fix: kill the parent process
kill PPID

# Or wait for parent to call wait()
```

## Resource Limits (ulimit)

```bash
# View current limits
ulimit -a

# Set max open files
ulimit -n 65536

# Permanent limits
# /etc/security/limits.conf
app    soft    nofile    65536
app    hard    nofile    65536
app    soft    nproc     4096
app    hard    nproc     4096
```

## Monitoring

```bash
# System load average
uptime
# 14:23:01 up 45 days, load average: 0.52, 0.48, 0.45
# (1 min, 5 min, 15 min — should be < number of CPU cores)

# Memory
free -h

# Disk I/O
iotop
iostat -x 1

# Network connections per process
ss -tnp
```

## What's Next?

Our **SELinux for System Admins** course covers Linux process security and access controls. **Ansible Automation in 30 Minutes** teaches automating process management. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

