---
title: "OpenClaw + Telegram Bot"
description: "Connect your OpenClaw agent to Telegram for a personal AI assistant accessible from your phone. Setup guide with BotFather and configuration."
date: "2026-02-16"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Telegram", "Messaging"]
---

## Why Telegram?

Telegram is ideal for personal AI agents:
- Available on every device (phone, tablet, desktop, web)
- Rich message formatting (markdown, buttons, media)
- Instant push notifications
- No cost for bot usage
- Excellent API

## Step 1: Create a Bot with BotFather

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g., "My OpenClaw Agent")
4. Choose a username (must end in `bot`, e.g., `my_openclaw_bot`)
5. Copy the **API token**

## Step 2: Configure OpenClaw

```bash
openclaw config set telegram.token YOUR_BOT_TOKEN
openclaw gateway restart
```

## Step 3: Start Chatting

Open your bot in Telegram and send a message. Your OpenClaw agent will respond!

## Features

### Voice Messages

Send voice messages to your bot — OpenClaw can transcribe and respond.

### File Sharing

Send documents, images, and code files. Your agent can read and process them.

### Location Sharing

Share your location for weather forecasts and local recommendations.

### Inline Buttons

OpenClaw can send messages with interactive buttons for quick actions.

## Advanced Configuration

### Private Only

Restrict your bot to only respond to you:

```yaml
telegram:
  token: "YOUR_TOKEN"
  allowedUsers:
    - "your_telegram_id"
```

### Group Chat Mode

Add your bot to Telegram groups:

```yaml
telegram:
  token: "YOUR_TOKEN"
  groups:
    - id: "-100123456789"
      mode: "mention"  # Only respond when @mentioned
```

## Use Cases

- **Quick questions** while away from your desk
- **Reminders** — "remind me to deploy at 5 PM"
- **Status checks** — "is the website up?"
- **File access** — "send me the latest report"
- **Smart home** — "turn off the living room lights"

## Tips

1. **Set a profile picture** for your bot in BotFather (`/setuserpic`)
2. **Add a description** (`/setdescription`) so others know what it does
3. **Pin important messages** from your agent for quick reference
4. **Use /commands** in BotFather to register bot commands
