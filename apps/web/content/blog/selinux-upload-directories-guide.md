---
title: "SELinux Upload Directories Guide"
slug: "selinux-upload-directories-guide"
date: "2026-03-25"
category: "DevOps"
tags: ["SELinux", "File Upload", "httpd", "RHEL", "Web Security"]
excerpt: "Properly label writable upload directories for Apache with SELinux. Use httpd_sys_rw_content_t to allow writes without disabling security."
description: "Properly label writable upload directories for Apache with SELinux. Use httpd_sys_rw_content_t to allow writes without disabling security."
author: "Luca Berton"
---

## The Problem

Your PHP app needs to write uploaded files. DAC permissions are correct but uploads fail. The AVC log reveals:

```
avc: denied { write } for comm="httpd"
scontext=system_u:system_r:httpd_t:s0
tcontext=unconfined_u:object_r:httpd_sys_content_t:s0
tclass=file
```

`httpd_sys_content_t` is **read-only**. Apache can read but not write.

## The Solution: httpd_sys_rw_content_t

| Label | Permissions |
|-------|------------|
| `httpd_sys_content_t` | Read-only |
| `httpd_sys_rw_content_t` | Read + Write |
| `httpd_sys_script_exec_t` | Execute (CGI) |

## Step-by-Step

### 1. Create the upload directory

```
mkdir -p /srv/webroot/upload
chown apache: /srv/webroot/upload/
```

### 2. Quick test

```
chcon -t httpd_sys_rw_content_t /srv/webroot/upload
```

### 3. Make it persistent

```
semanage fcontext -a -t httpd_sys_rw_content_t '/srv/webroot/upload(/.*)?'
restorecon -Rv /srv/webroot/upload
```

### 4. Verify

```
ls -Zd /srv/webroot/upload
system_u:object_r:httpd_sys_rw_content_t:s0 /srv/webroot/upload
```

## Why Separate Labels Matter

Only directories that need writes get `httpd_sys_rw_content_t`. This limits damage if an attacker exploits a vulnerability — they can only write to the upload directory, not the entire webroot.

## Anti-Pattern

```
# DON'T: Makes everything writable
chcon -t httpd_sys_rw_content_t -R /srv/webroot
```

Only label directories that need writes.

Practice this in our [SELinux for System Admins course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [SELinux for System Admins](/courses/selinux-system-admins) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use SELinux Upload Directories Guide as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to SELinux, File Upload, httpd, RHEL. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use SELinux Upload Directories Guide?

Use it when you need a practical, repeatable way to handle SELinux, File Upload, httpd, RHEL work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

