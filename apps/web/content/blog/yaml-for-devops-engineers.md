---
title: "YAML for DevOps Engineers"
slug: "yaml-for-devops-engineers"
date: "2026-01-13"
category: "DevOps"
tags: ["YAML", "Configuration", "Kubernetes", "Ansible", "DevOps"]
excerpt: "Master YAML syntax for DevOps. Scalars, lists, maps, anchors, multi-line strings, and common mistakes in Kubernetes and Ansible configs."
description: "Master YAML syntax for DevOps. Scalars, lists, maps, anchors, multi-line strings, and common pitfalls."
---

YAML is everywhere in DevOps — Kubernetes manifests, Ansible playbooks, Docker Compose, GitHub Actions, Terraform configs. Learning its quirks saves hours of debugging.

## Basic Syntax

```yaml
# Scalars
name: my-app
version: "2.1"
port: 3000
debug: true
nothing: null
```

**Indentation matters.** Spaces only — never tabs. Two spaces is the convention.

## Strings

```yaml
# Plain (usually works)
name: my-app

# Quoted (when values look like other types)
version: "1.0"        # Without quotes: parsed as float
enabled: "true"        # Without quotes: parsed as boolean
port: "8080"           # Without quotes: parsed as integer
empty: ""

# Special characters need quotes
message: "Line 1\nLine 2"      # \n is literal (no escape)
message: 'It''s a test'        # Single quote escape
path: "C:\\Users\\admin"
colon: "key: value"            # Colon followed by space
```

### Multi-Line Strings

```yaml
# Literal block (preserves newlines)
script: |
  #!/bin/bash
  echo "Hello"
  echo "World"
# Result: "#!/bin/bash\necho \"Hello\"\necho \"World\"\n"

# Literal block, strip trailing newline
script: |-
  #!/bin/bash
  echo "Hello"
  echo "World"
# Result: "#!/bin/bash\necho \"Hello\"\necho \"World\""

# Folded (newlines become spaces)
description: >
  This is a long
  description that
  wraps multiple lines.
# Result: "This is a long description that wraps multiple lines.\n"

# Folded, strip trailing newline
description: >-
  This is a long
  description.
# Result: "This is a long description."
```

| Indicator | Newlines | Trailing |
|---|---|---|
| `\|` | Preserved | Keeps final `\n` |
| `\|-` | Preserved | Strips final `\n` |
| `>` | Folded to spaces | Keeps final `\n` |
| `>-` | Folded to spaces | Strips final `\n` |

## Lists

```yaml
# Block style
fruits:
  - apple
  - banana
  - cherry

# Inline style
fruits: [apple, banana, cherry]

# List of maps
users:
  - name: Alice
    role: admin
  - name: Bob
    role: developer
```

## Maps (Dictionaries)

```yaml
# Block style
database:
  host: localhost
  port: 5432
  name: myapp

# Inline style
database: {host: localhost, port: 5432, name: myapp}

# Nested
app:
  server:
    host: 0.0.0.0
    port: 3000
  database:
    host: db.internal
    port: 5432
```

## Anchors and Aliases

Avoid repetition:

```yaml
# Define anchor
defaults: &defaults
  cpu: 200m
  memory: 256Mi

# Use alias
web:
  resources:
    requests:
      <<: *defaults    # Merge
    limits:
      cpu: "1"
      memory: 512Mi

api:
  resources:
    requests:
      <<: *defaults    # Same defaults
      cpu: 500m        # Override one value
```

### Docker Compose Example

```yaml
x-common: &common
  restart: unless-stopped
  logging:
    driver: json-file
    options:
      max-size: "10m"

services:
  web:
    <<: *common
    image: my-web:latest
    ports:
      - "3000:3000"

  api:
    <<: *common
    image: my-api:latest
    ports:
      - "8080:8080"
```

## Boolean Gotchas

YAML 1.1 (used by many tools) interprets many values as booleans:

```yaml
# All of these are boolean true
enabled: true
enabled: True
enabled: TRUE
enabled: yes
enabled: Yes
enabled: on
enabled: On

# All of these are boolean false
enabled: false
enabled: no
enabled: off

# Country codes that become booleans!
country: NO    # Norway → false!
country: "NO"  # String "NO" ✅
```

**Always quote** values that look like booleans but aren't.

## Number Gotchas

```yaml
# Integer
count: 42
hex: 0xFF
octal: 0o755     # YAML 1.2
octal: 0755      # YAML 1.1 (careful!)

# Float
ratio: 3.14
scientific: 1.0e-3

# Version numbers need quotes!
version: 1.0      # Float: 1
version: "1.0"    # String: "1.0"
version: 1.2.3    # String (has two dots)
```

## Null Values

```yaml
value: null
value: ~
value:              # Empty value = null
```

## Common Mistakes

| Mistake | Wrong | Right |
|---|---|---|
| Tabs instead of spaces | `→port: 3000` | `  port: 3000` |
| Inconsistent indentation | Mix 2/4 spaces | Stick to 2 |
| Unquoted special chars | `name: app: v2` | `name: "app: v2"` |
| Version as number | `version: 1.0` | `version: "1.0"` |
| Boolean country code | `country: NO` | `country: "NO"` |
| Missing space after colon | `port:3000` | `port: 3000` |

## Validation

```bash
# Python
python -c "import yaml; yaml.safe_load(open('config.yml'))"

# yamllint
pip install yamllint
yamllint config.yml

# yq (query YAML like jq for JSON)
yq '.services.web.image' docker-compose.yml
```

## What's Next?

Our **Ansible Automation in 30 Minutes** course uses YAML throughout for playbooks and configuration. **Terraform for Beginners** covers HCL (similar concepts, different syntax). First lessons are free.
