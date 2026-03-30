---
title: "SELinux Policy with sesearch"
slug: "selinux-policy-sesearch-guide"
date: "2026-03-23"
category: "DevOps"
tags: ["SELinux", "sesearch", "Policy", "RHEL", "setools"]
excerpt: "Use sesearch to query SELinux policy rules. Learn to inspect what httpd_t is allowed to do and verify policy before making changes."
description: "Use sesearch to query SELinux policy rules. Learn to inspect what httpd_t is allowed to do and verify policy before making changes."
---

## Why Query the Policy?

When troubleshooting SELinux, you need to know what's **supposed** to work. `sesearch` queries the active policy to answer questions like:

- Can Apache read `httpd_sys_content_t` files?
- Can Apache make outbound TCP connections?

## Installing setools

```
dnf install setools-console
```

## Basic Usage

### All allow rules for a domain

```
sesearch --allow -s httpd_t
```

### Check a specific interaction

```
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p read
```

Returns a rule = allowed. Empty = denied.

### Check network permissions

```
sesearch --allow -s httpd_t -c tcp_socket -p name_connect
```

## Connecting to AVC Troubleshooting

AVC denial says `httpd_t` denied `getattr` on `var_t`:

```
sesearch --allow -s httpd_t -t var_t -c file -p getattr
```

Empty — no rule. Compare with correct label:

```
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p getattr
```

Returns a rule — confirming the fix is relabeling.

## Policy Source vs Active Policy

On RHEL, the active policy is compiled. You don't edit `.te` files directly. Use `sesearch` to query and `audit2allow` to generate local modules when needed.

## The Investigation Pattern

1. Read the AVC → note source type, target type, class, permission
2. Query with `sesearch` → confirm no rule exists
3. Query the correct target type → confirm the rule exists
4. Fix the label or enable the boolean

Learn to investigate policy in our [SELinux for System Admins course](/courses).
