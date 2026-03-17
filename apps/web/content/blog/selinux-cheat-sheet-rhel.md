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
getenforce
setenforce 0          # permissive (temp)
setenforce 1          # enforcing (temp)
vi /etc/sysconfig/selinux  # permanent
```

## Inspecting Contexts

```
ls -Z /var/www        # file contexts
ps -eZ | grep httpd   # process contexts
id -Z                 # user context
```

## File Labeling

### Temporary

```
chcon -t httpd_sys_content_t -R /srv/webroot
```

### Persistent

```
semanage fcontext -a -t httpd_sys_content_t '/srv/webroot(/.*)?'
restorecon -Rv /srv/webroot
matchpathcon /srv/webroot
```

## Common Web Labels

| Label | Use |
|-------|-----|
| `httpd_sys_content_t` | Read-only web content |
| `httpd_sys_rw_content_t` | Writable (uploads, cache) |
| `httpd_sys_script_exec_t` | CGI scripts |

## Booleans

```
getsebool -a | grep httpd
setsebool -P httpd_can_network_connect on
```

| Boolean | Purpose |
|---------|---------|
| `httpd_can_network_connect` | Outbound TCP |
| `httpd_can_network_connect_db` | Database connections |
| `httpd_enable_homedirs` | Serve home dirs |
| `httpd_can_sendmail` | Send emails |

## Troubleshooting

```
grep AVC /var/log/audit/audit.log
ausearch -m AVC,USER_AVC -ts recent
journalctl -t setroubleshoot
grep AVC /var/log/audit/audit.log | audit2allow
```

## Policy Inspection

```
dnf install setools-console
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p read
```

## Required Packages

```
dnf install policycoreutils policycoreutils-python-utils setools-console setroubleshoot-server
```

## Workflow

1. `getenforce` — confirm mode
2. `ls -Z` / `ps -eZ` — check contexts
3. `ausearch -m AVC -ts recent` — find denials
4. Fix: relabel or boolean
5. Custom policy only as last resort

## Mistakes to Avoid

- `chcon` without `semanage` (temporary!)
- Blind `audit2allow -M` without reviewing `.te`
- `setenforce 0` and forgetting
- Disabling SELinux entirely
- Labeling entire webroots as `rw`

Bookmark this and practice in our [SELinux for System Admins course](/courses).
