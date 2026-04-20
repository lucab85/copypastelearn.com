---
title: "YAML Syntax Guide for DevOps"
slug: "yaml-syntax-guide-devops"
date: "2026-03-15"
category: "DevOps"
tags: ["YAML", "DevOps", "Ansible", "Kubernetes", "Configuration"]
excerpt: "Master YAML syntax for DevOps. Scalars, lists, maps, anchors, multi-line strings, and common pitfalls in Ansible, Kubernetes, and CI/CD."
description: "Master YAML syntax for DevOps tools and configuration. Scalars, lists, nested maps, anchors, multi-line strings, and common gotchas explained with practical pipeline examples."
---

YAML is everywhere in DevOps: Ansible playbooks, Kubernetes manifests, Docker Compose files, GitHub Actions, Helm charts. Getting YAML syntax wrong is one of the most common sources of debugging pain.

## Basic Syntax

### Scalars (Single Values)

```yaml
string: hello world
quoted: "hello world"
number: 42
float: 3.14
boolean: true
null_value: null
date: 2026-04-10
```

### Lists (Arrays)

```yaml
# Block style
fruits:
  - apple
  - banana
  - cherry

# Inline style
fruits: [apple, banana, cherry]
```

### Maps (Objects)

```yaml
# Block style
person:
  name: Alice
  age: 30
  role: engineer

# Inline style
person: {name: Alice, age: 30, role: engineer}
```

### Nested Structures

```yaml
servers:
  - name: web-1
    ip: 10.0.1.10
    roles:
      - nginx
      - certbot
    ports:
      - 80
      - 443

  - name: db-1
    ip: 10.0.1.20
    roles:
      - postgresql
    ports:
      - 5432
```

## Multi-Line Strings

### Literal Block (`|`) — Preserves Newlines

```yaml
script: |
  #!/bin/bash
  echo "Hello"
  echo "World"
  exit 0
```

Result: `#!/bin/bash\necho "Hello"\necho "World"\nexit 0\n`

### Folded Block (`>`) — Joins Lines

```yaml
description: >
  This is a long description
  that spans multiple lines
  but becomes one paragraph.
```

Result: `This is a long description that spans multiple lines but becomes one paragraph.\n`

### Chomping Indicators

```yaml
keep_newline: |+
  text
  
strip_newline: |-
  text
```

- `|` or `>` — single trailing newline (default)
- `|+` or `>+` — keep all trailing newlines
- `|-` or `>-` — strip trailing newline

## Anchors and Aliases (DRY)

Reuse values with `&` (anchor) and `*` (alias):

```yaml
defaults: &defaults
  timeout: 30
  retries: 3
  region: eu-west-1

production:
  <<: *defaults
  timeout: 60  # Override just this

staging:
  <<: *defaults
  # Inherits timeout: 30, retries: 3, region: eu-west-1
```

## Common YAML Gotchas

### 1. The Norway Problem

```yaml
# These are all booleans, not strings!
country: NO      # false
answer: yes      # true
flag: on         # true
switch: off      # false

# Fix: quote them
country: "NO"
answer: "yes"
```

### 2. Colons in Values

```yaml
# Breaks
url: http://example.com:8080

# Fix: quote it
url: "http://example.com:8080"
```

### 3. Indentation Must Be Spaces

```yaml
# YAML does not allow tabs! Only spaces.
# Most editors convert tabs, but verify your settings.
good:
  key: value    # 2 spaces ✅

bad:
	key: value    # tab ❌ (will fail to parse)
```

### 4. Numbers as Strings

```yaml
# These become numbers
version: 1.0     # float 1.0
port: 8080       # integer 8080

# Force string
version: "1.0"
zip_code: "01onal"
```

### 5. Empty Values

```yaml
# These are all null
key1:
key2: null
key3: ~

# Empty string requires quotes
key4: ""
```

## YAML in Ansible

```yaml
---
- name: Deploy application
  hosts: webservers
  become: true
  vars:
    app_version: "2.1.0"
    env_vars:
      DB_HOST: db.internal
      DB_PORT: "5432"       # Quote to keep as string
      DEBUG: "false"        # Quote to keep as string

  tasks:
    - name: Create config file
      copy:
        content: |
          APP_VERSION={{ app_version }}
          {% for key, value in env_vars.items() %}
          {{ key }}={{ value }}
          {% endfor %}
        dest: /etc/app/config
```

## YAML in Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
          env:
            - name: NODE_ENV
              value: "production"    # Always quote env values
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
```

## YAML in GitHub Actions

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

## Validation Tools

```bash
# Python
pip install yamllint
yamllint myfile.yml

# Node
npx yaml-lint myfile.yml

# Online
# yaml-online-parser.appspot.com
```

## What's Next?

YAML fluency is essential for every DevOps tool. Our **Ansible Automation in 30 Minutes** and **Terraform for Beginners** courses use YAML extensively — learn the tools while mastering the syntax. First lessons are free.
