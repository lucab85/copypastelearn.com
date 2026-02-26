---
title: "Understanding OpenClaw's Memory System"
description: "Learn how OpenClaw agents maintain memory across sessions using file-based persistence — daily notes, MEMORY.md, and workspace context."
date: "2026-02-23"
author: "Luca Berton"
tags: ["OpenClaw", "AI Memory", "Architecture"]
---

## The Memory Problem

Most AI assistants forget everything between conversations. You start fresh every time, re-explaining context and preferences. OpenClaw solves this with **file-based memory**.

## How It Works

### Daily Notes

Each day, your agent can write observations to `memory/YYYY-MM-DD.md`:

```markdown
# 2026-02-23

## Work Done
- Helped user set up Docker containers for the staging environment
- Fixed nginx config — port 8080 was conflicting with the lab service

## Learned
- User prefers Caddy over nginx for reverse proxy
- Project deadline is March 15th
```

### Long-Term Memory (MEMORY.md)

`MEMORY.md` is the agent's curated long-term memory — distilled insights, not raw logs:

```markdown
# MEMORY.md

## User Preferences
- Prefers Caddy for reverse proxy
- Uses VS Code with vim keybindings
- Timezone: CET (UTC+1)

## Active Projects
- CopyPasteLearn platform (Next.js, Vercel)
- Home lab on Oracle Cloud (ARM instances)
```

### Workspace Context

Files like `SOUL.md`, `USER.md`, and `AGENTS.md` are loaded every session, giving the agent immediate context about who it is and who it's helping.

## The Memory Lifecycle

1. **Session starts** → Agent reads SOUL.md, USER.md, recent daily notes
2. **During session** → Agent writes observations to today's daily note
3. **Heartbeats** → Agent periodically reviews daily notes and updates MEMORY.md
4. **Next session** → Agent has full context from files

## Memory Maintenance

During heartbeat intervals, the agent:
- Reviews recent daily files
- Identifies patterns and important information
- Updates MEMORY.md with distilled learnings
- Removes outdated information

Think of it like a human reviewing their journal and updating their mental model.

## Privacy by Design

Since memory is file-based:
- You can read everything your agent remembers
- You can edit or delete any memory
- Memory never leaves your infrastructure
- No cloud storage, no third-party access

## Best Practices

1. **Let the agent write freely** — more notes = better continuity
2. **Review MEMORY.md occasionally** — ensure accuracy
3. **Use daily notes for raw context** — keep MEMORY.md curated
4. **Don't store secrets** — use environment variables instead
