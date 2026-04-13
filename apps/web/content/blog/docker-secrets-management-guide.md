---
title: "Docker Secrets Management Guide"
slug: "docker-secrets-management-guide"
date: "2026-01-05"
category: "DevOps"
tags: ["Docker", "Secrets", "Security", "Compose", "DevOps"]
excerpt: "Handle secrets in Docker safely. Environment variables, Docker secrets, mounted files, build secrets, and integration with external vaults."
description: "Handle Docker secrets safely. Env vars, Docker secrets, mounted files, build secrets, and vault integration."
---

Secrets in containers need special handling. Baking them into images or passing them as plain environment variables creates security risks. Here are the approaches from basic to production-grade.

## Environment Variables (Basic)

```bash
# Docker run
docker run -e DB_PASSWORD=secret my-app

# Docker Compose
services:
  api:
    environment:
      DB_PASSWORD: secret
```

**Problems:**
- Visible in `docker inspect`
- Visible in `/proc/PID/environ`
- May leak into logs
- Stored in shell history

### Slightly Better: .env Files

```bash
# .env (gitignored!)
DB_PASSWORD=secret
API_KEY=sk-prod-abc123
```

```yaml
services:
  api:
    env_file:
      - .env
```

Still visible in `docker inspect`, but not in compose files or shell history.

## Docker Swarm Secrets

Built-in secret management for Docker Swarm:

```bash
# Create secret
echo "S3cur3P@ss!" | docker secret create db_password -

# From file
docker secret create tls_cert ./cert.pem

# List
docker secret ls
```

```yaml
# docker-compose.yml (Swarm mode)
services:
  api:
    image: my-api
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    external: true
  api_key:
    external: true
```

Inside the container, secrets are mounted as files:

```bash
cat /run/secrets/db_password
# S3cur3P@ss!
```

```python
# Read in application
with open("/run/secrets/db_password") as f:
    db_password = f.read().strip()
```

## Docker Compose Secrets (Non-Swarm)

```yaml
services:
  api:
    image: my-api
    secrets:
      - db_password

  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

Many official images support `*_FILE` variants that read from file paths instead of env vars.

## Build Secrets (Docker BuildKit)

Pass secrets during build without baking them into image layers:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./

# Mount secret during build only
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci

COPY . .
CMD ["node", "server.js"]
```

```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=npm_token,src=$HOME/.npmrc \
  -t my-app .
```

The secret is available during build but NOT in the final image. It does not appear in any layer.

## Mounted Secret Files

```yaml
services:
  api:
    image: my-api
    volumes:
      - type: bind
        source: ./secrets/config.json
        target: /app/config/secrets.json
        read_only: true
```

```bash
# Docker run
docker run -v $(pwd)/secrets/config.json:/app/config/secrets.json:ro my-app
```

## External Vault Integration

### HashiCorp Vault Agent

```yaml
services:
  vault-agent:
    image: hashicorp/vault
    command: agent -config=/vault/config.hcl
    volumes:
      - vault-secrets:/vault/secrets
      - ./vault-agent.hcl:/vault/config.hcl

  api:
    image: my-api
    volumes:
      - vault-secrets:/app/secrets:ro
    depends_on:
      - vault-agent

volumes:
  vault-secrets:
```

### AWS Secrets Manager (In Code)

```python
import boto3
import json

def get_secret(name):
    client = boto3.client("secretsmanager", region_name="eu-west-1")
    response = client.get_secret_value(SecretId=name)
    return json.loads(response["SecretString"])

secrets = get_secret("production/api")
db_password = secrets["db_password"]
```

## Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  db-password: UzNjdXIzUEBzcyE=   # base64 encoded

---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: api
          # As environment variable
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-password
          # Or as mounted file
          volumeMounts:
            - name: secrets
              mountPath: /app/secrets
              readOnly: true
      volumes:
        - name: secrets
          secret:
            secretName: app-secrets
```

## Comparison

| Method | Security | Complexity | Best For |
|---|---|---|---|
| Env vars | Low | Low | Development |
| .env files | Low-Medium | Low | Local development |
| Docker secrets (Swarm) | High | Medium | Docker Swarm |
| Compose file secrets | Medium | Low | Docker Compose |
| Build secrets | High | Low | Private packages |
| Mounted files | Medium | Low | Simple deployments |
| Vault | Highest | High | Production |
| K8s Secrets | Medium-High | Medium | Kubernetes |

## Best Practices

| Practice | Why |
|---|---|
| Never bake secrets into images | Images are shared and cached |
| Use `*_FILE` variants | Avoid env var exposure |
| Gitignore secret files | Prevent accidental commits |
| Rotate secrets regularly | Limit exposure window |
| Use build secrets for private deps | Not stored in layers |
| Prefer mounted files over env vars | Less exposure surface |
| Encrypt at rest | K8s secrets are base64, not encrypted |

## What's Next?

Our **Docker Fundamentals** course covers secret management in containerized applications. **SELinux for System Admins** teaches OS-level security. First lessons are free.
