---
title: "OpenClaw Sub-Agents Guide"
description: "Learn how to use OpenClaw sub-agents for parallel task execution — spawning, managing, and orchestrating multiple AI workers."
date: "2026-02-14"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Sub-Agents", "Orchestration"]
---

A single OpenClaw agent has one context window, and that window fills up fast once a task has more than one moving part. Ask it to research five tools, review a diff, and draft a report in the same conversation, and by the third step it's dragging around the transcript of the first two — burning tokens on context it doesn't need and gradually losing track of the original ask. Worse, if the work is actually independent — scanning 10 log sources for errors, say — running it serially in one agent means step 9 waits on steps 1 through 8 for no reason at all. Sub-agents exist to fix both problems: each one gets a clean context and its own execution slot, so independent work can happen at the same time instead of queued up behind a single thread.

## Prerequisites

This guide assumes you already have OpenClaw installed and a primary agent running — if you haven't gotten that far yet, see [What Is OpenClaw](/blog/what-is-openclaw) or [10 Things to Do After Installing OpenClaw](/blog/10-things-after-installing-openclaw) first. Everything below builds on top of that running primary agent; it doesn't cover installation or initial setup.

## What Are Sub-Agents?

Sub-agents are isolated AI sessions spawned by your main agent to handle tasks in parallel. Think of them as workers your agent delegates to.

It's worth being precise about what "isolated" buys you, because on the surface a sub-agent can look like just another prompt to the same agent. It isn't. When you re-prompt your main agent, the new instruction gets appended to the existing conversation — it inherits every prior message, every tool result, every dead end from earlier in the session. A sub-agent starts with none of that. It only sees the task description you hand it, which means it can't get confused by unrelated context, but it also means it knows nothing you don't explicitly tell it. That trade-off is the whole point: isolation buys focus at the cost of shared memory. Combine that with parallelism — several sub-agents running at once instead of one agent working through a list — and specialization — routing a simple extraction task to a cheap model while your main agent keeps a more capable one — and you get three distinct reasons to spawn a sub-agent rather than just typing another message into the same chat.

## Why Sub-Agents?

- **Parallelism** — do multiple things simultaneously
- **Isolation** — each sub-agent has its own context
- **Different models** — use a cheaper model for simple tasks
- **Long-running tasks** — don't block the main conversation

Walk through a concrete case to see why this matters in practice. Say you're debugging an outage and need to check 10 different log sources — application logs, database logs, load balancer logs, and so on — for anything that looks like the root cause. Handed to a single agent, that's 10 sequential reads: open a log, scan it, summarize, move to the next, each pass carrying the accumulated summaries of everything before it. Handed to 10 sub-agents, each one opens exactly one log source, with no need to know anything about the other nine, and reports back independently. The main agent's job shrinks to comparing 10 short reports instead of grinding through 10 raw log files itself. The task hasn't gotten smaller, but the part that has to happen in order has — only the final comparison is serial.

## Spawning Sub-Agents

Your agent uses the `sessions_spawn` tool:

```
sessions_spawn(
  task: "Research the top 5 Kubernetes alternatives and summarize each",
  mode: "run"  // One-shot task
)
```

The `task` string is the entire briefing a sub-agent gets — there's no shared memory to fall back on, so vague instructions produce vague results far more often than they would with your main agent, which can at least infer intent from earlier context. Write the task the way you'd write a ticket for someone who wasn't in the meeting where you decided to do this.

It's also worth flagging the failure mode here before you hit it: nothing stops an agent from spawning sub-agents in a loop, or spawning one sub-agent that itself spawns more. Each one runs and bills independently, so an unbounded spawn pattern — a bug in a task description, a prompt that says "keep spawning agents until X" without a hard stop — can rack up cost and running sessions far faster than a single runaway agent would. Treat a cap on concurrent sub-agents as a default, not an afterthought, the same way you'd cap retries or timeouts on any other automated process.

### Run Mode vs Session Mode

- **`run`** — complete the task and return results (one-shot)
- **`session`** — persistent session for ongoing interaction

The difference isn't just cosmetic. A `run` sub-agent has a defined end: it executes the task, returns a result, and the session closes — good for anything you can fully describe up front, like "summarize this diff." A `session` sub-agent stays alive so you can send it follow-up instructions, which is the right shape for work that develops as it goes, like a long research task where you want to redirect it after seeing its first findings. Defaulting to `session` mode for tasks that don't need it just leaves more sessions open and billing longer than necessary.

