---
title: "OpenClaw Discord Bot Setup"
description: "Set up an OpenClaw AI agent as a Discord bot. Learn how to create the bot, configure permissions, and get your agent responding in channels."
date: "2026-02-21"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Discord", "Bots"]
---

## Why Discord + OpenClaw?

Discord is where developer communities live. With OpenClaw, your AI agent becomes a full Discord participant — responding to mentions, managing channels, reacting to messages, and running automations.

If you already run OpenClaw from a CLI or a dashboard, wiring it into Discord solves a reachability problem: Discord is an app your team already has open all day, it pushes mobile notifications when the agent needs input, and it puts the agent's activity somewhere everyone can see it, not in a private session only you're watching.

## Prerequisites

- A Discord account with admin permissions on at least one server, to create applications and invite bots
- OpenClaw already installed and paired on the machine that will run the gateway
- A server where third-party bots are actually allowed — some communities restrict this

## Step 1: Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it
3. Go to **Bot** → click **Add Bot**
4. Copy the **Bot Token** (keep it secret!)
5. Enable **Message Content Intent** under Privileged Intents

Permissions and intents aren't the same thing. Permissions control what the bot is *allowed* to do — you set those in Step 2. Intents control what events Discord *sends* it in the first place, and forgetting **Message Content Intent** is the gotcha almost everyone hits. Without it, Discord still notifies the bot that a message happened but strips the text out of the event, so the bot looks online and receives events, but every message arrives empty and nothing gets a reply. If your agent seems alive but never answers, check this intent before your token.

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

Discord computes that `permissions` number from the boxes you check in the Developer Portal, so you don't calculate it by hand. Keep the list minimal — `Manage Messages` is optional because most automation doesn't need to delete other users' messages, and an over-scoped token is a bigger liability than one scoped tightly.

## Step 3: Configure OpenClaw

```bash
openclaw config set discord.token YOUR_BOT_TOKEN
openclaw gateway restart
```

`openclaw gateway restart` re-establishes OpenClaw's persistent connection to Discord, which is how the agent receives messages and mentions in near real time instead of polling for them. If the restart succeeds but the bot still shows offline, that connection is failing — almost always an invalid or revoked token.

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

Listing a channel means OpenClaw subscribes to its events specifically — it doesn't scan the whole server, and unlisted channels stay invisible even with read permission. `mode` controls how aggressively it engages: `mention` stays quiet until someone `@`-mentions it, the right default for a busy channel; `all` evaluates every message, which fits a dedicated bot channel but gets noisy elsewhere.

## Bot Behavior in Groups

A DM is simple: everything sent to the bot is meant for it. A group channel isn't — most messages aren't directed at the bot at all, and an agent that replies to all of them stops being useful and starts being noise. OpenClaw handles that by being deliberate about when it engages:

- **Respond** when directly mentioned or asked a question
- **React** with emoji when acknowledging without a full reply
- **Stay silent** during casual banter that doesn't need AI input
- **Never dominate** the conversation

This is configured in `AGENTS.md` — your agent follows social norms.

## Advanced: Multiple Servers

One OpenClaw instance can serve multiple Discord servers. Each channel can have different modes and permissions.

A common setup: one instance runs in `all` mode in your team's `#agent` channel, acting like a shared assistant, while it also joins a public community server you moderate — scoped there to `mention` mode in one support channel. Same token, same gateway, two different personalities, because each channel entry is evaluated independently.

## Troubleshooting

Discord issues fall into a few buckets that look similar but have different causes. A bot that appears offline means the gateway connection never established — check the token first. A bot that's online but silent usually means it's missing message content (the Step 1 intent gotcha) or isn't listening to that channel. Permission errors in your logs mean Discord-side permissions don't match your config, which you fix by re-inviting the bot with the right scopes, not by editing YAML.

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

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Related

For a production-focused walkthrough, see Luca Berton's guide on [the Ansible intelligent assistant and MCP server](https://lucaberton.com/blog/ansible-automation-intelligent-assistant-mcp-server-byok-rag-2026/).

