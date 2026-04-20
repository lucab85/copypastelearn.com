---
title: "SELinux for Apache and PHP-FPM"
slug: "selinux-apache-php-fpm-setup"
date: "2026-03-24"
category: "DevOps"
tags: ["SELinux", "Apache", "PHP-FPM", "RHEL", "Web Server"]
excerpt: "Configure Apache with PHP-FPM over TCP on RHEL with SELinux enforcing. Fix name_connect denials with the right boolean."
description: "Configure Apache with PHP-FPM over TCP on RHEL with SELinux enforcing. Diagnose and fix name_connect denials using the correct SELinux boolean and audit tools."
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