## Real-World Examples

### Research Assistant

```
"Spawn a sub-agent to research OpenClaw competitors. 
I need: name, pricing, key features, and limitations 
for each. Return a comparison table."
```

### Code Review

```
"Spawn a sub-agent to review the PR diff I just pasted. 
Check for security issues, performance problems, and 
code style violations."
```

### Content Generation

```
"Spawn 3 sub-agents:
1. Write a blog post about Docker networking
2. Write a blog post about Docker volumes  
3. Write a blog post about Docker security
Return all three when done."
```

## Managing Sub-Agents

Spawning a sub-agent isn't a fire-and-forget action — you're responsible for what it does after it starts. A sub-agent that's drifted off task, gotten stuck in a retry loop, or turns out to have been given the wrong instructions is still consuming tokens and wall-clock time until something intervenes. That's what the management actions below are for: `list` so you know what's actually running before you lose track of it, `steer` so you can correct a sub-agent mid-task instead of killing and re-spawning it, and `kill` so a sub-agent that's gone wrong stops immediately rather than running to whatever timeout you set. If you spawned more than one or two sub-agents for a task, checking `list` before you walk away is the difference between catching a runaway session early and finding it an hour later.

### List Active Sub-Agents

```
subagents(action: "list")
```

### Steer a Running Sub-Agent

```
subagents(action: "steer", target: "session-123", 
  message: "Also include pricing information")
```

### Kill a Sub-Agent

```
subagents(action: "kill", target: "session-123")
```

## Best Practices

1. **Clear task descriptions** — sub-agents don't have your conversation context
2. **Set timeouts** — prevent runaway tasks
3. **Use run mode** for one-shot tasks — cleaner than persistent sessions
4. **Don't over-parallelize** — each sub-agent uses API tokens
5. **Review results** — sub-agents work independently, verify their output

Rule 4 deserves more weight than a one-line bullet suggests. It's tempting to split every multi-part task into as many sub-agents as it has parts, on the assumption that more parallelism is always better. It isn't, for two reasons. First, each sub-agent carries its own fixed overhead — spinning up a session and re-establishing whatever context it needs costs tokens before it does any useful work, so splitting a task that's only marginally parallelizable can cost more than it saves. Second, more concurrent sub-agents means more independent things that can go wrong at once, and rule 5 — reviewing results — gets harder to do properly as the number of reports coming back climbs. A cap of "spawn a sub-agent only when the sub-task is genuinely independent and substantial enough to be worth the overhead" covers most of what these five rules are getting at.

## Cost Considerations

Each sub-agent session uses LLM tokens. For cost efficiency:
- Use cheaper models for simple tasks (`model: "gpt-4o-mini"`)
- Keep task descriptions concise
- Set `cleanup: "delete"` to clean up after completion

The cost math is straightforward but easy to lose track of once you're several sub-agents deep: spawning N sub-agents doesn't just add N times the tokens of doing the work in one agent, it adds N times the fixed per-session overhead on top of that. A task that would cost X tokens run serially in one agent can end up costing noticeably more than X once it's split across sub-agents, even though each individual sub-agent's task is smaller. That's not an argument against sub-agents — it's an argument for spawning them for the right reason. The extra spend is worth it when the tasks are genuinely independent and the wall-clock savings matter more than the token cost, which is exactly the case in the 10-log-source example above: getting an answer in the time it takes to read one log instead of ten is worth paying the parallelism tax. It's not worth it when the "parallel" tasks actually depend on each other, when the sub-tasks are small enough that session overhead dominates, or when you're not actually waiting on the result in real time and serial execution would finish before anyone noticed the difference. Before spawning a batch of sub-agents, it's worth asking whether you're parallelizing because the task needs it or because it seemed like the more sophisticated option — and setting a cap on concurrent sub-agents, as noted earlier, keeps an honest answer to that question from mattering less over time as usage grows.

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Related guide

Related reading: [the Ansible intelligent assistant and MCP server](https://lucaberton.com/blog/ansible-automation-intelligent-assistant-mcp-server-byok-rag-2026/) covers this in real-world detail.
