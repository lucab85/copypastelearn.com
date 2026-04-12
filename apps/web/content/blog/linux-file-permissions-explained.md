---
title: "Linux File Permissions Explained"
slug: "linux-file-permissions-explained"
date: "2026-03-18"
category: "DevOps"
tags: ["Linux", "Permissions", "Security", "Sysadmin", "DevOps"]
excerpt: "Master Linux file permissions. Understand rwx, chmod, chown, SUID, SGID, sticky bit, and ACLs with practical examples."
description: "Master Linux file permissions. Understand rwx, chmod, chown, SUID, SGID, sticky bit, and ACLs with practical examples."
---

Linux file permissions control who can read, write, and execute files. Getting them wrong means either security holes or broken applications.

## The Basics: rwx

Every file has three permission sets:

```bash
ls -l myfile.txt
# -rw-r--r-- 1 alice developers 1024 Apr 10 12:00 myfile.txt
#  │││ │││ │││
#  │││ │││ └── Others: r-- (read only)
#  │││ └────── Group: r-- (read only)
#  └────────── Owner: rw- (read + write)
```

| Symbol | Permission | On Files | On Directories |
|---|---|---|---|
| `r` (4) | Read | View contents | List files |
| `w` (2) | Write | Modify contents | Create/delete files |
| `x` (1) | Execute | Run as program | Enter directory (cd) |

## chmod: Change Permissions

**Numeric (octal)**:

```bash
chmod 755 script.sh    # rwxr-xr-x (owner: all, group+others: read+execute)
chmod 644 config.yml   # rw-r--r-- (owner: read+write, group+others: read)
chmod 600 secrets.env  # rw------- (owner only)
chmod 700 private/     # rwx------ (owner only, directory)
```

**Symbolic**:

```bash
chmod u+x script.sh    # Add execute for owner
chmod g+w shared.txt   # Add write for group
chmod o-r secret.txt   # Remove read for others
chmod a+r public.html  # Add read for all (a = all)
chmod u=rwx,go=rx dir  # Set exact permissions
```

## chown: Change Ownership

```bash
chown alice file.txt           # Change owner
chown alice:developers file.txt # Change owner and group
chown -R alice:developers dir/  # Recursive
```

## Common Permission Patterns

| Octal | Symbolic | Use Case |
|---|---|---|
| `755` | rwxr-xr-x | Scripts, executables, public directories |
| `644` | rw-r--r-- | Config files, HTML, regular files |
| `600` | rw------- | SSH keys, secrets, credentials |
| `700` | rwx------ | Private directories (~/.ssh) |
| `775` | rwxrwxr-x | Shared group directories |
| `664` | rw-rw-r-- | Shared group files |
| `444` | r--r--r-- | Read-only for everyone |

## Special Permissions

### SUID (Set User ID) — 4xxx

When set on an executable, it runs as the file **owner** regardless of who executes it:

```bash
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 Apr 10 /usr/bin/passwd
#    ^ SUID bit (s instead of x)

# passwd runs as root even when alice runs it
# This is how non-root users can change their password
```

Set SUID:

```bash
chmod 4755 myprogram   # or chmod u+s myprogram
```

**Security warning**: SUID on scripts is dangerous. Only use on compiled binaries that are designed for it.

### SGID (Set Group ID) — 2xxx

On a **directory**, new files inherit the directory's group:

```bash
mkdir /shared/project
chgrp developers /shared/project
chmod 2775 /shared/project
# New files created here will belong to "developers" group
```

### Sticky Bit — 1xxx

On a directory, only the file owner can delete their files:

```bash
ls -ld /tmp
# drwxrwxrwt 15 root root 4096 Apr 10 /tmp
#          ^ Sticky bit (t)

chmod 1777 /shared   # or chmod +t /shared
```

Everyone can create files, but only the file's owner can delete it. Used on `/tmp`.

## ACLs: Fine-Grained Control

When basic permissions are not enough:

```bash
# Give bob read access to alice's file
setfacl -m u:bob:r-- alice-file.txt

# Give developers group write access
setfacl -m g:developers:rw- project-file.txt

# View ACLs
getfacl file.txt

# Default ACL on directory (inherited by new files)
setfacl -d -m g:developers:rw- /shared/project/

# Remove ACL
setfacl -x u:bob file.txt

# Remove all ACLs
setfacl -b file.txt
```

Files with ACLs show a `+` in `ls -l`:

```bash
-rw-rw-r--+ 1 alice alice 1024 Apr 10 file.txt
#         ^ ACL present
```

## DevOps Permission Scenarios

### Docker Volumes

```bash
# Container runs as UID 1000, host files owned by root
# Fix: match UIDs
chown -R 1000:1000 /data/app

# Or use Docker user namespace mapping
docker run -u 1000:1000 -v /data/app:/app myimage
```

### SSH Key Permissions

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa          # Private key
chmod 644 ~/.ssh/id_rsa.pub      # Public key
chmod 600 ~/.ssh/authorized_keys
chmod 644 ~/.ssh/config
```

SSH refuses to work if key permissions are too open.

### Web Server Files

```bash
# Nginx/Apache needs read access
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html       # Directories
find /var/www/html -type f -exec chmod 644 {} \;  # Files
```

### Application Secrets

```bash
# .env files should never be world-readable
chmod 600 .env
chmod 600 docker-compose.yml  # If it contains secrets

# Ansible vault files
chmod 600 group_vars/*/vault.yml
```

## Debugging Permission Issues

```bash
# Check effective permissions
namei -l /path/to/file

# Find files with SUID
find / -perm -4000 -type f 2>/dev/null

# Find world-writable files
find / -perm -o+w -type f 2>/dev/null

# Find files owned by nobody
find / -nouser -o -nogroup 2>/dev/null
```

## What's Next?

Our **SELinux for System Admins** course goes beyond basic permissions into mandatory access control — the next level of Linux security. Our **Docker Fundamentals** course covers container permission patterns. First lessons are free.
