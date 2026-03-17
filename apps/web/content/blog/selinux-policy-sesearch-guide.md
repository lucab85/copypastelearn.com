---
title: "SELinux Policy with sesearch"
slug: "selinux-policy-sesearch-guide"
date: "2026-03-23"
category: "DevOps"
tags: ["SELinux", "sesearch", "Policy", "RHEL", "setools"]
excerpt: "Use sesearch to query SELinux policy rules. Learn to inspect what httpd_t is allowed to do and verify policy before making changes."
---

## Why Query the Policy?

When troubleshooting SELinux, you need to know what's **supposed** to work — not just what failed. `sesearch` lets you query the active policy to answer questions like:

- Can Apache read files labeled `httpd_sys_content_t`?
- Can Apache make outbound TCP connections?
- What types can `httpd_t` interact with?

## Installing setools

```
dnf install setools-console
```

## Basic Usage

### Show all allow rules for a domain

```
sesearch --allow -s httpd_t
```

This produces a lot of output. Narrow it down.

### Check a specific interaction

```
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p read
```

If this returns a rule, Apache is allowed to read those files. If empty — it's denied.

### Check network permissions

```
sesearch --allow -s httpd_t -c tcp_socket -p name_connect
```

This shows which types `httpd_t` can connect to via TCP.

## Connecting sesearch to AVC Troubleshooting

When you see an AVC denial like:

```
avc: denied { getattr } for comm="httpd"
scontext=...httpd_t:s0 tcontext=...var_t:s0 tclass=file
```

Verify with `sesearch`:

```
sesearch --allow -s httpd_t -t var_t -c file -p getattr
```

Empty result confirms there's **no policy rule** allowing this — it's a labeling problem, not a missing policy.

Compare with the correct label:

```
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p getattr
```

This returns a rule — confirming the fix is relabeling to `httpd_sys_content_t`.

## Policy Source vs Active Policy

A common question: "Where's the `httpd_t.te` file?"

On RHEL, the active policy is **compiled**. You don't edit `.te` files directly. Instead:

- Use `sesearch` to query the compiled policy
- Use `audit2allow` to generate local modules (with caution)
- Base policy is managed by RPM packages

For operational troubleshooting, `sesearch` + AVC logs are usually all you need.

## Practical Examples

### Can Apache read web content?

```
sesearch --allow -s httpd_t -t httpd_sys_content_t -c file -p read
```

### Can Apache write to upload directories?

```
sesearch --allow -s httpd_t -t httpd_sys_rw_content_t -c file -p write
```

### Check boolean-dependent rules

After enabling `httpd_can_network_connect`:

```
sesearch --allow -s httpd_t -c tcp_socket -p name_connect
```

The output will include rules that were activated by the boolean.

## The Investigation Pattern

1. Read the AVC denial → note source type, target type, class, permission
2. Query with `sesearch` → confirm no rule exists
3. Query the correct target type → confirm the rule exists there
4. Fix the label or enable the boolean

This is how experienced admins approach SELinux — methodically, not by guessing.

Learn to investigate policy like a pro in our [SELinux for System Admins course](/courses).
