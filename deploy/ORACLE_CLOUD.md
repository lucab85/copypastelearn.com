# Oracle Cloud Deployment Guide

Deploy CopyPasteLearn on Oracle Cloud **Always Free** tier (ARM VM — 4 OCPU, 24 GB RAM).

---

## 1. Create an Oracle Cloud Account

1. Go to [cloud.oracle.com](https://cloud.oracle.com) and sign up
2. You'll get access to **Always Free** resources (no credit card charge after trial)

---

## 2. Create an ARM VM Instance

1. Go to **Compute → Instances → Create Instance**
2. Configure:
   - **Name**: `copypastelearn`
   - **Image**: Ubuntu 22.04 (or 24.04) — Canonical
   - **Shape**: `VM.Standard.A1.Flex` (ARM) — **Always Free**
     - OCPUs: **4** (free up to 4)
     - Memory: **24 GB** (free up to 24 GB)
   - **Boot volume**: 100 GB (free up to 200 GB)
   - **Networking**: Create new VCN or select existing
     - Assign a **public IP**
3. **SSH Key**: Upload your public key or let OCI generate one (download the private key!)
4. Click **Create**

---

## 3. Configure Firewall (Security List)

OCI blocks ports by default. Open HTTP/HTTPS:

1. Go to **Networking → Virtual Cloud Networks → your VCN → Security Lists**
2. Add **Ingress Rules**:

| Source CIDR  | Protocol | Dest Port | Description |
|-------------|----------|-----------|-------------|
| 0.0.0.0/0  | TCP      | 80        | HTTP        |
| 0.0.0.0/0  | TCP      | 443       | HTTPS       |

> Port 3000 and 4000 are internal only — Caddy handles public traffic.

---

## 4. SSH into the VM

```bash
ssh -i ~/path/to/private-key ubuntu@<PUBLIC_IP>
```

---

## 5. Install Docker

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-plugin git

# Allow your user to run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 6. Clone & Configure

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/copypastelearn.com.git
cd copypastelearn.com

# Create production env file
cp .env.production.example .env.production
nano .env.production   # Fill in all real values
```

### Key environment variables to set:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (after creating endpoint) |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Products → Price ID |
| `MUX_*` | Mux Dashboard → Settings → API Keys |
| `LAB_SERVICE_API_KEY` | Generate with: `openssl rand -hex 32` |

---

## 7. Update Caddyfile

```bash
# Replace YOUR_DOMAIN with your actual domain
sed -i 's/YOUR_DOMAIN/copypastelearn.com/g' deploy/Caddyfile
```

---

## 8. Point Your Domain

Add DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A    | @    | `<VM_PUBLIC_IP>` |
| A    | www  | `<VM_PUBLIC_IP>` |

Wait for DNS propagation (~5 min to 1 hour).

---

## 9. Deploy!

```bash
./deploy/deploy.sh deploy
```

This will:
- Build both Docker images (web + labs)
- Start containers with Caddy reverse proxy
- Auto-provision Let's Encrypt TLS certificates

First build takes ~5-10 minutes on the ARM VM.

---

## 10. Post-Deploy Setup

### Stripe Webhook
Create a webhook endpoint in Stripe Dashboard pointing to:
```
https://copypastelearn.com/api/webhooks/stripe
```

Enable these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copy the webhook secret into `.env.production` as `STRIPE_WEBHOOK_SECRET`.

### Clerk Webhook
Create a webhook in Clerk Dashboard pointing to:
```
https://copypastelearn.com/api/webhooks/clerk
```

### Rebuild after webhook secret update
```bash
./deploy/deploy.sh restart
```

---

## Management Commands

```bash
# Check status
./deploy/deploy.sh status

# View logs (all services)
./deploy/deploy.sh logs

# View logs (specific service)
./deploy/deploy.sh logs web
./deploy/deploy.sh logs labs
./deploy/deploy.sh logs caddy

# Stop everything
./deploy/deploy.sh stop

# Restart services
./deploy/deploy.sh restart

# Full redeploy (after git push)
./deploy/deploy.sh deploy
```

---

## Updating the App

```bash
cd ~/copypastelearn.com
./deploy/deploy.sh deploy   # pulls latest code, rebuilds, restarts
```

---

## Resource Usage (Always Free Limits)

| Resource | Free Limit | Your Usage |
|----------|-----------|------------|
| ARM OCPUs | 4 | 4 |
| RAM | 24 GB | 24 GB |
| Boot Volume | 200 GB | 100 GB |
| Outbound Data | 10 TB/month | Well under |
| Public IP | 1 | 1 |

Your VM runs: Next.js web app + Lab service + Caddy + Docker sandbox containers — all comfortably within the free tier.

---

## Troubleshooting

### Build fails on ARM
All images used (node:20-slim, caddy:2-alpine, ubuntu:22.04) support ARM64 natively.

### Can't connect to site
1. Check OCI Security List has ports 80/443 open
2. Check iptables on the VM: `sudo iptables -L INPUT -n`
3. If iptables blocks traffic:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

### Out of disk space
```bash
docker system prune -af   # Remove unused images/containers
```

### View container logs
```bash
docker logs cpl-web --tail 100
docker logs cpl-labs --tail 100
docker logs cpl-caddy --tail 100
```
