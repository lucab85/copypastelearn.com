---
title: "Fix SELinux Apache Custom Webroot"
slug: "fix-selinux-apache-custom-webroot"
date: "2026-03-22"
category: "DevOps"
tags: ["SELinux", "Apache", "httpd", "RHEL", "Web Server"]
excerpt: "Step-by-step guide to fix SELinux 403 Forbidden errors when using a custom Apache DocumentRoot like /srv/webroot on RHEL."
description: "Step-by-step guide to fix SELinux 403 Forbidden errors when using a custom Apache DocumentRoot like /srv/webroot on RHEL."
author: "Luca Berton"
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

---

**Ready to go deeper?** Check out our hands-on course: [SELinux for System Admins](/courses/selinux-system-admins) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Fix SELinux Apache Custom Webroot as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to SELinux, Apache, httpd, RHEL. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Fix SELinux Apache Custom Webroot?

Use it when you need a practical, repeatable way to handle SELinux, Apache, httpd, RHEL work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

