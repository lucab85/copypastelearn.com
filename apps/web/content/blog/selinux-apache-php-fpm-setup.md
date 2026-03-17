---
title: "SELinux for Apache and PHP-FPM"
slug: "selinux-apache-php-fpm-setup"
date: "2026-03-24"
category: "DevOps"
tags: ["SELinux", "Apache", "PHP-FPM", "RHEL", "Web Server"]
excerpt: "Configure Apache with PHP-FPM over TCP on RHEL with SELinux enforcing. Fix name_connect denials with the right boolean."
---

## The Setup

A common web stack: Apache as the web server, PHP-FPM as the PHP processor, connected over TCP. On RHEL with SELinux enforcing, this requires proper configuration.

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

Restart PHP-FPM:

```
systemctl restart php-fpm
```

## Configure Apache

Edit `/etc/httpd/conf.d/php.conf` to proxy PHP requests to the TCP listener:

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

Check the AVC log:

```
grep AVC /var/log/audit/audit.log | grep 9000
```

```
avc: denied { name_connect } for comm="httpd"
scontext=system_u:system_r:httpd_t:s0
tcontext=system_u:object_r:http_port_t:s0
tclass=tcp_socket
```

Apache (`httpd_t`) is trying to make an outbound TCP connection — and SELinux blocks it by default.

## Use audit2allow to Identify the Fix

```
grep AVC /var/log/audit/audit.log | grep 9000 | audit2allow

#!!!! This avc can be allowed using one of these booleans:
#     httpd_can_network_connect, httpd_graceful_shutdown
allow httpd_t http_port_t:tcp_socket name_connect;
```

The tool suggests booleans. `httpd_can_network_connect` is the right one.

## Apply the Fix

```
setsebool -P httpd_can_network_connect on
```

## Verify

```
curl http://localhost/index.php
# <title>PHP 8.3 - phpinfo()</title>...
```

PHP-FPM is now serving pages through Apache with SELinux enforcing.

## TCP vs Unix Socket

This lab uses TCP intentionally to demonstrate the `name_connect` denial. In production, many RHEL setups use Unix sockets instead:

```ini
# /etc/php-fpm.d/www.conf
listen = /run/php-fpm/www.sock
```

Unix sockets involve different SELinux checks — labels on the socket file rather than network booleans. Both approaches work; the SELinux requirements differ.

## Key Takeaway

When a service needs to make outbound TCP connections:

1. Check AVC logs for `name_connect` denials
2. Use `audit2allow` to identify the relevant boolean
3. Enable with `setsebool -P`
4. Verify the service works

Practice this exact scenario in our [SELinux for System Admins course](/courses) with guided RHEL labs.
