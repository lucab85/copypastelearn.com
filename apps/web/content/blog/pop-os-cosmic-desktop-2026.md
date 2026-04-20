---
title: "Pop!_OS and COSMIC Desktop 2026"
description: "System76's Pop!_OS with the new COSMIC desktop built in Rust delivers a polished tiling workflow. What's new and is it ready for daily use?"
date: "2026-03-13"
author: "Luca Berton"
category: "DevOps"
tags: ["Linux", "Pop!_OS", "COSMIC", "Desktop"]
---

## What Is Pop!_OS?

Pop!_OS is System76's Ubuntu-based distribution, designed primarily for their hardware but available for any PC. It's known for excellent NVIDIA support, a clean desktop experience, and productivity-focused tiling features.

Pop!_OS 24.04 LTS with the new COSMIC desktop is the headline story in 2026.

## The COSMIC Desktop

COSMIC is System76's ground-up desktop environment, written entirely in Rust using the Iced toolkit. This isn't a GNOME fork or a theme — it's a completely new desktop:

- **Built-in tiling** with keyboard-driven window management
- **Customizable panels** (top bar, dock, or both)
- **App Library** for quick launching
- **GPU-accelerated rendering** throughout
- **Workspaces** with multi-monitor support

The Rust foundation means memory safety and potentially better performance than C/C++ based desktops.

## Auto-Tiling

Pop!_OS's auto-tiling was already great with GNOME. COSMIC takes it further:

```
Super + Y           → Toggle auto-tiling
Super + Arrow Keys  → Move window focus
Super + Shift + Arrow → Move windows
Super + /           → App launcher
Super + G           → Toggle floating mode
```

If you've used i3 or Sway but wanted something more polished, COSMIC's tiling is the answer.

## NVIDIA Support

Pop!_OS is one of the few distros that ships a separate ISO with NVIDIA drivers pre-installed. No post-install driver hunting:

```bash
# Check your GPU driver
nvidia-smi

# Switch between integrated and discrete GPU
system76-power graphics switchable
```

This alone makes Pop!_OS worth considering for anyone with an NVIDIA card.

## Flatpak by Default

Unlike Ubuntu, Pop!_OS uses Flatpak instead of Snap for sandboxed applications. Flathub is enabled out of the box:

```bash
# Install from Flathub
flatpak install flathub com.spotify.Client

# List installed Flatpaks
flatpak list
```

## Firmware Updates

System76 hardware gets firmware updates through `fwupd` and the Pop!_OS GUI. Even on non-System76 hardware, the LVFS firmware update support works well.

## Current Status

As of early 2026, COSMIC is usable for daily work but still has rough edges. Some features like advanced multi-monitor configuration and all accessibility options are still being implemented. It's improving rapidly — weekly alpha builds show visible progress.

## Who Should Use Pop!_OS

- **System76 hardware owners** (obvious choice)
- **NVIDIA GPU users** who are tired of driver issues
- **Keyboard-driven workflow** enthusiasts
- Anyone interested in the **future of Linux desktops**

## Who Should Wait

- People who need a completely polished, stable desktop today → use Fedora or Mint
- Server administrators → Debian or Ubuntu Server
- Anyone who depends on extensive GNOME extensions → stick with Fedora GNOME

## The Bottom Line

COSMIC is the most ambitious Linux desktop project in years. It's not fully mature yet, but the trajectory is exciting. If you want to try the future of Linux desktops and can tolerate occasional rough edges, Pop!_OS with COSMIC is worth your time.

Explore [CopyPasteLearn courses](/courses) to master the Linux command line and DevOps tools.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
