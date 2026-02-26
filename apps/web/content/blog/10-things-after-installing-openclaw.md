---
title: "10 Things to Do After Installing OpenClaw"
description: "Just installed OpenClaw? Here are 10 essential setup steps to get the most out of your AI agent — from personality to automation."
date: "2026-02-09"
author: "Luca Berton"
tags: ["OpenClaw", "Getting Started", "Tips"]
---

## 1. Define Your Agent's Personality

Edit `SOUL.md` to set the tone. Are you looking for a professional assistant or a casual companion?

```markdown
## Vibe
Direct and technical. Skip the fluff.
Use code examples freely. Be opinionated
about best practices.
```

## 2. Fill In USER.md

Help your agent help you:

```markdown
- Name: Luca
- Timezone: CET (UTC+1)
- Prefers: Concise responses, code-first
- Projects: CopyPasteLearn, Ansible Pilot
```

## 3. Connect a Messaging Channel

Pick your favorite platform:

```bash
# Discord
openclaw config set discord.token YOUR_TOKEN

# Telegram
openclaw config set telegram.token YOUR_TOKEN
```

## 4. Install Essential Skills

Browse [ClawhHub](https://clawhub.com) for skills:

- **Weather** — instant forecasts
- **Health Check** — system security auditing
- **Discord** — advanced Discord management

## 5. Set Up Heartbeats

Configure `HEARTBEAT.md` for proactive monitoring:

```markdown
## Checks
- Email inbox for urgent messages
- Calendar for upcoming events
- Website uptime for my domains
```

## 6. Create Your First Cron Job

Schedule a daily briefing:

```bash
openclaw cron add \
  --schedule "0 8 * * *" \
  --task "Morning briefing: weather, calendar, emails"
```

## 7. Pair Your Phone

Install the companion app and pair your device for:
- Camera access
- Push notifications
- Location services

## 8. Set Up Memory

Create your first memory entry:

```bash
mkdir -p ~/agent/memory
echo "# $(date +%Y-%m-%d)" > ~/agent/memory/$(date +%Y-%m-%d).md
```

Your agent will take it from there.

## 9. Configure Safety Boundaries

Review `AGENTS.md` and customize:
- What the agent can do freely
- What requires permission
- External action rules

## 10. Run as a Service

Don't leave it in a terminal — make it a system service:

```bash
sudo systemctl enable --now openclaw
```

Now your agent survives reboots and runs 24/7.

## Bonus: Make It Yours

The best OpenClaw agents are personalized. Over the next few weeks:
- Let your agent learn your preferences
- Review and refine SOUL.md
- Check MEMORY.md for accuracy
- Add project-specific context

Your agent gets better the more you use it.
