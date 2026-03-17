---
title: "SELinux Booleans Explained"
slug: "selinux-booleans-explained"
date: "2026-03-21"
category: "DevOps"
tags: ["SELinux", "Booleans", "RHEL", "setsebool", "getsebool"]
excerpt: "SELinux booleans let you toggle common service behaviors without writing custom policy. Learn getsebool, setsebool, and the most useful httpd booleans."
---

## What Are SELinux Booleans?

Booleans are **policy switches** that enable or disable common service behaviors without writing custom policy modules. They're the safest way to adjust SELinux behavior.

Think of them as pre-built toggles. Instead of writing a custom policy to let Apache make network connections, you flip a boolean.

## Listing Booleans

See all booleans:

```
getsebool -a
```

Filter for a specific service:

```
getsebool -a | grep httpd
```

This shows booleans like:

```
httpd_can_network_connect --> off
httpd_can_network_connect_db --> off
httpd_enable_homedirs --> off
httpd_can_sendmail --> off
```

## Changing Booleans

### Runtime only (lost on reboot):

```
setsebool httpd_can_network_connect on
```

### Persistent (survives reboot):

```
setsebool -P httpd_can_network_connect on
```

Always use `-P` for production changes.

## Essential httpd Booleans

| Boolean | Purpose |
|---------|---------|
| `httpd_can_network_connect` | Allow Apache to make outbound TCP connections |
| `httpd_can_network_connect_db` | Allow Apache to connect to databases |
| `httpd_enable_homedirs` | Serve content from user home directories |
| `httpd_can_sendmail` | Allow Apache to send emails |
| `httpd_use_nfs` | Allow Apache to serve NFS-mounted content |

## Real-World Example: PHP-FPM over TCP

Apache needs to connect to PHP-FPM listening on `127.0.0.1:9000`. Without the boolean:

```
curl http://localhost/index.php
# 503 Service Unavailable
```

The AVC log shows:

```
avc: denied { name_connect } for comm="httpd"
scontext=system_u:system_r:httpd_t:s0
tcontext=system_u:object_r:http_port_t:s0
tclass=tcp_socket
```

The fix:

```
setsebool -P httpd_can_network_connect on
```

Now PHP pages work. No custom policy needed.

## How audit2allow Points to Booleans

When you pipe AVC denials through `audit2allow`, it often suggests booleans:

```
grep AVC /var/log/audit/audit.log | audit2allow

#!!!! This avc can be allowed using one of these booleans:
#     httpd_can_network_connect, httpd_graceful_shutdown
allow httpd_t http_port_t:tcp_socket name_connect;
```

Always check if a boolean exists before creating a custom policy.

## Boolean Discovery Workflow

1. Hit a denial → check AVC logs
2. Run `audit2allow` → see if it suggests a boolean
3. Verify with `getsebool boolean_name`
4. Enable with `setsebool -P boolean_name on`
5. Verify the service works

This is safer and more maintainable than custom policy modules.

Learn to use booleans with real service configurations in our [SELinux for System Admins course](/courses).
