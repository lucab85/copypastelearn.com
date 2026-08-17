---
title: "SELinux for Apache and PHP-FPM"
slug: "selinux-apache-php-fpm-setup"
date: "2026-03-24"
category: "DevOps"
tags: ["SELinux", "Apache", "PHP-FPM", "RHEL", "Web Server"]
excerpt: "Configure Apache with PHP-FPM over TCP on RHEL with SELinux enforcing. Fix name_connect denials with the right boolean."
description: "Configure Apache with PHP-FPM over TCP on RHEL with SELinux enforcing. Diagnose and fix name_connect denials using the correct SELinux boolean and audit tools."
author: "Luca Berton"
---

## The Setup

Apache as web server, PHP-FPM as PHP processor, connected over TCP on RHEL with SELinux enforcing.

## Install the Stack

```
dnf install -y httpd php php-fpm
systemctl enable --now httpd php-fpm
```

## Configure PHP-FPM for TCP

Edit `/etc/php-fpm.d/www.conf`:

```ini
listen = 127.0.0.1:9000
```

## Configure Apache

Edit `/etc/httpd/conf.d/php.conf`:

```apache
<FilesMatch \.(php|phar)$>
    SetHandler "proxy:fcgi://127.0.0.1:9000"
</FilesMatch>
```

Create a test page:

```
echo '<?php phpinfo();' > /var/www/html/index.php
```

## The SELinux Denial

```
curl http://localhost/index.php
# 503 Service Unavailable
```

AVC log:

```
avc: denied { name_connect } for comm="httpd"
scontext=system_u:system_r:httpd_t:s0
tcontext=system_u:object_r:http_port_t:s0
tclass=tcp_socket
```

## Identify the Fix

```
grep AVC /var/log/audit/audit.log | grep 9000 | audit2allow

#!!!! This avc can be allowed using one of these booleans:
#     httpd_can_network_connect, httpd_graceful_shutdown
allow httpd_t http_port_t:tcp_socket name_connect;
```

## Apply the Fix

```
setsebool -P httpd_can_network_connect on
```

## Verify

```
curl http://localhost/index.php
# PHP info page renders
```

## TCP vs Unix Socket

This lab uses TCP to demonstrate `name_connect`. Production setups often use Unix sockets with different SELinux checks (labels on the socket file).

Practice this exact scenario in our [SELinux for System Admins course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [SELinux for System Admins](/courses/selinux-system-admins) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use SELinux for Apache and PHP-FPM as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to SELinux, Apache, PHP-FPM, RHEL. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use SELinux for Apache and PHP-FPM?

Use it when you need a practical, repeatable way to handle SELinux, Apache, PHP-FPM, RHEL work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

