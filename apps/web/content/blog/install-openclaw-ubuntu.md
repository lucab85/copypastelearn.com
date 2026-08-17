---
title: "How to Install OpenClaw on Ubuntu Server"
description: "Step-by-step guide to installing and configuring OpenClaw on Ubuntu. Get your self-hosted AI agent running in under 10 minutes."
date: "2026-02-24"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Ubuntu", "Installation"]
---

## Prerequisites

- Ubuntu 22.04+ (or any Debian-based distro)
- Node.js 20+ installed
- A supported LLM API key (OpenAI, Anthropic, etc.)

## Step 1: Install Node.js

If you don't have Node.js 20+:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify:

```bash
node --version  # Should be v20+ or v22+
```

## Step 2: Install OpenClaw

```bash
npm install -g openclaw
```

## Step 3: Initialize Your Agent

```bash
mkdir ~/my-agent && cd ~/my-agent
openclaw init
```

This creates the workspace structure:
- `SOUL.md` — agent personality
- `USER.md` — your profile
- `AGENTS.md` — operating rules
- `IDENTITY.md` — agent identity

## Step 4: Configure Your LLM

Set your API key:

```bash
export OPENAI_API_KEY="sk-..."
# or
export ANTHROPIC_API_KEY="sk-ant-..."
```

Add to `~/.bashrc` for persistence.

## Step 5: Start the Gateway

```bash
openclaw gateway start
```

Your agent is now running. Connect it to messaging platforms or use the web interface.

## Step 6: Connect Messaging (Optional)

### Discord

```bash
openclaw config set discord.token YOUR_BOT_TOKEN
```

### Telegram

```bash
openclaw config set telegram.token YOUR_BOT_TOKEN
```

## Running as a System Service

Create a systemd service for automatic startup:

```bash
sudo tee /etc/systemd/system/openclaw.service > /dev/null <<EOF
[Unit]
Description=OpenClaw AI Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/my-agent
ExecStart=$(which openclaw) gateway start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now openclaw
```

## Verify It Works

```bash
openclaw status
```

You should see your agent running with connected channels listed.

## Next Steps

- Customize `SOUL.md` with your agent's personality
- Install skills from [ClawhHub](https://clawhub.com)
- Set up [memory and heartbeats](/blog/openclaw-memory-system)

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Related guide

Related reading: [OpenClaw-driven CVE remediation with Ansible](https://lucaberton.com/blog/openclaw-agentic-automation-ansible-cve-remediation-red-hat-2026/) covers this in real-world detail.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use How to Install OpenClaw on Ubuntu Server as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to OpenClaw, Ubuntu, Installation. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use How to Install OpenClaw on Ubuntu Server?

Use it when you need a practical, repeatable way to handle OpenClaw, Ubuntu, Installation work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

