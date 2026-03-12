---
title: "NixOS: Reproducible Linux Builds"
description: "NixOS uses declarative configuration and the Nix package manager to create fully reproducible systems. Learn what makes it unique and who it's for."
date: "2026-03-14"
author: "Luca Berton"
category: "DevOps"
tags: ["Linux", "NixOS", "Nix", "Reproducibility"]
---

## Why NixOS?

NixOS is unlike any other Linux distribution. Your entire system — packages, services, kernel, bootloader — is defined in a single configuration file. Change the file, rebuild, and you get an identical system every time.

## Declarative System Configuration

Instead of running `apt install` commands, you edit `/etc/nixos/configuration.nix`:

```nix
{ config, pkgs, ... }:

{
  # Enable SSH
  services.openssh.enable = true;

  # Install packages
  environment.systemPackages = with pkgs; [
    vim
    git
    firefox
    docker
  ];

  # Enable Docker
  virtualisation.docker.enable = true;

  # Firewall
  networking.firewall.allowedTCPPorts = [ 22 80 443 ];

  # Users
  users.users.dev = {
    isNormalUser = true;
    extraGroups = [ "docker" "wheel" ];
  };
}
```

Then rebuild:

```bash
sudo nixos-rebuild switch
```

That's it. Your entire system state is defined in code.

## Atomic Upgrades and Rollbacks

Every `nixos-rebuild` creates a new generation. If an update breaks something, you select a previous generation from the boot menu — instant rollback.

```bash
# List generations
nix-env --list-generations

# Rollback
sudo nixos-rebuild switch --rollback

# Or select from boot menu — every generation is listed
```

This is similar to Btrfs snapshots in openSUSE, but at a higher level — it's the package and configuration state, not the filesystem.

## Nix Package Manager

The Nix package manager can be used on any Linux distro or macOS, independent of NixOS:

```bash
# Install Nix on any distro
sh <(curl -L https://nixos.org/nix/install)

# Install a package temporarily
nix-shell -p nodejs python3 rustc

# Create a development environment
nix develop
```

Nixpkgs is the largest package repository of any distro, with over 100,000 packages.

## Flakes (Modern Nix)

Nix Flakes are the modern way to manage Nix projects — pinned dependencies, reproducible builds:

```nix
{
  description = "My project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      packages = with nixpkgs.legacyPackages.x86_64-linux; [
        nodejs
        postgresql
      ];
    };
  };
}
```

## The Learning Curve

Let's be honest: NixOS has a steep learning curve. The Nix language is functional and unlike anything else in the Linux world. Documentation has improved significantly, but you'll still spend time reading and experimenting.

## Who Should Use NixOS

- **DevOps engineers** who want reproducible infrastructure
- **Developers** managing complex multi-language environments
- Anyone who's been burned by **"works on my machine"** problems
- People who treat their **OS config as code**

## Who Should Not Use NixOS

- Linux beginners
- Anyone who doesn't enjoy learning new paradigms
- People who need to get work done today, not next week

## The Bottom Line

NixOS is the most technically interesting Linux distro in 2026. The idea of a fully reproducible, declarative operating system is compelling. But it demands investment — in learning the language, the tooling, and the mindset. If you're a DevOps engineer or developer who values reproducibility, NixOS is worth that investment.

Take your infrastructure-as-code skills to the next level with our [Terraform and Ansible courses](/courses).
