---
title: "10 Things to Do After Installing OpenClaw"
description: "Just installed OpenClaw? Here are 10 essential setup steps to get the most out of your AI agent — from personality to automation."
date: "2026-02-09"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Getting Started", "Tips"]
---

The order below isn't arbitrary. Personality and `USER.md` come first because every message your agent sends afterward — over a messaging channel, in a cron job, through a heartbeat check — gets colored by whatever context and voice you've set at that point, and getting it right early saves you from re-explaining yourself in every conversation for the next month. Safety boundaries land near the end of this list only because you're still configuring the agent up to that point, not because they're less important: treat step 9 as a checkpoint you revisit before you leave any of the automation from steps 3-7 running unattended overnight.

## 1. Define Your Agent's Personality

Edit `SOUL.md` to set the tone. Are you looking for a professional assistant or a casual companion?

```markdown
## Vibe
Direct and technical. Skip the fluff.
Use code examples freely. Be opinionated
about best practices.
```

This isn't cosmetic. The vibe you set here colors every reply your agent gives before you've configured anything else — skip it, and you get a generic, hedging assistant voice that doesn't match how you actually want to work. It's also harder to unlearn a bad first impression than to just set the tone correctly from the start, so do this before you connect any channel that other people might see.

## 2. Fill In USER.md

Help your agent help you:

```markdown
- Name: Luca
- Timezone: CET (UTC+1)
- Prefers: Concise responses, code-first
- Projects: CopyPasteLearn, Ansible Pilot
```

Skip this step and your agent falls back to guessing — assuming the wrong timezone for a scheduled task, misreading which project you mean when you say "the site," or defaulting to a response style you never asked for. Fill it in before you wire up any messaging channel or cron job, so every automated message that goes out already knows who it's talking to instead of finding out by trial and error.

## 3. Connect a Messaging Channel

Pick your favorite platform:

```bash
# Discord
openclaw config set discord.token YOUR_TOKEN

# Telegram
openclaw config set telegram.token YOUR_TOKEN
```

Connect a channel only after personality and `USER.md` are set — otherwise the first message your agent sends lands in whatever default voice ships out of the box, not the one you just configured. Start with one platform. Wiring up Discord and Telegram simultaneously before you've tested either just doubles the number of places you have to debug when a notification doesn't show up.

## 4. Install Essential Skills

Browse [ClawhHub](https://clawhub.com) for skills:

- **Weather** — instant forecasts
- **Health Check** — system security auditing
- **Discord** — advanced Discord management

Skills are what turn a chat window into something that actually does work — a health check skill is the difference between your agent noticing a filling disk and staying silent until the box falls over. Don't install everything from ClawhHub at once, though: each additional skill is another set of permissions and another thing that can misfire during a heartbeat or cron run you're not actively watching.

## 5. Set Up Heartbeats

Configure `HEARTBEAT.md` for proactive monitoring:

```markdown
## Checks
- Email inbox for urgent messages
- Calendar for upcoming events
- Website uptime for my domains
```

Heartbeats are what make the agent proactive instead of purely reactive. Without them, it only ever answers what you directly ask and never surfaces the email, calendar conflict, or outage you didn't think to ask about. Keep the check list short at first — a heartbeat with too many checks either runs too slowly or starts generating noisy alerts you'll learn to tune out, which defeats the point.

## 6. Create Your First Cron Job

Schedule a daily briefing:

```bash
openclaw cron add \
  --schedule "0 8 * * *" \
  --task "Morning briefing: weather, calendar, emails"
```

Cron is where automation actually costs you if it's wrong. A vague task description scheduled to run unattended at 8am every day means you won't notice a problem until it's already happened while you were asleep. Run the task manually once before you schedule it, so you know exactly what the output looks like the first time it fires on its own.

## 7. Pair Your Phone

Install the companion app and pair your device for:
- Camera access
- Push notifications
- Location services

Phone pairing is worth doing early because push notifications close the loop — without it, everything your heartbeats and cron jobs produce only lands in a messaging channel, and you have to be actively looking at it to notice anything happened. Camera and location access are the most invasive permissions in this whole checklist, though, so only grant them once you're confident they match the boundaries you'll set in step 9.

## 8. Set Up Memory

Create your first memory entry:

```bash
mkdir -p ~/agent/memory
echo "# $(date +%Y-%m-%d)" > ~/agent/memory/$(date +%Y-%m-%d).md
```

Your agent will take it from there.

Memory is what separates a stateless chatbot from something that actually remembers your project history across sessions. Skip this step and every conversation restarts from zero, even the ones a day apart. Seed it now, before cron and heartbeats start writing their own entries, so you can still tell your own notes apart from what the agent generated on its own.

## 9. Configure Safety Boundaries

Review `AGENTS.md` and customize:
- What the agent can do freely
- What requires permission
- External action rules

This is the step people skip, and it's the one that matters most. `AGENTS.md` is what stops your agent from taking an external action — sending a message, running a destructive command, changing a config — that you never actually authorized. If you've already wired up cron, heartbeats, and phone notifications by the time you reach this step, treat it as a hard stop: lock down the boundaries before you let any of that automation run unattended again, not after.

## 10. Run as a Service

Don't leave it in a terminal — make it a system service:

```bash
sudo systemctl enable --now openclaw
```

Now your agent survives reboots and runs 24/7.

Running in a terminal session means the agent dies the moment you close your laptop or the SSH connection drops — every cron job and heartbeat check you configured above silently stops firing until you notice and restart it by hand. A system service is what turns "usually running" into "actually running," which matters a lot once other automation, or other people, start depending on it staying alive.

## Bonus: Make It Yours

The best OpenClaw agents are personalized. Over the next few weeks:
- Let your agent learn your preferences
- Review and refine SOUL.md
- Check MEMORY.md for accuracy
- Add project-specific context

Your agent gets better the more you use it.

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Related

For a production-focused walkthrough, see Luca Berton's guide on [agentic Ansible automation with OpenClaw](https://lucaberton.com/blog/openclaw-agentic-automation-ansible-cve-remediation-red-hat-2026/).

