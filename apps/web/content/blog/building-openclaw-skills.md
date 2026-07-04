---
title: "Building Custom OpenClaw Skills"
description: "Learn how to create, package, and share custom skills for OpenClaw agents. From simple automations to complex integrations."
date: "2026-02-22"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Skills", "Tutorial"]
---

A general-purpose OpenClaw agent doesn't know that your team restarts the payments worker with a specific drain-then-restart sequence, or which three metrics your on-call runbook checks before touching a stuck queue. Paste that context into every session and you're re-explaining it indefinitely, and any session where you forget gets improvised behavior instead of your actual process. Skills turn a one-off explanation into a reusable, reviewable procedure the agent loads on demand. This post covers authoring one from scratch — not what OpenClaw is in general.

## Prerequisites

You need OpenClaw already installed and running before anything below applies. This walkthrough assumes a working session where the agent responds to prompts — it doesn't cover installation or initial setup. If you haven't gotten that far yet, do that first.

## How Skills Work

A skill is not a plugin or a compiled binary. It's a scoped bundle of instructions and supporting files that the agent reads only when it decides the skill is relevant to the request in front of it — at minimum a SKILL.md file describing when and how to use it, optionally backed by scripts, reference docs, or assets it reaches for as those instructions call for them. That's a real mechanical difference from pasting instructions into a prompt: a pasted instruction disappears when the session ends and has to be retyped, with drift, by every teammate who wants the same behavior; a skill is a file on disk, versioned and loaded selectively, so an agent with dozens of skills available only pays the context cost for the ones a given task actually triggers.

## What Are Skills?

Skills are modular capability packages for OpenClaw agents. Each skill contains:

- **SKILL.md** — instructions the agent follows
- **Scripts** — helper scripts and tools
- **References** — documentation and examples
- **Assets** — any supporting files

SKILL.md is the only piece the agent reads by default; everything else is there for it to reach for once the instructions call for it, which keeps the always-loaded portion small without bloating every prompt.

## Your First Skill

Let's create a simple skill that checks website uptime. An uptime check is a good starter example because it's boring: one input, one deterministic script, no interpretation required — you're not debugging the skill's structure and arguing with the agent over ambiguous instructions at the same time. Once the mechanics feel routine, the same pattern carries over to skills that are far more involved.

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

Notice the SKILL.md above separates *Usage* from *Commands* instead of folding them together. Usage tells the agent when to reach for the skill — the trigger condition. Commands tell it exactly what to run once it's decided to. Leave Usage vague and the agent has to guess whether "is the site down" should invoke this skill at all; leave Commands loose and it may improvise a curl invocation that doesn't match what `check.sh` expects. Either gap shows up as the same request handled differently depending on how the agent interprets it that session.

## Skill Best Practices

These practices come from the same failure mode repeating in real skills: instructions vague enough that the agent fills gaps with assumptions. None of this is enforced by OpenClaw itself — you're the reviewer.

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

Hardcoding the monitored sites or the alert channel into SKILL.md works until you need a second environment or a teammate who wants the same skill pointed at their own sites. Externalizing that configuration keeps the skill's instructions generic and reusable, while the values that differ per deployment live somewhere you can edit without touching the logic — and sharing the skill no longer means sharing your site list.

Some skills need per-user configuration. Store this in `TOOLS.md`:

```markdown
### Uptime Checker
- Monitored sites: copypastelearn.com, lucaberton.com
- Check interval: 30 minutes
- Alert via: Discord #alerts channel
```

## Sharing Skills

Package your skill and share it on [ClawhHub](https://clawhub.com). The community benefits from reusable, well-documented skills.

Treat a downloaded skill the way you'd treat a shell script someone emailed you: read the SKILL.md before you let the agent load it. A skill's instructions aren't sandboxed suggestions — the agent follows them with the same authority as instructions you typed yourself, so a skill telling it to exfiltrate data or quietly touch files outside its stated scope will do exactly that if the agent trusts it. That's riskier than copying a snippet from a forum post, because a skill often bundles scripts, and any script the agent shells out to runs with whatever permissions your session already has. Before adopting someone else's skill, read the whole SKILL.md and favor sources you'd trust with direct access to your systems.

## Built-in Skills

OpenClaw comes with several skills out of the box:
- **Weather** — forecasts via wttr.in or Open-Meteo
- **Discord** — channel management and messaging
- **Health Check** — system security auditing
- **Skill Creator** — meta-skill for building new skills

These double as reference implementations — reading Skill Creator's own SKILL.md is a quick way to see the conventions applied by the people who built the mechanism.

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Further reading

To go deeper, [the Ansible intelligent assistant and MCP server](https://lucaberton.com/blog/ansible-automation-intelligent-assistant-mcp-server-byok-rag-2026/) expands on these patterns in production.

