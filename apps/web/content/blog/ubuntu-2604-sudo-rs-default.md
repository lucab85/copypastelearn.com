---
title: "Ubuntu 26.04 Makes sudo-rs Default"
date: "2026-04-27"
description: "Ubuntu 26.04 LTS replaces the 44-year-old C sudo with sudo-rs, a Rust rewrite. Learn what changes, why it matters for security, and what else ships in Resolute Raccoon."
category: "DevOps"
tags: ["ubuntu", "linux", "security", "rust", "sudo", "lts"]
---

Most Ubuntu 26.04 coverage focuses on Wayland-only or kernel 7.0. The biggest security change is quieter: **sudo-rs is now the default sudo provider**.

## Why sudo-rs Matters

sudo is the binary that runs as root on every Linux machine you manage. It has been written in C since 1980. In recent years it has had CVEs that allowed local privilege escalation — Baron Samedit (CVE-2021-3156) being the memorable one, with 10 years of unpatched exposure across most Linux distros.

sudo-rs is a full rewrite in Rust. Same `/etc/sudoers` config. Same interface. Drop-in replacement. The memory safety guarantees Rust provides matter specifically here — on the binary that handles privilege escalation.

This is not experimental. sudo-rs passed a full security audit in 2023. The sudo-rs team worked directly with the original sudo maintainer. Ubuntu 26.04 making it the default is the signal that it is production-ready.

## What Else Ships in 26.04 LTS

### Kernel 7.0

Intel TDX confidential computing on the host side with better hardware coverage. If you run workloads that need hardware-level isolation, this is the kernel to target.

### APT 3.2 with Transaction Rollback

Full transaction log with rollback capability:

```bash
# Undo the last package operation
sudo apt history-rollback
```

Every package operation is now reversible. For anyone who has debugged a broken dependency chain at 2 AM, this is significant.

### Wayland-Only

X11 is fully removed. No more Xorg fallback session in GDM. If you have legacy X11-only applications, test them under XWayland before upgrading.

### ROCm in Official Repos

AMD GPU compute is now a one-liner:

```bash
sudo apt install rocm
```

No more third-party repos or manual driver installation for AMD GPU workloads.

### Ptyxis Replaces GNOME Terminal

GPU-accelerated terminal emulator built on GTK4. Tabs that actually hold state across sessions. If you live in the terminal, this is a noticeable quality-of-life upgrade.

## LTS Support Timeline

Ubuntu 26.04 LTS is supported until 2031 with standard maintenance, extending to 10 years with Ubuntu Pro.

## What to Validate First

If you are building hardened base images, prioritize two things:

1. **sudo-rs compatibility** — verify your sudoers rules and any sudo wrappers work with the Rust implementation
2. **APT rollback flow** — test the transaction rollback in your CI pipeline so you can rely on it in production

The rest of 26.04 is evolutionary. sudo-rs is the change that actually shifts your security posture.

---

Ready to go deeper? Build hardened Linux infrastructure with our hands-on courses at [CopyPasteLearn](/courses).
