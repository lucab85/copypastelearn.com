---
title: "Coder Remote Development Platform"
date: "2026-02-09"
description: "Coder provisions cloud development environments on Kubernetes, AWS, or any infrastructure. Learn how Coder replaces local dev setups with consistent, powerful remote workspaces."
category: "DevOps"
tags: ["coder", "remote-development", "developer-experience", "kubernetes", "ide", "platform-engineering"]
---

New developer joins. Three days setting up the local environment. Docker, language runtimes, database, env vars, VPN. Coder provisions a ready-to-code workspace in minutes with everything pre-configured.

## How Coder Works

```
Developer → VS Code / Browser → Coder Workspace (K8s pod / VM)
                                    ├── Code (git clone)
                                    ├── Runtime (Node 20, Go 1.22)
                                    ├── Database (local Postgres)
                                    ├── Tools (kubectl, terraform)
                                    └── Env vars (from Vault)
```

Workspaces run on your infrastructure. Code stays in your network. Nothing leaves.

## Installation

```bash
helm install coder coder-v2/coder \
  --namespace coder --create-namespace \
  --set coder.accessURL=https://coder.myorg.com
```

## Templates

Templates define workspace environments using Terraform:

```hcl
# templates/backend/main.tf
terraform {
  required_providers {
    coder = { source = "coder/coder" }
    kubernetes = { source = "hashicorp/kubernetes" }
  }
}

data "coder_workspace" "me" {}

resource "kubernetes_pod" "workspace" {
  metadata {
    name      = "coder-${data.coder_workspace.me.owner}-${data.coder_workspace.me.name}"
    namespace = "coder-workspaces"
  }

  spec {
    container {
      name  = "dev"
      image = "myorg/dev-image:latest"
      command = ["sh", "-c", "sleep infinity"]

      resources {
        requests = {
          cpu    = "2"
          memory = "4Gi"
        }
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
      }

      volume_mount {
        name       = "home"
        mount_path = "/home/coder"
      }
    }

    volume {
      name = "home"
      persistent_volume_claim {
        claim_name = kubernetes_persistent_volume_claim.home.metadata[0].name
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim" "home" {
  metadata {
    name      = "coder-${data.coder_workspace.me.owner}-home"
    namespace = "coder-workspaces"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = { storage = "20Gi" }
    }
  }
}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"
  dir  = "/home/coder"

  startup_script = <<-EOF
    git clone https://github.com/myorg/order-api /home/coder/order-api || true
    cd /home/coder/order-api && npm install
  EOF
}
```

## Dev Image

```dockerfile
# dev-image/Dockerfile
FROM ubuntu:22.04

# Languages
RUN apt-get update && apt-get install -y \
    nodejs npm python3 python3-pip golang-go

# Tools
RUN apt-get install -y \
    git curl wget vim \
    kubectl helm terraform \
    docker.io postgresql-client redis-tools

# VS Code Server (for browser IDE)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Non-root user
RUN useradd -m -s /bin/bash coder
USER coder
WORKDIR /home/coder
```

## Connect with VS Code

```bash
# Install Coder CLI
curl -fsSL https://coder.com/install.sh | sh

# Login
coder login https://coder.myorg.com

# Create workspace
coder create my-workspace --template backend

# Open in VS Code (SSH tunnel)
coder open vscode my-workspace
```

VS Code connects over SSH to the remote workspace. Extensions, terminal, debugger — everything runs remotely with local-feeling latency.

## Auto-Stop

```hcl
resource "coder_workspace" "me" {
  # Stop workspace after 2 hours of inactivity
  ttl = 7200
}
```

Workspaces stop when developers are not using them. Start again in seconds — PVC preserves all state.

## Parameters

Let developers customize their workspace:

```hcl
data "coder_parameter" "cpu" {
  name    = "CPU cores"
  type    = "number"
  default = 2
  validation {
    min = 1
    max = 8
  }
}

data "coder_parameter" "dotfiles" {
  name    = "Dotfiles repo"
  type    = "string"
  default = ""
}
```

## When to Use Coder

**Good fit:**
- Teams with complex dev environment setup (>30 min onboarding)
- Organizations needing consistent environments across developers
- Security-sensitive work (code never on laptops)
- Teams with underpowered developer laptops

**Not needed:**
- Small teams where `docker compose up` is sufficient
- Projects with simple setup (clone + npm install)
- Developers who prefer full local control

---

Ready to go deeper? Build your developer platform with hands-on courses at [CopyPasteLearn](/courses).
