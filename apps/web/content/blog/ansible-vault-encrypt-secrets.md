---
title: "Ansible Vault: Encrypt Secrets Safely"
description: "Learn Ansible Vault to encrypt passwords, API keys, and variables. Covers vault create, edit, encrypt_string, and CI/CD usage."
date: "2026-04-08"
author: "Luca Berton"
category: "DevOps"
tags: ["Ansible", "Vault", "Secrets", "Encryption", "DevOps"]
excerpt: "Learn Ansible Vault to encrypt passwords, API keys, and variables. Covers vault create, edit, encrypt_string, and CI/CD usage."
---

## Why Ansible Vault?

Hardcoding passwords in playbooks is a security risk. Ansible Vault encrypts sensitive data so you can safely commit it to version control.

## Create an Encrypted File

```bash
ansible-vault create secrets.yml
```

Enter a vault password when prompted. The file opens in your editor — add your secrets:

```yaml
db_password: "SuperSecret123"
api_key: "sk-abc123def456"
```

Save and close. The file is now AES-256 encrypted.

## View and Edit

```bash
# View without editing
ansible-vault view secrets.yml

# Edit in place
ansible-vault edit secrets.yml
```

## Encrypt an Existing File

```bash
ansible-vault encrypt vars/production.yml
```

Decrypt it back:

```bash
ansible-vault decrypt vars/production.yml
```

## Encrypt a Single Variable

For inline encryption without encrypting the whole file:

```bash
ansible-vault encrypt_string 'SuperSecret123' --name 'db_password'
```

Output:

```yaml
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  6231326536613163...
```

Paste this directly into your vars file. The rest of the file stays readable.

## Use in Playbooks

Reference vault variables like any other variable:

```yaml
- name: Configure database
  hosts: db_servers
  vars_files:
    - secrets.yml
  tasks:
    - name: Set database password
      ansible.builtin.lineinfile:
        path: /etc/myapp/db.conf
        regexp: '^password='
        line: "password={{ db_password }}"
```

Run with the vault password:

```bash
ansible-playbook site.yml --ask-vault-pass

# Or use a password file
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

## Multiple Vault Passwords

Use vault IDs for different environments:

```bash
# Create with an ID
ansible-vault create --vault-id prod@prompt secrets-prod.yml
ansible-vault create --vault-id dev@prompt secrets-dev.yml

# Run with multiple vault IDs
ansible-playbook site.yml \
  --vault-id prod@~/.vault_pass_prod \
  --vault-id dev@~/.vault_pass_dev
```

## CI/CD Integration

Store the vault password as a CI secret and write it to a temp file:

```yaml
# GitHub Actions example
- name: Run playbook
  env:
    VAULT_PASS: ${{ secrets.ANSIBLE_VAULT_PASSWORD }}
  run: |
    echo "$VAULT_PASS" > /tmp/.vault_pass
    ansible-playbook site.yml --vault-password-file /tmp/.vault_pass
    rm /tmp/.vault_pass
```

## Best Practices

- **Never commit vault passwords** to Git — use CI/CD secrets or a password manager
- **Use `encrypt_string`** for individual values so the file structure stays readable
- **Rotate vault passwords** periodically — re-encrypt with `ansible-vault rekey`
- **Use vault IDs** to separate production and development secrets
- **Add `.vault_pass` to `.gitignore`** as a safety net

## Related Posts

- [Ansible Automation in Minutes](/blog/ansible-automation-beginners-guide) for getting started
- [Terraform Security Practices](/blog/terraform-security-best-practices) for IaC secrets management
- [Securing Your OpenClaw Agent](/blog/securing-openclaw-agent) for agent security
