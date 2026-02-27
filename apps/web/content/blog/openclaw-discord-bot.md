---
title: "Connect OpenClaw to Discord: Complete Bot Setup"
description: "Set up an OpenClaw AI agent as a Discord bot. Learn how to create the bot, configure permissions, and get your agent responding in channels."
date: "2026-02-21"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Discord", "Bots"]
---

## Why Discord + OpenClaw?

Discord is where developer communities live. With OpenClaw, your AI agent becomes a full Discord participant — responding to mentions, managing channels, reacting to messages, and running automations.

## Step 1: Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it
3. Go to **Bot** → click **Add Bot**
4. Copy the **Bot Token** (keep it secret!)
5. Enable **Message Content Intent** under Privileged Intents

## Step 2: Invite the Bot

Generate an invite URL with these permissions:
- Send Messages
- Read Message History
- Add Reactions
- Use Slash Commands
- Manage Messages (optional)

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877975552&scope=bot
```

## Step 3: Configure OpenClaw

```bash
openclaw config set discord.token YOUR_BOT_TOKEN
openclaw gateway restart
```

## Step 4: Set Up Channels

Configure which channels your agent monitors:

```yaml
discord:
  token: "YOUR_BOT_TOKEN"
  channels:
    - id: "123456789"
      mode: "mention"  # Only respond when mentioned
    - id: "987654321"
      mode: "all"      # Respond to everything
```

## Bot Behavior in Groups

OpenClaw agents are smart about group chat participation:

- **Respond** when directly mentioned or asked a question
- **React** with emoji when acknowledging without a full reply
- **Stay silent** during casual banter that doesn't need AI input
- **Never dominate** the conversation

This is configured in `AGENTS.md` — your agent follows social norms.

## Advanced: Multiple Servers

One OpenClaw instance can serve multiple Discord servers. Each channel can have different modes and permissions.

## Troubleshooting

### Bot doesn't respond
- Check the bot token is correct
- Verify Message Content Intent is enabled
- Ensure the bot has permission to read/send in the channel

### Bot responds to everything
- Switch channel mode to `mention` instead of `all`
- Review your `AGENTS.md` group chat rules

### Slow responses
- Check your LLM API key and quota
- Run `openclaw status` to verify the gateway is healthy
