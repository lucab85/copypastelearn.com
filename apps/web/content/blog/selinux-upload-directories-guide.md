---
title: "SELinux Upload Directories Guide"
slug: "selinux-upload-directories-guide"
date: "2026-03-25"
category: "DevOps"
tags: ["SELinux", "File Upload", "httpd", "RHEL", "Web Security"]
excerpt: "Properly label writable upload directories for Apache with SELinux. Use httpd_sys_rw_content_t to allow writes without disabling security."
description: "Properly label writable upload directories for Apache with SELinux. Use httpd_sys_rw_content_t to allow writes without disabling security."
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
