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

