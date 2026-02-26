---
title: "OpenClaw Heartbeats: Making Your AI Agent Proactive"
description: "Learn how to configure OpenClaw heartbeats for proactive monitoring — email checks, calendar alerts, weather updates, and more."
date: "2026-02-18"
author: "Luca Berton"
tags: ["OpenClaw", "Automation", "Heartbeats"]
---

## What Are Heartbeats?

Heartbeats are periodic check-ins where your OpenClaw agent wakes up and does useful background work — even when you haven't asked it anything.

## How They Work

At configured intervals, OpenClaw sends a heartbeat prompt to your agent. The agent reads `HEARTBEAT.md` and decides what to do:

- **Something needs attention?** → Send you a message
- **Nothing new?** → Reply `HEARTBEAT_OK` and go back to sleep

## Configuring HEARTBEAT.md

```markdown
# HEARTBEAT.md

## Checks (rotate through these)
- [ ] Check email for urgent messages
- [ ] Review calendar for upcoming events (next 24h)
- [ ] Check website uptime for copypastelearn.com
- [ ] Weather forecast if rain expected

## Rules
- Only alert for genuinely important things
- Quiet hours: 23:00 - 08:00 (don't disturb)
- If nothing important, reply HEARTBEAT_OK
```

## Heartbeats vs Cron

OpenClaw also supports cron jobs. When to use each:

| Feature | Heartbeats | Cron |
|---------|-----------|------|
| Timing | Approximate (every ~30min) | Exact (9:00 AM sharp) |
| Context | Has recent chat history | Isolated session |
| Batching | Multiple checks per beat | One task per job |
| Model | Uses main session model | Can use different model |

**Rule of thumb:** Use heartbeats for batched periodic checks, cron for precise schedules.

## Tracking State

Use `memory/heartbeat-state.json` to avoid redundant checks:

```json
{
  "lastChecks": {
    "email": 1703275200,
    "calendar": 1703260800,
    "weather": null
  }
}
```

The agent checks timestamps and skips recently-completed tasks.

## Practical Examples

### Email Monitor

```markdown
## Email Check
- Look for unread emails from VIP senders
- Summarize anything marked urgent
- Skip newsletters and marketing
```

### Calendar Alert

```markdown
## Calendar
- Alert 2 hours before any meeting
- Include video call links if available
- Mention if preparation is needed
```

### Infrastructure Monitor

```markdown
## Infra
- Ping copypastelearn.com
- Check SSL certificate expiry
- Alert if any service is down
```

## Best Practices

1. **Keep HEARTBEAT.md small** — it's read every interval, burning tokens
2. **Rotate checks** — don't run everything every heartbeat
3. **Respect quiet hours** — nobody wants 3 AM alerts
4. **Track state** — avoid redundant API calls
5. **Be selective** — only alert on genuinely important things
