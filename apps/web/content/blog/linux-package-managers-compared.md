---
title: "Linux Package Managers Compared"
description: "apt, dnf, pacman, zypper, apk — every major Linux package manager explained with examples. Know which one your distro uses and why."
date: "2026-03-19"
author: "Luca Berton"
category: "DevOps"
tags: ["Linux", "Package Manager", "apt", "dnf", "pacman"]
---

## Why Package Managers Matter

Package managers are how you install, update, and remove software on Linux. Every distro has one, and understanding yours is fundamental to using Linux effectively.

## apt (Debian, Ubuntu, Mint)

The most widely used package manager, powering Debian and all its derivatives:

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade

# Install a package
sudo apt install nginx

# Remove a package
sudo apt remove nginx

# Remove with config files
sudo apt purge nginx

# Search
apt search docker

# Show package info
apt show nginx

# Clean up unused dependencies
sudo apt autoremove
```

**Key concept:** `apt update` refreshes the package index. `apt upgrade` installs newer versions. You need both.

## dnf (Fedora, RHEL, Rocky, Alma)

The Red Hat family package manager, successor to `yum`:

```bash
# Install
sudo dnf install httpd

# Remove
sudo dnf remove httpd

# Update all
sudo dnf upgrade

# Search
dnf search nodejs

# List installed
dnf list installed

# Show package info
dnf info nginx

# Clean cache
sudo dnf clean all

# Install a package group
sudo dnf group install "Development Tools"
```

**Key difference from apt:** dnf resolves dependencies and updates the index in one step — no separate "update" command needed.

## pacman (Arch, Manjaro, EndeavourOS)

Arch's package manager — fast and concise:

```bash
# Sync database and upgrade
sudo pacman -Syu

# Install
sudo pacman -S firefox

# Remove with dependencies
sudo pacman -Rns firefox

# Search remote
pacman -Ss docker

# Search installed
pacman -Qs docker

# Show package info
pacman -Si nginx

# List orphan packages
pacman -Qdt

# Clean cache
sudo pacman -Sc
```

**The flags:** `-S` = sync (install), `-R` = remove, `-Q` = query (local), `-Ss` = sync search. It's cryptic at first but fast once learned.

## zypper (openSUSE)

openSUSE's package manager with powerful dependency resolution:

```bash
# Install
sudo zypper install vim

# Remove
sudo zypper remove vim

# Update all
sudo zypper update

# Distribution upgrade (for Tumbleweed)
sudo zypper dup

# Search
zypper search nodejs

# Add repository
sudo zypper addrepo <url> <alias>

# Refresh repos
sudo zypper refresh
```

## apk (Alpine)

Alpine's minimalist package manager:

```bash
# Update index
apk update

# Install (--no-cache skips local index)
apk add --no-cache nginx

# Remove
apk del nginx

# Search
apk search nodejs

# Info
apk info nginx

# List installed
apk list --installed
```

**Why `--no-cache`:** In containers, you don't want to store the package index. This flag downloads, installs, and discards the index in one step.

## Quick Reference

| Action | apt | dnf | pacman | zypper | apk |
|--------|-----|-----|--------|--------|-----|
| Install | apt install | dnf install | pacman -S | zypper install | apk add |
| Remove | apt remove | dnf remove | pacman -R | zypper remove | apk del |
| Update index | apt update | (automatic) | pacman -Sy | zypper refresh | apk update |
| Upgrade all | apt upgrade | dnf upgrade | pacman -Syu | zypper update | apk upgrade |
| Search | apt search | dnf search | pacman -Ss | zypper search | apk search |

## Flatpak and Snap

Beyond distro package managers, there are universal formats:

**Flatpak** — sandboxed desktop apps from Flathub. Used by Fedora, Mint, Pop!_OS.

**Snap** — Canonical's universal package format. Default on Ubuntu.

```bash
# Flatpak
flatpak install flathub com.spotify.Client

# Snap
sudo snap install code --classic
```

Both provide dependency isolation and auto-updates, but add overhead compared to native packages.

## The Bottom Line

Learn your distro's package manager well — it's the tool you'll use most. For servers, stick with native packages (`apt`, `dnf`, `apk`). For desktop apps, Flatpak adds convenience without risk to system stability.

Practice Linux package management in our [hands-on DevOps courses](/courses) with real terminal environments.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
