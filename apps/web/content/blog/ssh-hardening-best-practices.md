---
title: "SSH Hardening Best Practices"
slug: "ssh-hardening-best-practices"
date: "2026-01-15"
category: "DevOps"
tags: ["SSH", "Security", "Hardening", "Linux", "DevOps"]
excerpt: "Harden SSH servers for production. Key-based auth, disable root login, port changes, fail2ban, jump hosts, and certificate-based auth."
description: "Harden SSH servers for production security. Key-based authentication, disable root login, fail2ban intrusion prevention, jump host architecture, and certificate-based auth."
---

Default SSH configuration is not secure enough for production. A freshly installed server gets brute-force attempts within minutes.

## Key-Based Authentication

### Generate Key Pair

```bash
# Ed25519 (recommended)
ssh-keygen -t ed25519 -C "your&#64;email.com"

# RSA (wider compatibility)
ssh-keygen -t rsa -b 4096 -C "your&#64;email.com"
```

### Copy Public Key

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# Or manually
cat ~/.ssh/id_ed25519.pub | ssh user@server 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

### Verify Key Permissions

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

## sshd_config Hardening

Edit `/etc/ssh/sshd_config`:

```bash
# Disable password authentication
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable root login
PermitRootLogin no

# Limit users
AllowUsers deploy admin
# Or by group
AllowGroups ssh-users

# Change default port (reduces noise)
Port 2222

# Protocol 2 only (v1 is insecure)
Protocol 2

# Disable empty passwords
PermitEmptyPasswords no

# Set login grace time
LoginGraceTime 30

# Max auth attempts
MaxAuthTries 3

# Max sessions
MaxSessions 3

# Disable X11 forwarding (if not needed)
X11Forwarding no

# Disable TCP forwarding (if not needed)
AllowTcpForwarding no

# Disable agent forwarding (if not needed)
AllowAgentForwarding no

# Log level
LogLevel VERBOSE

# Idle timeout (5 minutes)
ClientAliveInterval 300
ClientAliveCountMax 0
```

Test and reload:

```bash
# Test config syntax
sudo sshd -t

# Reload (don't restart — keep current session!)
sudo systemctl reload sshd
```

**Always keep your current session open while testing.** Open a new terminal to verify you can still connect.

## fail2ban

Automatically ban IPs after failed login attempts:

```bash
sudo apt install fail2ban
```

```ini
# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600       # 1 hour
findtime = 600       # 10 minute window
```

```bash
sudo systemctl enable --now fail2ban

# Check status
sudo fail2ban-client status sshd

# Unban an IP
sudo fail2ban-client set sshd unbanip 203.0.113.50
```

## SSH Config (Client Side)

`~/.ssh/config` simplifies connections:

```
Host production
    HostName 10.0.1.50
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60

Host staging
    HostName 10.0.2.50
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

# Jump through bastion
Host internal-*
    ProxyJump bastion

Host bastion
    HostName bastion.example.com
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host internal-db
    HostName 10.0.3.100
    User dbadmin

Host internal-app
    HostName 10.0.3.101
    User deploy
```

```bash
ssh production          # Instead of: ssh -p 2222 -i ~/.ssh/id_ed25519 deploy@10.0.1.50
ssh internal-db         # Automatically jumps through bastion
```

## Jump / Bastion Host

```
Internet → Bastion (public IP) → Internal servers (private IPs)
```

```bash
# Direct jump
ssh -J bastion.example.com internal-server

# Multi-hop
ssh -J bastion1,bastion2 internal-server
```

Bastion config — minimal surface:

```bash
# On bastion server sshd_config
AllowTcpForwarding yes      # Required for proxying
AllowAgentForwarding no
X11Forwarding no
PermitRootLogin no
MaxSessions 10
```

## Two-Factor Authentication

```bash
sudo apt install libpam-google-authenticator

# Run as the user
google-authenticator
```

Add to PAM:

```bash
# /etc/pam.d/sshd
auth required pam_google_authenticator.so
```

```bash
# /etc/ssh/sshd_config
AuthenticationMethods publickey,keyboard-interactive
ChallengeResponseAuthentication yes
```

Now login requires: SSH key + TOTP code.

## Monitoring

```bash
# Recent logins
last -n 20

# Failed login attempts
grep "Failed password" /var/log/auth.log | tail -20

# Currently connected
who
w

# Active SSH sessions
ss -tnp | grep ssh
```

## Audit Checklist

```bash
# Check for password auth
grep "PasswordAuthentication" /etc/ssh/sshd_config

# Check for root login
grep "PermitRootLogin" /etc/ssh/sshd_config

# Check authorized_keys for unknown keys
cat ~/.ssh/authorized_keys

# Check for weak host keys
ssh-keygen -lf /etc/ssh/ssh_host_*_key.pub

# Check listening port
ss -tlnp | grep sshd
```

## What's Next?

Our **SELinux for System Admins** course covers mandatory access controls that protect SSH and system services. **Ansible Automation in 30 Minutes** teaches automating SSH hardening across fleets. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

