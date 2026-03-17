---
title: "SELinux Upload Directories Guide"
slug: "selinux-upload-directories-guide"
date: "2026-03-25"
category: "DevOps"
tags: ["SELinux", "File Upload", "httpd", "RHEL", "Web Security"]
excerpt: "Properly label writable upload directories for Apache with SELinux. Use httpd_sys_rw_content_t to allow writes without disabling security."
---

## The Problem

Your PHP application needs to write uploaded files to disk. DAC permissions are set correctly — `chown apache: /srv/webroot/upload/` — but uploads fail with a generic error.

The SELinux audit log reveals:

```
avc: denied { write } for comm="httpd"
path="/srv/webroot/upload/file.txt"
scontext=system_u:system_r:httpd_t:s0
tcontext=unconfined_u:object_r:httpd_sys_content_t:s0
tclass=file
```

The problem: `httpd_sys_content_t` is **read-only**. Apache can read these files but cannot write to them.

## The Solution: httpd_sys_rw_content_t

SELinux provides a separate label for writable web content:

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

### 2. Quick test with chcon

```
chcon -t httpd_sys_rw_content_t /srv/webroot/upload
```

Test your upload. If it works, make it permanent.

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

The principle of least privilege. Most web content is static — HTML, CSS, JavaScript, images. These should be **read-only** (`httpd_sys_content_t`).

Only directories that genuinely need write access get `httpd_sys_rw_content_t`. This limits damage if an attacker exploits a vulnerability:

- With `httpd_sys_content_t`: attacker can read files but not modify them
- With `httpd_sys_rw_content_t`: attacker can write — but only to the upload directory
- Without SELinux: attacker can potentially write anywhere Apache's DAC permissions allow

## Common Writable Paths

Applications often need writable directories for:

- **Upload directories** — user-submitted files
- **Cache directories** — compiled templates, optimized assets
- **Session directories** — PHP session files
- **Log directories** — application-level logs

Each should get `httpd_sys_rw_content_t` on its specific path — not the entire webroot.

## Anti-Pattern: Don't Do This

```
# DON'T: Makes everything writable
chcon -t httpd_sys_rw_content_t -R /srv/webroot
```

This defeats the purpose. Only label directories that need writes.

Practice this principle in our [SELinux for System Admins course](/courses) with hands-on upload labs on RHEL.
