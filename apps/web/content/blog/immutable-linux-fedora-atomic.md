---
title: "Immutable Linux: Fedora Atomic"
description: "Fedora Atomic desktops (Silverblue, Kinoite) bring immutable OS images and container-based workflows. The future of Linux desktops explained."
date: "2026-03-15"
author: "Luca Berton"
category: "DevOps"
tags: ["Linux", "Fedora", "Immutable", "Containers"]
---

## What Is Immutable Linux?

In a traditional Linux distro, you install packages that modify the root filesystem. In an immutable distro, the OS image is read-only. Applications run in containers or Flatpaks. System updates replace the entire image atomically.

Fedora Atomic (formerly Silverblue/Kinoite) is the most mature implementation of this idea.

## How It Works

The base OS is delivered as an OSTree image. You don't install packages into the system — you layer them, run them in containers, or use Flatpak:

```bash
# System updates are atomic image swaps
rpm-ostree upgrade

# Reboot to apply
systemctl reboot

# Rollback is instant
rpm-ostree rollback
```

The root filesystem (`/usr`, `/etc`) is immutable by default. Your home directory and `/var` are writable.

## Three Ways to Install Software

### 1. Flatpak (GUI Applications)

Most desktop apps come from Flathub:

```bash
flatpak install flathub org.mozilla.firefox
flatpak install flathub com.visualstudio.code
```

### 2. Toolbx (Development)

For development tools, use Toolbx — a containerized environment that feels native:

```bash
# Create a mutable development container
toolbox create
toolbox enter

# Inside: install anything you want
sudo dnf install nodejs gcc python3 make
```

Your home directory is shared, so files are seamlessly accessible.

### 3. rpm-ostree (System-Level)

For packages that truly need to be in the base OS (drivers, system services):

```bash
# Layer a package onto the base image
rpm-ostree install vim htop

# Remove a layered package
rpm-ostree uninstall vim
```

Layered packages survive updates but add complexity.

## Why Go Immutable?

**Reliability:** Your system can't get into a broken state from a failed package install. Updates either succeed completely or don't apply at all.

**Security:** The read-only root filesystem means malware can't modify system binaries. Combined with Flatpak sandboxing, the attack surface shrinks dramatically.

**Reproducibility:** Every machine running the same image is identical. Great for fleet management.

## Fedora Atomic Variants

- **Fedora Silverblue** — GNOME desktop
- **Fedora Kinoite** — KDE Plasma desktop
- **Fedora Sericea** — Sway tiling WM
- **Fedora Onyx** — Budgie desktop

All share the same base technology, just different desktop environments.

## The Downsides

- **Learning curve** — the workflow is different from traditional Linux
- **Some tools don't fit** — system-level packages that aren't available as Flatpaks need rpm-ostree layering
- **IDE integration** can be tricky — VS Code needs to work with Toolbx containers
- **Slower package install** — rpm-ostree is slower than dnf

## Who Should Try It

- **Developers** who already use containers for everything
- **Security-conscious users** who want a hardened desktop
- People curious about the **future direction** of Linux desktops
- **Fleet managers** who need predictable systems

## The Bottom Line

Immutable Linux is where the desktop is heading. Fedora Atomic is the most polished version of this future. It's not for everyone today, but if you work with containers regularly, the mental model already makes sense.

Master containerized workflows with our [Docker and Kubernetes courses](/courses) — the perfect complement to immutable Linux.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
