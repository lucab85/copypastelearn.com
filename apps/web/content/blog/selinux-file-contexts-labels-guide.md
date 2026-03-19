---
title: "SELinux File Contexts and Labels"
slug: "selinux-file-contexts-labels-guide"
date: "2026-03-19"
category: "DevOps"
tags: ["SELinux", "File Contexts", "Labels", "restorecon", "RHEL"]
excerpt: "Master SELinux file labeling with semanage fcontext and restorecon. The persistent labeling workflow every sysadmin needs to know."
description: "Master SELinux file labeling with semanage fcontext and restorecon. The persistent labeling workflow every sysadmin needs to know."
---

## Labels Drive Everything

In SELinux, **labels determine access** — not just file permissions. A file with `chmod 777` but the wrong SELinux label will still be denied.

Every file has a security context:

```
ls -Z /var/www
system_u:object_r:httpd_sys_content_t:s0 html
system_u:object_r:httpd_sys_script_exec_t:s0 cgi-bin
```

The **type** field (`httpd_sys_content_t`) is what matters most.

## The Labeling Problem

Files in non-standard locations inherit the parent directory's label — usually wrong:

```
mkdir -p /srv/webroot
echo "Hello" > /srv/webroot/index.html
ls -Z /srv/webroot/index.html
unconfined_u:object_r:var_t:s0 /srv/webroot/index.html
```

Apache needs `httpd_sys_content_t` but gets `var_t`. Result: **403 Forbidden**.

## Quick Fix: chcon

```
chcon -t httpd_sys_content_t -R /srv/webroot
```

Works instantly but is **not persistent**. Use for testing only.

## Persistent Fix: semanage + restorecon

### Step 1: Check expected context

```
matchpathcon /srv/webroot
```

### Step 2: Define persistent mapping

```
semanage fcontext -a -t httpd_sys_content_t '/srv/webroot(/.*)?'
```

### Step 3: Apply labels

```
restorecon -Rv /srv/webroot
```

### Step 4: Verify

```
ls -Zd /srv/webroot /srv/webroot/index.html
```

## Common Web Labels

| Label | Purpose |
|-------|---------|
| `httpd_sys_content_t` | Static web content (read-only) |
| `httpd_sys_rw_content_t` | Writable content (uploads) |
| `httpd_sys_script_exec_t` | CGI scripts |
| `httpd_log_t` | Log files |

## The Golden Rule

Always use `semanage fcontext` + `restorecon` for persistent changes:

1. `matchpathcon` — check current expected context
2. `semanage fcontext -a` — define the mapping
3. `restorecon -Rv` — apply it
4. Verify with `ls -Z`

Practice this workflow in our [SELinux for System Admins course](/courses) with real RHEL 9/10 labs.
