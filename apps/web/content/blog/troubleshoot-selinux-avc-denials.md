---
title: "Troubleshoot SELinux AVC Denials"
slug: "troubleshoot-selinux-avc-denials"
date: "2026-03-20"
category: "DevOps"
tags: ["SELinux", "AVC", "Troubleshooting", "audit", "RHEL"]
excerpt: "Learn to read SELinux AVC denial logs, use ausearch and sealert, and follow a systematic troubleshooting workflow for RHEL systems."
---

## AVC Denials: Your Starting Point

When SELinux blocks something, it writes an AVC (Access Vector Cache) message to the audit log. Learning to read these is the single most important SELinux skill.

## Finding AVC Messages

Three ways to find denials:

```
# Direct audit log
grep AVC /var/log/audit/audit.log

# Structured search
ausearch -m AVC,USER_AVC -ts recent

# Human-readable (if setroubleshoot installed)
journalctl -t setroubleshoot
```

## Reading an AVC Message

Here's a real denial:

```
type=AVC msg=audit(1770796878.691:181): avc:  denied  { getattr }
for  pid=12187 comm="httpd"
path="/srv/webroot/index.html"
scontext=system_u:system_r:httpd_t:s0
tcontext=unconfined_u:object_r:var_t:s0
tclass=file permissive=0
```

Break it down:

- **denied { getattr }** — the blocked permission
- **comm="httpd"** — the process that was denied
- **path="/srv/webroot/index.html"** — the target file
- **scontext=...httpd_t:s0** — source type (the process)
- **tcontext=...var_t:s0** — target type (the file)
- **tclass=file** — object class
- **permissive=0** — enforcing mode (actually blocked)

## The Troubleshooting Workflow

Follow this order every time:

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

Most issues fall into two categories:

- **Wrong label** → fix with `semanage fcontext` + `restorecon`
- **Missing behavior** → enable with `setsebool`

### 4. Custom policy as last resort

Only if labels and booleans don't solve it.

## Using setroubleshoot

Install it for human-readable suggestions:

```
dnf install setroubleshoot-server
```

Then check:

```
journalctl -t setroubleshoot
```

It will suggest fixes like:

> SELinux is preventing /usr/sbin/httpd from getattr access on the file /srv/webroot/index.html. If you want to allow httpd to have getattr access, you need to change the label on /srv/webroot/index.html.

Treat these as **guidance**, not gospel. Always verify the suggestion makes sense.

## audit2allow: Use With Caution

`audit2allow` generates policy rules from denials:

```
grep AVC /var/log/audit/audit.log | audit2allow
```

Output:

```
#============= httpd_t ==============
allow httpd_t var_t:file getattr;
```

**Warning**: This would allow `httpd_t` to access **all** `var_t` files — far too broad. The correct fix is relabeling to `httpd_sys_content_t`, not creating an overly permissive policy.

Use `audit2allow` for **diagnosis**, not for production fixes.

## Common Denial Patterns

| Denial | Likely Fix |
|--------|-----------|
| Wrong file type (`var_t` instead of `httpd_sys_content_t`) | Relabel with `semanage fcontext` |
| `name_connect` denied | Enable a boolean (`httpd_can_network_connect`) |
| Write denied on upload dir | Label as `httpd_sys_rw_content_t` |

Master this workflow in our [SELinux for System Admins course](/courses) — real AVC logs, real fixes, real RHEL labs.
