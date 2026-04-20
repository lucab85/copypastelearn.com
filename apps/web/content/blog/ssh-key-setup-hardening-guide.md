---
title: "SSH Key Setup and Hardening Guide"
slug: "ssh-key-setup-hardening-guide"
date: "2026-03-14"
category: "DevOps"
tags: ["SSH", "Security", "Linux", "DevOps", "Sysadmin"]
excerpt: "Set up SSH keys properly and harden your SSH server. Key generation, agent forwarding, config file, and security best practices."
description: "Set up SSH keys and harden your server. Key generation, agent forwarding, config file management, and security tips for remote access."
---

SSH is how you access remote servers. Password authentication is convenient but insecure. SSH keys are both more secure and more convenient.

## Generate SSH Keys

```bash
# Ed25519 (recommended — faster, smaller, more secure)
ssh-keygen -t ed25519 -C "alice&#64;example.com"

# RSA (if Ed25519 isn't supported)
ssh-keygen -t rsa -b 4096 -C "alice&#64;example.com"
```

This creates:
- `~/.ssh/id_ed25519` — your private key (never share this)
- `~/.ssh/id_ed25519.pub` — your public key (share freely)

## Copy Your Key to a Server

```bash
ssh-copy-id user@server.example.com
```

Or manually:

```bash
cat ~/.ssh/id_ed25519.pub | ssh user@server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Now you can SSH without a password:

```bash
ssh user@server.example.com
```

## SSH Config File

Stop typing long commands. Create `~/.ssh/config`:

```
Host web
    HostName 203.0.113.10
    User alice
    Port 22
    IdentityFile ~/.ssh/id_ed25519

Host db
    HostName 10.0.1.20
    User admin
    ProxyJump web

Host staging
    HostName staging.example.com
    User deploy
    IdentityFile ~/.ssh/deploy_key
    ForwardAgent yes

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
```

Now:

```bash
ssh web        # Instead of: ssh -i ~/.ssh/id_ed25519 alice@203.0.113.10
ssh db         # Jumps through web automatically
ssh staging    # Uses deploy key, forwards agent
```

## SSH Agent

Avoid typing your passphrase repeatedly:

```bash
# Start agent (usually auto-started)
eval "$(ssh-agent -s)"

# Add key
ssh-add ~/.ssh/id_ed25519

# List loaded keys
ssh-add -l
```

On macOS, add to Keychain:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

## Agent Forwarding

Use your local keys on remote servers (for git, etc.):

```bash
ssh -A user@server
# Now on the server, git clone works with YOUR keys
git clone git@github.com:your-org/repo.git
```

**Security warning**: Only forward to servers you trust. A compromised server could use your forwarded agent.

## Harden SSH Server

Edit `/etc/ssh/sshd_config`:

```bash
# Disable password authentication
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable root login
PermitRootLogin no

# Use only SSH protocol 2
Protocol 2

# Limit users who can SSH
AllowUsers alice bob deploy

# Change default port (optional, reduces noise)
Port 2222

# Limit authentication attempts
MaxAuthTries 3

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding (unless needed)
X11Forwarding no

# Set idle timeout (10 minutes)
ClientAliveInterval 300
ClientAliveCountMax 2
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

**Test before disconnecting**: Open a new terminal and verify you can connect with the new config. Don't lock yourself out.

## Key Permissions

SSH is strict about file permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519          # Private key
chmod 644 ~/.ssh/id_ed25519.pub      # Public key
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/config
```

If permissions are wrong, SSH silently refuses to use the key.

## Fail2ban: Block Brute Force

```bash
sudo apt install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

Edit `/etc/fail2ban/jail.local`:

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check banned IPs
sudo fail2ban-client status sshd
```

## Multi-Key Setup

Use different keys for different purposes:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/work_key -C "work"
ssh-keygen -t ed25519 -f ~/.ssh/personal_key -C "personal"
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "deploy"
```

`~/.ssh/config`:

```
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/work_key

Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/personal_key

Host production-*
    User deploy
    IdentityFile ~/.ssh/deploy_key
```

## Ansible SSH Tips

```yaml
# ansible.cfg
[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
pipelining = True
```

This reuses SSH connections across tasks — much faster for large playbooks.

## What's Next?

Our **Ansible Automation in 30 Minutes** course uses SSH for all server communication. Our **SELinux for System Admins** course covers SSH security policies on RHEL. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

