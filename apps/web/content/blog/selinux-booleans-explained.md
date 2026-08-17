---
title: "SELinux Booleans Explained"
slug: "selinux-booleans-explained"
date: "2026-03-21"
category: "DevOps"
tags: ["SELinux", "Booleans", "RHEL", "setsebool", "getsebool"]
excerpt: "SELinux booleans let you toggle common service behaviors without writing custom policy. Learn getsebool, setsebool, and the most useful httpd booleans."
description: "SELinux booleans let you toggle common service behaviors without writing custom policy. Learn getsebool, setsebool, and the most useful httpd booleans."
author: "Luca Berton"
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

---

**Ready to go deeper?** Check out our hands-on course: [SELinux for System Admins](/courses/selinux-system-admins) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use SELinux Booleans Explained as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to SELinux, Booleans, RHEL, setsebool. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use SELinux Booleans Explained?

Use it when you need a practical, repeatable way to handle SELinux, Booleans, RHEL, setsebool work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

