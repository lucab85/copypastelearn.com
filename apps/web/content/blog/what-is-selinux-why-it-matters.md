---
title: "What Is SELinux and Why It Matters"
slug: "what-is-selinux-why-it-matters"
date: "2026-03-17"
category: "DevOps"
tags: ["SELinux", "Linux Security", "RHEL", "MAC"]
excerpt: "SELinux enforces mandatory access control on Linux. Learn what it is, why 87% of enterprises need it, and how it stops real attacks like Log4Shell."
description: "SELinux enforces mandatory access control on Linux. Learn what it is, why 87% of enterprises need it, and how it stops real attacks like Log4Shell."
---

## What Is SELinux?

SELinux stands for Security-Enhanced Linux. Developed by the NSA and released as open source in 2000, it adds **Mandatory Access Control (MAC)** on top of traditional Linux permissions.

Think of it this way: regular Linux permissions (DAC) let file owners decide who can access what. SELinux adds a second layer where the **system policy** decides — regardless of what the owner wants.

## DAC vs MAC

Traditional Linux uses Discretionary Access Control:

- Access based on user/group identity (uid/gid)
- Owner can change permissions freely
- Root can do almost anything

SELinux adds Mandatory Access Control:

- Access based on **labels** and **policy rules**
- Even root is constrained
- Policy defines allowed interactions between types

The key insight: **SELinux can deny access even when DAC allows it**, but it cannot allow access when DAC denies it.

## Why SELinux Matters

### Real CVE Protection

SELinux has proven its value against real-world vulnerabilities:

- **Log4Shell (CVE-2021-44228)** — Critical RCE. SELinux confined the vulnerable Java process, limiting the attacker's reach to sensitive files
- **Looney Tunables (CVE-2023-4911)** — Privilege escalation via glibc buffer overflow. SELinux policies restricted the elevated process
- **Grafana (CVE-2023-3128)** — Authentication bypass. SELinux added defense-in-depth

### Compliance Requirements

Regulations like NIS2, DORA, and hardening baselines (CIS, DISA STIGs) all recommend or require SELinux in enforcing mode.

## The Three Modes

SELinux operates in three modes:

- **Enforcing** — Policy is applied, violations are blocked and logged
- **Permissive** — Violations are logged but not blocked (useful for troubleshooting)
- **Disabled** — SELinux is off entirely (never do this in production)

Check your current mode:

```
getenforce
```

## Getting Started

SELinux is enabled by default on RHEL. The **targeted** policy confines selected services while leaving most user activity unconfined — a practical balance between security and usability.

Want to master SELinux hands-on? Our [SELinux for System Admins course](/courses) walks you through real-world labs on RHEL 9/10 — from labels to booleans to troubleshooting production web servers.
