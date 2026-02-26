---
title: "Securing Your OpenClaw Agent: Best Practices"
description: "Security guide for self-hosted OpenClaw agents — API key management, network hardening, permission boundaries, and data protection."
date: "2026-02-17"
author: "Luca Berton"
tags: ["OpenClaw", "Security", "Self-Hosted"]
---

## Security Model

OpenClaw runs with significant system access — file operations, shell commands, web browsing, and messaging. This power requires careful security practices.

## API Key Management

### Never Hardcode Keys

```bash
# Good: Environment variables
export OPENAI_API_KEY="sk-..."
export STRIPE_SECRET_KEY="sk_live_..."

# Bad: In config files committed to git
# apiKey: "sk-..." ← NEVER do this
```

### Use .env Files

```bash
# .env (add to .gitignore!)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Rotate Regularly

Set a reminder to rotate API keys quarterly. If a key is ever exposed (e.g., in a chat log), revoke immediately.

## Network Security

### Firewall Rules

If your agent is internet-facing:

```bash
# Only allow SSH and HTTPS
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 443/tcp
sudo ufw enable
```

### Reverse Proxy

Use Caddy or nginx as a reverse proxy with TLS:

```
# Caddyfile
agent.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### VPN Access

For maximum security, access your agent only via VPN (WireGuard, Tailscale):

```bash
# Tailscale — zero-config VPN
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

## Permission Boundaries

### Agent Safety Rules

OpenClaw's `AGENTS.md` includes safety guidelines:

```markdown
## Safety
- Don't exfiltrate private data
- Don't run destructive commands without asking
- trash > rm (recoverable beats gone forever)
- When in doubt, ask
```

### External vs Internal Actions

Define clear boundaries:
- **Free to do:** Read files, search web, organize workspace
- **Ask first:** Send emails, post publicly, delete files

## Data Protection

### Memory Privacy

`MEMORY.md` contains personal context. OpenClaw's architecture ensures:
- Memory files stay in the workspace
- They're only loaded in main sessions (not group chats)
- No cloud sync unless you configure it

### Backup Your Workspace

```bash
# Regular backups
tar -czf agent-backup-$(date +%Y%m%d).tar.gz ~/agent/
```

### Audit Logs

Review your agent's daily memory files periodically. They serve as an activity log of what the agent did.

## Common Mistakes

1. **Sharing tokens in chat** — your agent might include them in memory
2. **Running as root** — always use a dedicated user account
3. **Open ports** — keep your agent behind a firewall
4. **No backups** — disk failures happen
5. **Ignoring updates** — keep OpenClaw and Node.js updated
