---
title: "OpenClaw on Raspberry Pi: Your Always-On AI Agent"
description: "Run an OpenClaw AI agent on a Raspberry Pi for a low-power, always-on personal assistant. Complete setup guide with performance tips."
date: "2026-02-20"
author: "Luca Berton"
tags: ["OpenClaw", "Raspberry Pi", "Self-Hosted"]
---

## Why Raspberry Pi?

A Raspberry Pi is the perfect OpenClaw host:
- **Always on** — 5W power consumption
- **Silent** — no fans
- **Cheap** — $35-75 for the hardware
- **Private** — runs on your local network

## Hardware Requirements

- Raspberry Pi 4 (4GB+) or Pi 5
- 32GB+ microSD card (or SSD via USB for better performance)
- Ethernet or WiFi connection
- Power supply

## Installation

### Flash the OS

Use Raspberry Pi Imager to flash **Raspberry Pi OS Lite (64-bit)**. Enable SSH during setup.

### Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install OpenClaw

```bash
npm install -g openclaw
mkdir ~/agent && cd ~/agent
openclaw init
```

### Configure LLM

```bash
export OPENAI_API_KEY="sk-..."
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
```

### Start as Service

```bash
sudo tee /etc/systemd/system/openclaw.service > /dev/null <<EOF
[Unit]
Description=OpenClaw Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/agent
ExecStart=$(which openclaw) gateway start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now openclaw
```

## Performance Tips

### Use an SSD

MicroSD cards are slow for file I/O. A USB SSD dramatically improves responsiveness:

```bash
# After connecting SSD and mounting
sudo raspi-config  # Set USB boot
```

### Optimize Memory

With 4GB RAM, OpenClaw runs comfortably. The agent itself is lightweight — the LLM runs in the cloud.

### Monitor Resources

```bash
# Check agent status
openclaw status

# System resources
htop
```

## Use Cases

- **Home automation hub** — control smart devices via voice or chat
- **Family assistant** — shared agent on Discord or Telegram
- **Development helper** — always available for coding questions
- **Network monitor** — check service uptime and alert on issues
- **Learning companion** — connected to your CopyPasteLearn courses

## Limitations

- Browser automation is slower on ARM
- Screen recording requires a connected display
- Heavy file operations may be slow on SD cards

Despite these, a Pi makes an excellent always-on AI agent host for most personal use cases.
