---
title: "SELinux DAC vs MAC Explained"
slug: "selinux-dac-vs-mac-explained"
date: "2026-03-18"
category: "DevOps"
tags: ["SELinux", "Linux Security", "DAC", "MAC", "RHEL"]
excerpt: "Understand the difference between Discretionary and Mandatory Access Control. Learn why MAC stops attacks that DAC cannot prevent."
description: "Understand the difference between Discretionary and Mandatory Access Control. Learn why MAC stops attacks that DAC cannot prevent."
---

## Two Layers of Access Control

Linux has two independent access control systems. Understanding both is essential for securing any production server.

## DAC: Discretionary Access Control

DAC is the traditional Unix permission model:

```
ls -l /etc/passwd
-rw-r--r--. 1 root root 1524 Oct 28 07:13 /etc/passwd
```

Key characteristics:

- Based on user identity (uid/gid)
- Owner controls permissions with `chmod`, `chown`
- Root bypasses most checks
- Users can share access at their discretion

The problem? If an attacker compromises a process, they inherit **all** that user's permissions.

## MAC: Mandatory Access Control

MAC adds policy-driven labels that even root must obey:

```
ls -lZ /etc/passwd
-rw-r--r--. 1 root root system_u:object_r:passwd_file_t:s0 1524 Oct 28 07:13 /etc/passwd
```

The `-Z` flag reveals the SELinux **security context**: `system_u:object_r:passwd_file_t:s0`.

Key characteristics:

- Based on **labels and policy rules**, not identity
- System policy overrides user decisions
- Even root is subject to policy constraints
- Limits damage from compromised processes

## The Critical Rule

**SELinux can deny access even when DAC allows it.** But SELinux cannot allow access when DAC denies it.

They work in layers:

1. DAC check happens first
2. If DAC allows, SELinux check happens
3. Both must allow for access to succeed

## Security Contexts

Every process and file has a security context with four fields:

```
user:role:type:level
```

For example: `system_u:system_r:httpd_t:s0`

- **User** (`system_u`) — SELinux user identity
- **Role** (`system_r`) — Role-based access control
- **Type** (`httpd_t`) — **This is the most important field**
- **Level** (`s0`) — MLS sensitivity level

## Inspecting Contexts

Use the `-Z` flag with common commands:

```
# File contexts
ls -Z /var/www

# Process contexts
ps -eZ | grep httpd

# Your user context
id -Z
```

Ready to practice DAC vs MAC hands-on? Our [SELinux for System Admins course](/courses) includes real RHEL labs where you'll see both access control layers in action.
