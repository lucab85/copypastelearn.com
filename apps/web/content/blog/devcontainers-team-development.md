---
title: "DevContainers for Team Development"
date: "2026-04-07"
description: "Dev Containers standardize development environments using Docker. Learn how to set up devcontainers for your team with VS Code, GitHub Codespaces, and custom features."
category: "Development"
tags: ["devcontainers", "docker", "vscode", "developer-experience", "codespaces", "development-environment"]
---

New developer onboarding should not take a week. With Dev Containers, it takes one click: open the repo, the environment builds itself, and every tool is pre-installed at the right version.

## What Dev Containers Are

A Dev Container is a Docker container configured as a full development environment. Your editor (VS Code, JetBrains) connects to the container and runs all tools inside it. Your local machine stays clean.

```json
// .devcontainer/devcontainer.json
{
  "name": "My Project",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {}
  },
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-azuretools.vscode-docker"
      ]
    }
  },
  "forwardPorts": [3000, 5432]
}
```

Commit this to your repo. Every developer opens the project and gets:
- Node.js 20
- Docker CLI
- kubectl and Helm
- ESLint and Prettier configured
- Ports forwarded automatically

## Custom Dockerfiles

For complex environments, use a custom Dockerfile:

```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install project-specific tools
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3-pip \
    postgresql-client \
    redis-tools

# Install Terraform
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip \
    -o terraform.zip && \
    unzip terraform.zip -d /usr/local/bin && \
    rm terraform.zip

# Install project dependencies
COPY requirements.txt /tmp/
RUN pip3 install -r /tmp/requirements.txt
```

```json
// .devcontainer/devcontainer.json
{
  "build": {
    "dockerfile": "Dockerfile"
  }
}
```

## GitHub Codespaces

Codespaces runs your Dev Container in the cloud. No local Docker needed:

1. Go to your GitHub repo
2. Click "Code" → "Codespaces" → "Create codespace"
3. VS Code opens in browser with your full environment

For teams with underpowered laptops or strict corporate machines, Codespaces removes the "my machine cannot run Docker" problem.

## Docker Compose Integration

If your project needs databases or other services:

```yaml
# .devcontainer/docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

```json
// .devcontainer/devcontainer.json
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

Open the project and you get the app environment plus a running Postgres and Redis — no local installation.

## Features Ecosystem

Dev Container Features are reusable, shareable units of installation logic:

```json
{
  "features": {
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/terraform:1": {
      "version": "1.9"
    },
    "ghcr.io/devcontainers/features/go:1": {
      "version": "1.22"
    }
  }
}
```

No Dockerfile needed for common tools. Features handle installation and configuration.

## Onboarding Impact

| Without Dev Containers | With Dev Containers |
|----------------------|-------------------|
| README with 30 install steps | Open repo, wait 2 minutes |
| "Install Homebrew, then..." | Works on any OS |
| "My version is different" | Pinned versions for everyone |
| Debug setup for 2 days | Debug code on day 1 |

The ROI is immediate for any team larger than two people.

---

Ready to go deeper? Master Docker and development workflows with hands-on courses at [CopyPasteLearn](/courses/docker-fundamentals).
