---
title: "Nix Package Manager for DevOps"
date: "2026-04-12"
description: "Nix creates reproducible development environments that work the same on every machine. Learn how to use Nix for DevOps: dev shells, Docker images, CI environments, and system configuration."
category: "DevOps"
tags: ["nix", "reproducible-builds", "developer-experience", "devops", "package-manager", "nixos"]
---

Every developer has heard "it works on my machine." Nix makes that statement meaningless by ensuring every machine has the exact same environment, down to the C library version.

## What Makes Nix Different

Traditional package managers (apt, brew, yum) install packages into shared system directories. Installing Python 3.12 replaces Python 3.11. Two projects that need different versions conflict.

Nix stores every package in an isolated path based on its hash:

```
/nix/store/abc123-python-3.11.9/
/nix/store/def456-python-3.12.4/
```

Both versions coexist. No conflicts. No "it worked yesterday."

## Dev Shells

The killer feature for DevOps: per-project development environments.

```nix
# flake.nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";

  outputs = { nixpkgs, ... }:
    let pkgs = nixpkgs.legacyPackages.x86_64-linux;
    in {
      devShells.x86_64-linux.default = pkgs.mkShell {
        packages = [
          pkgs.terraform
          pkgs.ansible
          pkgs.kubectl
          pkgs.helm
          pkgs.python312
          pkgs.nodejs_20
        ];

        shellHook = ''
          echo "DevOps shell ready"
          terraform --version
          ansible --version
        '';
      };
    };
}
```

```bash
# Enter the environment
nix develop

# Every team member gets identical tool versions
# No brew install, no version mismatches
```

Commit `flake.nix` and `flake.lock` to your repo. Every developer, CI runner, and production server gets the same versions.

## Docker Images with Nix

Nix builds minimal Docker images without a base distro:

```nix
pkgs.dockerTools.buildLayeredImage {
  name = "my-api";
  tag = "latest";
  contents = [
    pkgs.nodejs_20
    myApp
  ];
  config = {
    Cmd = [ "node" "server.js" ];
    ExposedPorts."3000/tcp" = {};
  };
}
```

The result is a Docker image with only your application and its exact dependencies. No shell, no package manager, no unused system libraries. Smaller attack surface and smaller image size.

## CI Environments

Nix eliminates "CI works differently than local":

```yaml
# GitHub Actions with Nix
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cachix/install-nix-action@v27
      - uses: cachix/cachix-action@v15
        with:
          name: my-project
      - run: nix develop --command make test
```

The CI environment is identical to the developer's local environment because both are defined by the same `flake.nix`.

## System Configuration (NixOS)

NixOS extends Nix's approach to the entire operating system:

```nix
# /etc/nixos/configuration.nix
{ config, pkgs, ... }: {
  services.nginx.enable = true;
  services.postgresql.enable = true;

  networking.firewall.allowedTCPPorts = [ 80 443 5432 ];

  users.users.deploy = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" ];
  };

  environment.systemPackages = [
    pkgs.vim
    pkgs.git
    pkgs.htop
  ];
}
```

Rebuild the system with `nixos-rebuild switch`. If something breaks, roll back with `nixos-rebuild switch --rollback`. The entire OS is version-controlled and reproducible.

## When Nix Makes Sense

**Good fit:**
- Teams with "works on my machine" problems
- Projects with complex dependency chains
- CI/CD that needs to match local environments exactly
- Building minimal, reproducible Docker images
- Multi-language projects (Python + Node + Go in one repo)

**Not ideal:**
- Teams unfamiliar with functional programming concepts
- Simple projects with standard toolchains
- Organizations that cannot invest in the learning curve

The learning curve is real. Nix's language and concepts are unlike anything else in the ecosystem. But for teams that adopt it, the reproducibility payoff is significant.

---

Ready to go deeper? Master DevOps tooling with hands-on courses at [CopyPasteLearn](/courses).
