---
title: "What is OpenClaw?"
description: "Discover OpenClaw — the open-source platform that lets you run AI agents on your own infrastructure. Learn what it does, how it works, and why it matters."
date: "2026-02-26"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "AI Agents", "Open Source"]
---

## What is OpenClaw?

OpenClaw is an open-source AI agent platform that runs on your own infrastructure. Unlike cloud-only AI assistants, OpenClaw gives you full control over your AI agents — where they run, what they access, and how they behave.

Think of it as your personal AI assistant framework: it connects to messaging platforms (Discord, Telegram, WhatsApp, Signal), executes tasks, browses the web, manages files, and remembers context across conversations.

## Why OpenClaw?

### You Own Everything

Your data stays on your machine. Your conversations, memories, and workflows never leave your infrastructure unless you explicitly allow it.

### Extensible by Design

OpenClaw uses a **skills system** — modular packages that teach your agent new capabilities. Need weather updates? Install the weather skill. Want Discord management? There's a skill for that.

### Multi-Channel

One agent, many surfaces. Your OpenClaw agent can respond on Discord, Telegram, WhatsApp, Signal, Slack, and more — all from a single instance.

## Core Concepts

### The Agent

Your agent is defined by a set of files in its workspace:

- **SOUL.md** — personality and behavior guidelines
- **USER.md** — information about the person it helps
- **MEMORY.md** — long-term curated memories
- **AGENTS.md** — operating conventions and rules

### Skills

Skills are packaged capabilities with their own `SKILL.md` instructions, scripts, and references. They're shareable on [ClawhHub](https://clawhub.com).

### Memory

OpenClaw agents maintain continuity through file-based memory. Daily notes capture what happened, while `MEMORY.md` stores distilled long-term knowledge.

## Getting Started

```bash
# Install OpenClaw
npm install -g openclaw

# Initialize a new agent
openclaw init

# Start the gateway
openclaw gateway start
```

Visit the [OpenClaw docs](https://docs.openclaw.ai) for the full setup guide.

## Who Is OpenClaw For?

- **Developers** who want AI assistance integrated into their workflow
- **Teams** that need a shared AI agent with institutional knowledge
- **Privacy-conscious users** who want AI without cloud dependency
- **Tinkerers** who love building and customizing

OpenClaw is open source and available on [GitHub](https://github.com/openclaw/openclaw).
