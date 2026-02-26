---
title: "Building Custom OpenClaw Skills: A Complete Guide"
description: "Learn how to create, package, and share custom skills for OpenClaw agents. From simple automations to complex integrations."
date: "2026-02-22"
author: "Luca Berton"
tags: ["OpenClaw", "Skills", "Tutorial"]
---

## What Are Skills?

Skills are modular capability packages for OpenClaw agents. Each skill contains:

- **SKILL.md** — instructions the agent follows
- **Scripts** — helper scripts and tools
- **References** — documentation and examples
- **Assets** — any supporting files

## Your First Skill

Let's create a simple skill that checks website uptime.

### Directory Structure

```
skills/
  uptime-checker/
    SKILL.md
    check.sh
```

### SKILL.md

```markdown
# Uptime Checker

Check if a website is responding.

## Usage

When the user asks to check a website's status, use the `check.sh`
script in this skill's directory.

## Commands

- `bash check.sh <url>` — Returns HTTP status code and response time
```

### check.sh

```bash
#!/bin/bash
URL="${1:?Usage: check.sh <url>}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL")
TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$URL")
echo "Status: $STATUS | Response time: ${TIME}s | URL: $URL"
```

## Skill Best Practices

### Keep Instructions Clear

Your SKILL.md is what the agent reads. Be explicit about:
- When to use the skill
- What commands are available
- Expected inputs and outputs
- Error handling

### Use Relative Paths

Skills reference files relative to the skill directory. The agent resolves these automatically.

### Make Skills Self-Contained

A good skill works without external dependencies. If it needs something, document it in the prerequisites section.

## Advanced: Skills with Configuration

Some skills need per-user configuration. Store this in `TOOLS.md`:

```markdown
### Uptime Checker
- Monitored sites: copypastelearn.com, lucaberton.com
- Check interval: 30 minutes
- Alert via: Discord #alerts channel
```

## Sharing Skills

Package your skill and share it on [ClawhHub](https://clawhub.com). The community benefits from reusable, well-documented skills.

## Built-in Skills

OpenClaw comes with several skills out of the box:
- **Weather** — forecasts via wttr.in or Open-Meteo
- **Discord** — channel management and messaging
- **Health Check** — system security auditing
- **Skill Creator** — meta-skill for building new skills
