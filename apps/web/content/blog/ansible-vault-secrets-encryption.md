---
title: "Ansible Vault Secrets Encryption"
slug: "ansible-vault-secrets-encryption"
date: "2026-01-28"
category: "DevOps"
tags: ["Ansible", "Vault", "Encryption", "Secrets", "Security"]
excerpt: "Encrypt secrets with Ansible Vault. Encrypt files, strings, multi-password setups, and CI/CD integration for secure automation."
description: "Encrypt secrets with Ansible Vault for secure automation. Cover file encryption, string-level vaulting, multi-password setups, and CI/CD pipeline integration."
---

Ansible Vault encrypts sensitive data so you can safely commit it to Git. Passwords, API keys, certificates — all encrypted at rest, decrypted at runtime.

## Encrypting Files

```bash
# Encrypt a file
ansible-vault encrypt group_vars/production/secrets.yml

# View encrypted file
ansible-vault view group_vars/production/secrets.yml

# Edit encrypted file (opens in $EDITOR)
ansible-vault edit group_vars/production/secrets.yml

# Decrypt a file
ansible-vault decrypt group_vars/production/secrets.yml

# Re-key (change password)
ansible-vault rekey group_vars/production/secrets.yml
```

### Encrypted File Format

```yaml
$ANSIBLE_VAULT;1.1;AES256
36336262363339613464653036623261
30626465383762343963303637366533
...
```

### Create New Encrypted File

```bash
ansible-vault create group_vars/production/secrets.yml
```

Write your secrets:

```yaml
---
db_password: "S3cur3P@ss!"
api_key: "sk-prod-abc123def456"
jwt_secret: "my-super-long-jwt-secret-key-here"
smtp_password: "email-password-here"
ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
  -----END PRIVATE KEY-----
```

## Encrypting Individual Strings

Encrypt just one value instead of an entire file:

```bash
ansible-vault encrypt_string 'S3cur3P@ss!' --name 'db_password'
```

Output:

```yaml
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  36336262363339613464653036623261
  30626465383762343963303637366533
```

Paste directly into your variables file:

```yaml
# group_vars/production/vars.yml (committed to Git)
db_host: db.internal
db_port: 5432
db_name: myapp
db_user: appuser
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  36336262363339613464653036623261
  ...
```

## Running Playbooks with Vault

```bash
# Prompt for password
ansible-playbook site.yml --ask-vault-pass

# Password from file
ansible-playbook site.yml --vault-password-file ~/.vault_pass

# Password from environment variable (via script)
ansible-playbook site.yml --vault-password-file ./vault-pass.sh
```

### vault-pass.sh

```bash
#!/bin/bash
echo "$ANSIBLE_VAULT_PASSWORD"
```

### ansible.cfg

```ini
[defaults]
vault_password_file = ~/.vault_pass
```

## Multiple Vault Passwords

Different secrets for different environments:

```bash
# Encrypt with vault ID
ansible-vault encrypt --vault-id production@prompt group_vars/production/secrets.yml
ansible-vault encrypt --vault-id staging@prompt group_vars/staging/secrets.yml

# Run with multiple vault IDs
ansible-playbook site.yml \
  --vault-id production@~/.vault_pass_prod \
  --vault-id staging@~/.vault_pass_staging
```

### In Variables

```yaml
# Production secrets
db_password: !vault |
  $ANSIBLE_VAULT;1.2;AES256;production
  36336262363339613464653036623261
  ...

# Staging secrets
staging_db_password: !vault |
  $ANSIBLE_VAULT;1.2;AES256;staging
  64623261303632363533396134363438
  ...
```

## Project Structure

```
inventory/
  production/
    hosts.yml
    group_vars/
      all/
        vars.yml          # Non-sensitive (committed)
        vault.yml         # Encrypted (committed)
  staging/
    hosts.yml
    group_vars/
      all/
        vars.yml
        vault.yml
```

### vars.yml (plain text)

```yaml
---
app_name: my-app
app_port: 3000
db_host: db.internal
db_port: 5432
db_name: myapp
```

### vault.yml (encrypted)

```yaml
---
vault_db_password: "S3cur3P@ss!"
vault_api_key: "sk-prod-abc123"
vault_jwt_secret: "long-secret-key"
```

### Reference Pattern

```yaml
# vars.yml — reference vault variables with a prefix
db_password: "{{ vault_db_password }}"
api_key: "{{ vault_api_key }}"
```

This makes it clear which values are secrets without opening the vault file.

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Ansible
  env:
    ANSIBLE_VAULT_PASSWORD: ${{ secrets.ANSIBLE_VAULT_PASSWORD }}
  run: |
    echo "$ANSIBLE_VAULT_PASSWORD" > /tmp/.vault_pass
    ansible-playbook site.yml --vault-password-file /tmp/.vault_pass
    rm /tmp/.vault_pass
```

### GitLab CI

```yaml
deploy:
  script:
    - echo "$VAULT_PASSWORD" > /tmp/.vault_pass
    - ansible-playbook site.yml --vault-password-file /tmp/.vault_pass
    - rm /tmp/.vault_pass
  variables:
    VAULT_PASSWORD: $ANSIBLE_VAULT_PASSWORD
```

## Best Practices

| Practice | Why |
|---|---|
| Prefix vault variables with `vault_` | Clear which values are secrets |
| One vault file per environment | Different passwords per env |
| Use vault password file, not `--ask-vault-pass` | Automation-friendly |
| Never commit vault password files | Add to `.gitignore` |
| Rotate vault passwords periodically | Security hygiene |
| Use `encrypt_string` for individual values | Smaller encrypted surface |
| Keep non-sensitive vars in plain text | Easier to review in PRs |

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers Vault encryption for production automation. **SELinux for System Admins** teaches OS-level security. First lessons are free.
