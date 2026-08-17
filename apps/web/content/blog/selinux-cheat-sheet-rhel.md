---
title: "SELinux Cheat Sheet for RHEL"
slug: "selinux-cheat-sheet-rhel"
date: "2026-03-26"
category: "DevOps"
tags: ["SELinux", "RHEL", "Cheat Sheet", "Linux Security", "Sysadmin"]
excerpt: "Quick reference for essential SELinux commands on RHEL 9/10. Modes, contexts, labels, booleans, logs, and troubleshooting in one page."
description: "Quick reference for essential SELinux commands on RHEL 9/10. Modes, contexts, labels, booleans, logs, and troubleshooting in one page."
author: "Luca Berton"
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

---

**Ready to go deeper?** Check out our hands-on course: [SELinux for System Admins](/courses/selinux-system-admins) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use SELinux Cheat Sheet for RHEL as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to SELinux, RHEL, Cheat Sheet, Linux Security. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use SELinux Cheat Sheet for RHEL?

Use it when you need a practical, repeatable way to handle SELinux, RHEL, Cheat Sheet, Linux Security work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

