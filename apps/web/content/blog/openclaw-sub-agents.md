---
title: "OpenClaw Sub-Agents"
description: "Learn how to use OpenClaw sub-agents for parallel task execution — spawning, managing, and orchestrating multiple AI workers."
date: "2026-02-14"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Sub-Agents", "Orchestration"]
---

## What Are Sub-Agents?

Sub-agents are isolated AI sessions spawned by your main agent to handle tasks in parallel. Think of them as workers your agent delegates to.

## Why Sub-Agents?

- **Parallelism** — do multiple things simultaneously
- **Isolation** — each sub-agent has its own context
- **Different models** — use a cheaper model for simple tasks
- **Long-running tasks** — don't block the main conversation

## Spawning Sub-Agents

Your agent uses the `sessions_spawn` tool:

```
sessions_spawn(
  task: "Research the top 5 Kubernetes alternatives and summarize each",
  mode: "run"  // One-shot task
)
```

### Run Mode vs Session Mode

- **`run`** — complete the task and return results (one-shot)
- **`session`** — persistent session for ongoing interaction

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

## Cost Considerations

Each sub-agent session uses LLM tokens. For cost efficiency:
- Use cheaper models for simple tasks (`model: "gpt-4o-mini"`)
- Keep task descriptions concise
- Set `cleanup: "delete"` to clean up after completion
