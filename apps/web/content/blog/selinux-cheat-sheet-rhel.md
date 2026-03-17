---
title: "SELinux Cheat Sheet for RHEL"
slug: "selinux-cheat-sheet-rhel"
date: "2026-03-26"
category: "DevOps"
tags: ["SELinux", "RHEL", "Cheat Sheet", "Linux Security", "Sysadmin"]
excerpt: "Quick reference for essential SELinux commands on RHEL 9/10. Modes, contexts, labels, booleans, logs, and troubleshooting in one page."
---

## Mode Management

```
# Check current mode
getenforce

# Temporarily switch to permissive
setenforce 0

# Temporarily switch to enforcing
setenforce 1

# Permanent change (edit file, then reboot or setenforce)
vi /etc/sysconfig/selinux
# Set SELINUX=enforcing
```

## Inspecting Contexts

```
# File contexts
ls -Z /var/www
ls -Zd /srv/webroot

# Process contexts
ps -eZ | grep httpd

# User context
id -Z
```

## File Labeling

### Temporary (lost on restorecon/relabel)

```
chcon -t httpd_sys_content_t -R /srv/webroot
```

### Persistent (survives relabel)

```
# Define mapping
semanage fcontext -a -t httpd_sys_content_t '/srv/webroot(/.*)?'

# Apply labels
restorecon -Rv /srv/webroot

# Verify expected context
matchpathcon /srv/webroot
```

### List custom mappings

```
semanage fcontext -l | grep /srv/webroot
```

## Common Web Labels

| Label | Use |
|-------|-----|
| `httpd_sys_content_t` | Read-only web content |
| `httpd_sys_rw_content_t` | Writable (uploads, cache) |
| `httpd_sys_script_exec_t` | CGI scripts |
| `httpd_log_t` | Apache logs |

## Booleans

```
# List all booleans
getsebool -a

# Filter for httpd
getsebool -a | grep httpd

# Check one boolean
getsebool httpd_can_network_connect

# Set (runtime only)
setsebool httpd_can_network_connect on

# Set (persistent)
setsebool -P httpd_can_network_connect on
```

### Key httpd Booleans

| Boolean | Purpose |
|---------|---------|
| `httpd_can_network_connect` | Outbound TCP connections |
| `httpd_can_network_connect_db` | Database connections |
| `httpd_enable_homedirs` | Serve user home dirs |
| `httpd_can_sendmail` | Send emails |
| `httpd_use_nfs` | Serve NFS content |

## Troubleshooting

```
# Find AVC denials
grep AVC /var/log/audit/audit.log

# Structured search (recent)
ausearch -m AVC,USER_AVC -ts recent

# Human-readable suggestions
journalctl -t setroubleshoot
sealert -a /var/log/audit/audit.log

# Generate policy suggestion (diagnostic only!)
grep AVC /var/log/audit/audit.log | audit2allow
```

## Policy Inspection

```
# Install setools
dnf install setools-console

# Query allow rules
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p read

# Check network permissions
sesearch --allow -s httpd_t -c tcp_socket -p name_connect
```

## Required Packages

```
dnf install policycoreutils policycoreutils-python-utils setools-console setroubleshoot-server
```

## Troubleshooting Workflow

1. `getenforce` — confirm enforcing mode
2. `ls -Z` / `ps -eZ` — check contexts
3. `ausearch -m AVC -ts recent` — find denials
4. Decide: relabel (`semanage` + `restorecon`) or boolean (`setsebool -P`)
5. Custom policy module only as last resort

## Common Mistakes to Avoid

- Using `chcon` without `semanage` (changes are temporary)
- Running `audit2allow -M` without reviewing the `.te` file
- Setting `setenforce 0` and forgetting about it
- Disabling SELinux entirely
- Labeling entire directories as `rw` when only subdirs need writes

Bookmark this and practice every command in our [SELinux for System Admins course](/courses).
