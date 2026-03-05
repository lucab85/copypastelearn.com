---
title: "OpenClaw Architecture Deep Dive"
description: "Deep dive into OpenClaw's architecture — the gateway, sessions, tool system, memory layer, and channel providers that make it tick."
date: "2026-02-15"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Architecture", "Technical"]
---

## High-Level Architecture

OpenClaw has four main components:

```
Channels (Discord, Telegram, etc.)
    ↕
  Gateway (message routing)
    ↕
  Sessions (conversation state)
    ↕
  Tools (actions: files, web, exec)
```

## The Gateway

The gateway is the central daemon. It:
- Manages connections to messaging platforms
- Routes inbound messages to the right session
- Handles heartbeats and cron jobs
- Serves the web interface

```bash
openclaw gateway start   # Start
openclaw gateway stop    # Stop
openclaw gateway status  # Check health
```

## Sessions

Each conversation lives in a session:

- **Main session** — direct chat with the user
- **Sub-agent sessions** — spawned for isolated tasks
- **Channel sessions** — per-channel in group chats

Sessions maintain their own message history and can spawn child sessions for parallel work.

## The Tool System

OpenClaw provides tools that the LLM can invoke:

### File Operations
- `read` — read file contents (text and images)
- `write` — create or overwrite files
- `edit` — surgical find-and-replace edits

### System
- `exec` — execute shell commands
- `process` — manage background processes

### Web
- `web_search` — search via Brave API
- `web_fetch` — fetch and extract page content
- `browser` — full browser automation

### Communication
- `message` — send messages across channels
- `tts` — text-to-speech
- `nodes` — control paired devices

### Agent Orchestration
- `sessions_spawn` — create sub-agents
- `sessions_send` — cross-session messaging
- `subagents` — manage running sub-agents

## Memory Layer

Memory is file-based, stored in the workspace:

```
workspace/
├── SOUL.md           # Agent personality
├── USER.md           # User profile
├── AGENTS.md         # Operating rules
├── MEMORY.md         # Long-term memory
├── HEARTBEAT.md      # Periodic check config
└── memory/
    ├── 2026-02-15.md # Daily notes
    └── heartbeat-state.json
```

## Channel Providers

Each messaging platform has a provider that:
- Authenticates with the platform API
- Receives and sends messages
- Handles platform-specific features (reactions, threads, media)

Supported: Discord, Telegram, WhatsApp, Signal, Slack, IRC, Google Chat, iMessage.

## Skills System

Skills extend agent capabilities:

```
skills/
├── weather/
│   └── SKILL.md
├── discord/
│   └── SKILL.md
└── healthcheck/
    └── SKILL.md
```

The agent reads `SKILL.md` when a task matches the skill's description.

## Request Flow

1. User sends message on Discord
2. Discord provider receives it
3. Gateway routes to the correct session
4. Session adds message to context
5. LLM generates response (may invoke tools)
6. Tools execute and return results
7. LLM formulates final response
8. Response sent back via Discord provider
