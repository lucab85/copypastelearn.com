---
title: "Fix SELinux Apache Custom Webroot"
slug: "fix-selinux-apache-custom-webroot"
date: "2026-03-22"
category: "DevOps"
tags: ["SELinux", "Apache", "httpd", "RHEL", "Web Server"]
excerpt: "Step-by-step guide to fix SELinux 403 Forbidden errors when using a custom Apache DocumentRoot like /srv/webroot on RHEL."
---

## The Problem

You move Apache's DocumentRoot from `/var/www/html` to `/srv/webroot`. Everything looks right — permissions are fine, Apache config is valid. But you get:

```
curl http://localhost/index.html
# 403 Forbidden
```

The culprit? SELinux labels.

## Why It Happens

Files under `/var/www` are automatically labeled `httpd_sys_content_t`. Your custom path `/srv/webroot` gets `var_t` — a generic label that Apache can't read.

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

Edit `/etc/httpd/conf/httpd.conf`:

```
DocumentRoot "/srv/webroot"
<Directory "/srv/webroot">
    AllowOverride None
    Require all granted
</Directory>
```

### 3. Restart and observe the failure

```
systemctl restart httpd
curl http://localhost/index.html
# 403 Forbidden
```

### 4. Verify the label mismatch

```
ls -Z /srv/webroot/index.html
unconfined_u:object_r:var_t:s0 /srv/webroot/index.html
```

### 5. Quick test with chcon

```
chcon -t httpd_sys_content_t -R /srv/webroot
curl http://localhost/index.html
# SELinux Test
```

It works! But `chcon` is temporary.

### 6. Make it permanent

```
semanage fcontext -a -t httpd_sys_content_t '/srv/webroot(/.*)?'
restorecon -Rv /srv/webroot
```

### 7. Verify new files get the right label

```
touch /srv/webroot/newfile.html
ls -Z /srv/webroot/newfile.html
unconfined_u:object_r:httpd_sys_content_t:s0 /srv/webroot/newfile.html
```

## The Complete Workflow

1. `matchpathcon` — discover the expected label
2. `semanage fcontext -a` — define the persistent mapping
3. `restorecon -Rv` — apply labels from policy
4. Verify with `ls -Z`

This pattern works for any custom path — not just Apache. NFS mounts, Samba shares, application directories — if SELinux blocks access, check the labels first.

Build muscle memory for this workflow in our [SELinux for System Admins course](/courses) with guided RHEL labs.
