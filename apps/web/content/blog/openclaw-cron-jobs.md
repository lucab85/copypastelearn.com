---
title: "OpenClaw Cron Jobs: Scheduled AI Tasks"
description: "Schedule recurring tasks with OpenClaw cron — from daily summaries to weekly reports. Complete setup guide with practical examples."
date: "2026-02-11"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Cron", "Automation"]
---

## What Are OpenClaw Cron Jobs?

Cron jobs let your agent execute tasks on a precise schedule. Unlike heartbeats (approximate timing, batched checks), cron jobs run at exact times with isolated sessions.

## When to Use Cron vs Heartbeats

| | Cron | Heartbeats |
|---|---|---|
| **Timing** | Exact (9:00 AM sharp) | Approximate (~30 min) |
| **Session** | Isolated | Main session |
| **Best for** | Scheduled reports | Periodic monitoring |
| **Model** | Can differ | Uses main model |
| **Context** | No chat history | Has recent history |

## Creating Cron Jobs

### Daily Morning Briefing

```bash
openclaw cron add \
  --schedule "0 8 * * *" \
  --task "Send me a morning briefing: weather, calendar for today, any urgent emails" \
  --channel discord
```

### Weekly Report

```bash
openclaw cron add \
  --schedule "0 17 * * 5" \
  --task "Generate a weekly summary of what we worked on this week based on memory files"
```

### Hourly Uptime Check

```bash
openclaw cron add \
  --schedule "0 * * * *" \
  --task "Check if copypastelearn.com is responding. Only alert if it's down." \
  --model "gpt-4o-mini"
```

## Managing Cron Jobs

```bash
# List all cron jobs
openclaw cron list

# Remove a cron job
openclaw cron remove <job-id>

# Pause a cron job
openclaw cron pause <job-id>
```

## Practical Examples

### Daily Git Summary

```
Schedule: Every day at 6 PM
Task: "Check git log for today's commits across all repos. Summarize what was done."
```

### SSL Certificate Monitor

```
Schedule: Every Monday at 9 AM
Task: "Check SSL certificate expiry for all network sites. Alert if any expire within 30 days."
```

### Content Reminder

```
Schedule: Every Wednesday at 10 AM
Task: "Remind me to publish this week's blog post on CopyPasteLearn."
```

### Database Backup Verification

```
Schedule: Daily at 2 AM
Task: "Verify the database backup completed successfully. Check file size and timestamp."
```

## Cost Optimization

Each cron job spawns a session and uses LLM tokens. To minimize costs:

1. **Use cheaper models** for simple checks (`gpt-4o-mini`)
2. **Be concise** in task descriptions
3. **Set appropriate intervals** — don't check every minute if hourly is fine
4. **Combine related checks** into single cron jobs
5. **Use conditional alerts** — "only message me if something is wrong"

## Best Practices

- Test cron jobs manually before scheduling
- Start with longer intervals and tighten as needed
- Include the delivery channel in the job configuration
- Log cron results to daily memory files for audit trails

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

