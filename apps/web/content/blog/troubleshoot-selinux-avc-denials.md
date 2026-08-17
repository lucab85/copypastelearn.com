---
title: "Troubleshoot SELinux AVC Denials"
slug: "troubleshoot-selinux-avc-denials"
date: "2026-03-20"
category: "DevOps"
tags: ["SELinux", "AVC", "Troubleshooting", "audit", "RHEL"]
excerpt: "Learn to read SELinux AVC denial logs, use ausearch and sealert, and follow a systematic troubleshooting workflow for RHEL systems."
description: "Learn to read SELinux AVC denial logs, use ausearch and sealert, and follow a systematic troubleshooting workflow for RHEL systems."
author: "Luca Berton"
---

## AVC Denials: Your Starting Point

When SELinux blocks something, it writes an AVC (Access Vector Cache) message to the audit log. Learning to read these is the most important SELinux skill.

## Finding AVC Messages

```
# Direct audit log
grep AVC /var/log/audit/audit.log

# Structured search
ausearch -m AVC,USER_AVC -ts recent

# Human-readable
journalctl -t setroubleshoot
```

## Reading an AVC Message

```
type=AVC msg=audit(1770796878.691:181): avc:  denied  { getattr }
for  pid=12187 comm="httpd"
path="/srv/webroot/index.html"
scontext=system_u:system_r:httpd_t:s0
tcontext=unconfined_u:object_r:var_t:s0
tclass=file permissive=0
```

- **denied { getattr }** — the blocked permission
- **comm="httpd"** — the process
- **scontext=...httpd_t** — source type (process)
- **tcontext=...var_t** — target type (file)
- **tclass=file** — object class

## The Troubleshooting Workflow

### 1. Verify mode and context

```
getenforce
ls -Z /path/to/file
ps -eZ | grep process_name
```

### 2. Check AVC logs

```
ausearch -m AVC,USER_AVC -ts recent
```

### 3. Decide: label fix or boolean?

- **Wrong label** → `semanage fcontext` + `restorecon`
- **Missing behavior** → `setsebool`

### 4. Custom policy as last resort

## audit2allow: Use With Caution

```
grep AVC /var/log/audit/audit.log | audit2allow
```

Output:

```
allow httpd_t var_t:file getattr;
```

**Warning**: This allows `httpd_t` to access **all** `var_t` files. The correct fix is relabeling, not overly permissive policy.

## Common Denial Patterns

| Denial | Likely Fix |
|--------|-----------|
| Wrong file type | Relabel with `semanage fcontext` |
| `name_connect` denied | Enable boolean (`httpd_can_network_connect`) |
| Write denied on upload dir | Label as `httpd_sys_rw_content_t` |

Master this workflow in our [SELinux for System Admins course](/courses).

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [SELinux for System Admins](/courses/selinux-system-admins) on CopyPasteLearn.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Troubleshoot SELinux AVC Denials as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to SELinux, AVC, Troubleshooting, audit. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Troubleshoot SELinux AVC Denials?

Use it when you need a practical, repeatable way to handle SELinux, AVC, Troubleshooting, audit work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

