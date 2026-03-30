---
title: "Fix SELinux Apache Custom Webroot"
slug: "fix-selinux-apache-custom-webroot"
date: "2026-03-22"
category: "DevOps"
tags: ["SELinux", "Apache", "httpd", "RHEL", "Web Server"]
excerpt: "Step-by-step guide to fix SELinux 403 Forbidden errors when using a custom Apache DocumentRoot like /srv/webroot on RHEL."
description: "Step-by-step guide to fix SELinux 403 Forbidden errors when using a custom Apache DocumentRoot like /srv/webroot on RHEL."
---

## The Problem

You move Apache's DocumentRoot to `/srv/webroot`. Permissions are fine, config is valid. But:

```
curl http://localhost/index.html
# 403 Forbidden
```

## Why It Happens

Files under `/var/www` are labeled `httpd_sys_content_t`. Custom paths get `var_t`:

```
matchpathcon /srv/webroot /var/www
/srv/webroot	system_u:object_r:var_t:s0
/var/www	system_u:object_r:httpd_sys_content_t:s0
```

## Step-by-Step Fix

### 1. Create the webroot

```
mkdir -p /srv/webroot
echo "SELinux Test" > /srv/webroot/index.html
```

### 2. Configure Apache

```
DocumentRoot "/srv/webroot"
<Directory "/srv/webroot">
    AllowOverride None
    Require all granted
</Directory>
```

### 3. Quick test with chcon

```
chcon -t httpd_sys_content_t -R /srv/webroot
curl http://localhost/index.html
# SELinux Test
```

### 4. Make it permanent

```
semanage fcontext -a -t httpd_sys_content_t '/srv/webroot(/.*)?'
restorecon -Rv /srv/webroot
```

### 5. Verify new files inherit correctly

```
touch /srv/webroot/newfile.html
ls -Z /srv/webroot/newfile.html
# httpd_sys_content_t
```

## The Complete Workflow

1. `matchpathcon` — discover the expected label
2. `semanage fcontext -a` — define the persistent mapping
3. `restorecon -Rv` — apply labels from policy
4. Verify with `ls -Z`

Build muscle memory for this in our [SELinux for System Admins course](/courses).
