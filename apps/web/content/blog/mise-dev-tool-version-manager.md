---
title: "Mise Dev Tool Version Manager"
date: "2026-03-22"
description: "Mise (formerly rtx) manages tool versions per project. Replace nvm, pyenv, rbenv, and tfenv with one tool. Learn how to set up mise for polyglot development environments."
category: "Development"
tags: ["mise", "version-manager", "developer-tools", "nvm", "pyenv", "development-environment"]
author: "Luca Berton"
---

Every language has its own version manager: nvm for Node.js, pyenv for Python, rbenv for Ruby, tfenv for Terraform. Mise replaces all of them with a single tool.

## Why Mise

```bash
# Before: install and configure 5 tools
brew install nvm pyenv rbenv tfenv goenv
# Configure each in .bashrc/.zshrc
# Each has different syntax and behavior

# After: one tool
brew install mise
```

Mise reads a `.mise.toml` file in your project and installs the correct versions of every tool:

```toml
# .mise.toml
[tools]
node = "20.11"
python = "3.12"
terraform = "1.9"
go = "1.22"
kubectl = "1.30"
```

```bash
cd my-project
mise install
# All tools installed at the specified versions
```

## How It Works

```bash
# Install mise
curl https://mise.run | sh

# Add to shell
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc

# Install tools for current directory
mise install

# Check active versions
mise ls
```

Mise uses shims or PATH manipulation to ensure the correct version is active when you enter a project directory. Leave the directory and your global versions take over.

## Per-Project Configuration

```toml
# project-a/.mise.toml
[tools]
node = "20"
python = "3.12"

[env]
DATABASE_URL = "postgres://localhost/projecta"
```

```toml
# project-b/.mise.toml
[tools]
node = "18"
python = "3.11"

[env]
DATABASE_URL = "postgres://localhost/projectb"
```

Switch between projects and tool versions change automatically. No `nvm use` or `pyenv local` commands.

## Task Runner

Mise also replaces Makefiles for project tasks:

```toml
# .mise.toml
[tasks.dev]
run = "npm run dev"
description = "Start development server"

[tasks.test]
run = "npm test"
description = "Run tests"

[tasks.lint]
run = ["eslint .", "prettier --check ."]
description = "Lint and format check"

[tasks.db-migrate]
run = "npx prisma migrate dev"
description = "Run database migrations"
env = { DATABASE_URL = "postgres://localhost/myapp" }
```

```bash
mise run dev
mise run test
mise run lint
```

## Environment Variables

```toml
[env]
NODE_ENV = "development"
API_URL = "http://localhost:3000"

# Load from .env file
[env]
_.file = ".env"

# Different values per environment
[env.production]
NODE_ENV = "production"
API_URL = "https://api.myapp.com"
```

## Compatibility

Mise reads existing configuration files:

| File | Tool |
|------|------|
| `.node-version` | nvm, fnm |
| `.python-version` | pyenv |
| `.ruby-version` | rbenv |
| `.tool-versions` | asdf |
| `.nvmrc` | nvm |

Drop mise into an existing project and it respects the version files already there.

## asdf Plugin Ecosystem

Mise uses asdf's plugin ecosystem — over 700 tools available:

```bash
# Any asdf plugin works with mise
mise use erlang@26
mise use elixir@1.16
mise use java@21
mise use rust@1.76
mise use helm@3.14
mise use awscli@2
```

## Team Setup

Add `.mise.toml` to your repo. New team members:

```bash
# One-time: install mise
curl https://mise.run | sh

# Per project: install all tools
cd project
mise install

# Done. Every tool at the right version.
```

Compare to the typical README:

> 1. Install nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
> 2. Run `nvm install` 
> 3. Install pyenv: `brew install pyenv`
> 4. Run `pyenv install 3.12.1`
> 5. Install tfenv: `brew install tfenv`
> 6. Run `tfenv install 1.9.0`

Six steps become two.

---

Ready to go deeper? Streamline your development workflow with hands-on courses at [CopyPasteLearn](/courses).
