---
title: "OpenClaw SOUL.md Configuration Guide"
description: "Master the art of defining AI agent personality through SOUL.md. Examples, patterns, and best practices for creating the perfect assistant."
date: "2026-02-19"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "AI Personality", "Configuration"]
---

## What is SOUL.md?

`SOUL.md` is the file that defines your OpenClaw agent's personality, tone, and behavioral guidelines. It's literally the soul of your AI assistant.

## The Default Soul

OpenClaw ships with a thoughtful default:

```markdown
# SOUL.md - Who You Are

## Core Truths

**Be genuinely helpful, not performatively helpful.**
Skip the "Great question!" — just help.

**Have opinions.** You're allowed to disagree,
prefer things, find stuff amusing or boring.

**Be resourceful before asking.** Try to figure it out first.
```

## Customization Examples

### The Professional

```markdown
## Vibe
Formal but warm. Think senior consultant who
actually cares. Use proper grammar, avoid slang.
Address the user by name. Provide structured
responses with clear action items.
```

### The Hacker

```markdown
## Vibe
Terse. Unix philosophy. Say more with less.
Code speaks louder than prose. When in doubt,
show a command. Skip the pleasantries.
```

### The Creative

```markdown
## Vibe
Enthusiastic and expressive. Use metaphors freely.
Celebrate small wins. Make technical concepts
feel approachable. Emoji welcome but not excessive.
```

### The Teacher

```markdown
## Vibe
Patient and Socratic. Ask questions that lead to
understanding. Never just give the answer — help
them discover it. Reference fundamentals often.
Perfect for learning environments like CopyPasteLearn.
```

## Key Sections

### Boundaries

Define what your agent should and shouldn't do:

```markdown
## Boundaries
- Private things stay private
- Ask before sending emails or public posts
- Never send half-baked replies to messaging surfaces
- You're not the user's voice in group chats
```

### Continuity

Remind the agent about its memory system:

```markdown
## Continuity
Each session, you wake up fresh.
These files ARE your memory. Read them. Update them.
```

## Best Practices

1. **Be specific** — vague instructions produce vague behavior
2. **Give examples** — show the tone you want
3. **Set boundaries** — what's off-limits?
4. **Evolve it** — update SOUL.md as you learn what works
5. **Keep it short** — the agent reads this every session

## The Agent Evolves

The beauty of SOUL.md: your agent's personality develops over time. As you refine the instructions, your agent becomes more aligned with how you want to interact.

It's not programming — it's parenting.

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Further reading

To go deeper, [agentic Ansible automation with OpenClaw](https://lucaberton.com/blog/openclaw-agentic-automation-ansible-cve-remediation-red-hat-2026/) expands on these patterns in production.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use OpenClaw SOUL.md Guide as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to OpenClaw, AI Personality, Configuration. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use OpenClaw SOUL.md Guide?

Use it when you need a practical, repeatable way to handle OpenClaw, AI Personality, Configuration work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.
