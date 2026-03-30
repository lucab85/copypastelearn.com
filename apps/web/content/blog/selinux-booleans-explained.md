---
title: "SELinux Booleans Explained"
slug: "selinux-booleans-explained"
date: "2026-03-21"
category: "DevOps"
tags: ["SELinux", "Booleans", "RHEL", "setsebool", "getsebool"]
excerpt: "SELinux booleans let you toggle common service behaviors without writing custom policy. Learn getsebool, setsebool, and the most useful httpd booleans."
description: "SELinux booleans let you toggle common service behaviors without writing custom policy. Learn getsebool, setsebool, and the most useful httpd booleans."
---

## What Are SELinux Booleans?

Booleans are **policy switches** that enable or disable common service behaviors without writing custom policy modules. They're the safest way to adjust SELinux behavior.

## Listing Booleans

```
getsebool -a | grep httpd
```

Shows booleans like:

```
httpd_can_network_connect --> off
httpd_can_network_connect_db --> off
httpd_enable_homedirs --> off
httpd_can_sendmail --> off
```

## Changing Booleans

Runtime only (lost on reboot):

```
setsebool httpd_can_network_connect on
```

Persistent (survives reboot):

```
setsebool -P httpd_can_network_connect on
```

Always use `-P` for production.

## Essential httpd Booleans

| Boolean | Purpose |
|---------|---------|
| `httpd_can_network_connect` | Outbound TCP connections |
| `httpd_can_network_connect_db` | Database connections |
| `httpd_enable_homedirs` | Serve user home dirs |
| `httpd_can_sendmail` | Send emails |
| `httpd_use_nfs` | Serve NFS content |

## Real-World Example: PHP-FPM over TCP

Apache connecting to PHP-FPM on `127.0.0.1:9000`:

```
curl http://localhost/index.php
# 503 Service Unavailable
```

AVC log shows `name_connect` denied. Fix:

```
setsebool -P httpd_can_network_connect on
```

## Boolean Discovery Workflow

1. Hit a denial → check AVC logs
2. Run `audit2allow` → see if it suggests a boolean
3. Verify with `getsebool boolean_name`
4. Enable with `setsebool -P boolean_name on`
5. Verify the service works

Learn to use booleans in our [SELinux for System Admins course](/courses).
