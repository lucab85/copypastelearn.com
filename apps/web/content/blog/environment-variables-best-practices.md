---
title: "Environment Variables Best Practices"
slug: "environment-variables-best-practices"
date: "2026-03-03"
category: "Development"
tags: ["Environment Variables", "Security", "Docker", "DevOps", "Configuration"]
excerpt: "Handle environment variables properly in development and production. Dotenv, Docker secrets, Kubernetes ConfigMaps, and common mistakes."
description: "Handle environment variables correctly. Dotenv files, Docker secrets, Kubernetes ConfigMaps, twelve-factor methodology, and security pitfalls."
author: "Luca Berton"
---

Environment variables configure your application without changing code. Get them wrong and you leak secrets or break deployments.

## The Basics

```bash
# Set a variable
export DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

# Use in your application
echo $DATABASE_URL

# Set for a single command
DATABASE_URL="postgres://..." node server.js
```

## .env Files for Development

```env
# .env (never commit this!)
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production
STRIPE_SECRET_KEY=sk_test_xxxxx
PORT=3000
NODE_ENV=development
```

Load with dotenv:

```typescript
// Node.js
import 'dotenv/config';
console.log(process.env.DATABASE_URL);
```

```python
# Python
from dotenv import load_dotenv
load_dotenv()
import os
print(os.environ['DATABASE_URL'])
```

### .env.example (DO commit this)

```env
# .env.example — copy to .env and fill in values
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=
STRIPE_SECRET_KEY=
PORT=3000
NODE_ENV=development
```

### .gitignore

```gitignore
.env
.env.local
.env.production
.env*.local
```

## Docker

```yaml
# docker-compose.yml
services:
  app:
    image: my-app
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
```

```dockerfile
# Dockerfile — don't bake secrets into images!
# Bad:
ENV DATABASE_URL=postgresql://user:pass@db/mydb

# Good — set at runtime:
# docker run -e DATABASE_URL="..." my-app
```

## Kubernetes ConfigMaps and Secrets

Non-sensitive configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
```

Sensitive values:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@db:5432/mydb"
  JWT_SECRET: "your-production-secret"
```

Use in deployment:

```yaml
spec:
  containers:
    - name: app
      envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
```

## Validation

Validate at startup — fail fast:

```typescript
// config.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
});

export const env = envSchema.parse(process.env);
// Throws immediately if any variable is missing or invalid
```

## CI/CD

### GitHub Actions

```yaml
env:
  NODE_ENV: test

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/testdb
    steps:
      - run: npm test
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Vercel / Netlify

Set in dashboard:
- **Production**: real API keys, production database
- **Preview**: test API keys, staging database
- **Development**: local defaults

## Common Mistakes

### 1. Committing .env Files

```bash
# Check if .env was ever committed
git log --all -- .env

# Remove from history (if committed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' HEAD
```

### 2. Using Secrets in Docker Build Args

```dockerfile
# Bad — args are visible in image history
ARG DATABASE_URL
RUN echo $DATABASE_URL > /app/config

# docker history shows the secret!
```

### 3. Different Names Across Environments

```env
# Dev
DB_HOST=localhost

# Production
DATABASE_HOST=db.internal  # Different name!
```

Pick one name and use it everywhere.

### 4. No Default Values

```typescript
// Bad — crashes silently with wrong behavior
const port = process.env.PORT; // undefined → app binds to nothing

// Good — explicit default
const port = parseInt(process.env.PORT || '3000', 10);
```

## Hierarchy

When multiple sources exist, this is the standard precedence:

1. **Command-line flags** (highest)
2. **Environment variables**
3. **`.env.local`** (git-ignored)
4. **`.env`** (committed defaults)
5. **Application defaults** (lowest)

## Secrets Management for Production

| Tool | Best For |
|---|---|
| AWS Secrets Manager | AWS-native apps |
| HashiCorp Vault | Multi-cloud, enterprise |
| Kubernetes Secrets | K8s-native (basic) |
| External Secrets Operator | K8s + external vault |
| SOPS | Encrypted files in Git |
| Doppler | SaaS secrets manager |

## What's Next?

Our **Docker Fundamentals** course covers container configuration best practices. **Node.js REST APIs** teaches production-grade environment handling. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

