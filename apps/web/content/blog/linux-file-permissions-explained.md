---
title: "Linux File Permissions Explained"
slug: "linux-file-permissions-explained"
date: "2026-01-17"
category: "DevOps"
tags: ["Linux", "Permissions", "Security", "System Administration", "DevOps"]
excerpt: "Master Linux file permissions. chmod, chown, umask, SUID/SGID, sticky bit, and ACLs for secure system administration."
description: "Master Linux file permissions for system administration. chmod, chown, umask, SUID, SGID, sticky bit, and ACLs explained with practical examples for securing your systems."
---

File permissions control who can read, write, and execute files. Getting them right is the foundation of Linux security.

## Reading Permissions

```bash
ls -la
# -rw-r--r-- 1 root root  1234 Jan 17 10:00 config.yml
# drwxr-xr-x 2 app  app   4096 Jan 17 10:00 data/
```

```
-  rw-  r--  r--
│  │    │    │
│  │    │    └── Others (everyone else)
│  │    └─────── Group
│  └──────────── Owner
└─────────────── Type (- file, d directory, l symlink)
```

| Symbol | Permission | Numeric |
|---|---|---|
| `r` | Read | 4 |
| `w` | Write | 2 |
| `x` | Execute | 1 |
| `-` | None | 0 |

`rw-r--r--` = 644 = owner read+write, group read, others read.

## chmod (Change Mode)

### Numeric

```bash
chmod 755 script.sh    # rwxr-xr-x
chmod 644 config.yml   # rw-r--r--
chmod 600 secret.key   # rw-------
chmod 700 .ssh/        # rwx------
chmod 777 temp/        # rwxrwxrwx (avoid!)
```

Common permissions:

| Numeric | Symbolic | Use Case |
|---|---|---|
| `644` | `rw-r--r--` | Regular files |
| `755` | `rwxr-xr-x` | Scripts, directories |
| `600` | `rw-------` | Private keys, secrets |
| `700` | `rwx------` | `.ssh/` directory |
| `400` | `r--------` | SSH keys |

### Symbolic

```bash
chmod u+x script.sh      # Add execute for owner
chmod g+w file.txt        # Add write for group
chmod o-r secret.key      # Remove read for others
chmod a+r public.html     # Add read for all
chmod u=rwx,g=rx,o= dir  # Set exact permissions
```

### Recursive

```bash
chmod -R 755 /var/www/html/
chmod -R u+rwX,g+rX,o+rX /var/www/  # X = execute only on directories
```

The capital `X` sets execute only on directories and files that already have execute — prevents making all files executable.

## chown (Change Owner)

```bash
chown app:app file.txt           # Change owner and group
chown app file.txt               # Change owner only
chown :www-data file.txt         # Change group only
chown -R app:app /opt/my-app/    # Recursive
```

## umask

Default permissions for new files:

```bash
umask
# 0022

# New files: 666 - 022 = 644 (rw-r--r--)
# New dirs:  777 - 022 = 755 (rwxr-xr-x)
```

```bash
# Set restrictive umask
umask 077
# New files: 600 (rw-------)
# New dirs:  700 (rwx------)

# Permanent: add to ~/.bashrc or /etc/profile
```

## Special Permissions

### SUID (Set User ID)

File executes as the file owner, not the user running it:

```bash
# Set SUID
chmod u+s /usr/bin/passwd
chmod 4755 /usr/bin/passwd

ls -la /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 Jan 17 10:00 /usr/bin/passwd
#    ^
#    s = SUID bit
```

`passwd` runs as root even when called by a normal user — that is how it can modify `/etc/shadow`.

### SGID (Set Group ID)

Files created in directory inherit the directory's group:

```bash
# Set SGID on directory
chmod g+s /opt/shared/
chmod 2775 /opt/shared/

ls -la /opt/
# drwxrwsr-x 2 root developers 4096 Jan 17 10:00 shared/
#       ^
#       s = SGID bit
```

Every file created in `/opt/shared/` belongs to group `developers`.

### Sticky Bit

Only the file owner can delete files in the directory:

```bash
chmod +t /tmp/
chmod 1777 /tmp/

ls -la /
# drwxrwxrwt 10 root root 4096 Jan 17 10:00 tmp/
#          ^
#          t = sticky bit
```

This is why you cannot delete other users' files in `/tmp/`.

## ACLs (Access Control Lists)

Fine-grained permissions beyond owner/group/other:

```bash
# Give specific user read access
setfacl -m u:alice:r config.yml

# Give specific group write access
setfacl -m g:developers:rw config.yml

# View ACLs
getfacl config.yml

# Default ACL (for new files in directory)
setfacl -d -m g:developers:rw /opt/shared/

# Remove ACL
setfacl -x u:alice config.yml

# Remove all ACLs
setfacl -b config.yml
```

```bash
getfacl config.yml
# file: config.yml
# owner: root
# group: root
# user::rw-
# user:alice:r--
# group::r--
# group:developers:rw-
# mask::rw-
# other::---
```

## Finding Permission Issues

```bash
# Find world-writable files
find / -perm -002 -type f 2>/dev/null

# Find SUID files
find / -perm -4000 -type f 2>/dev/null

# Find files owned by nobody
find / -nouser -type f 2>/dev/null

# Find files not owned by expected user
find /opt/my-app -not -user app -type f
```

## Common Mistakes

| Mistake | Why It's Bad | Fix |
|---|---|---|
| `chmod 777` | Everyone can read/write/execute | Use 755 for dirs, 644 for files |
| Root-owned app files | App can't write logs/data | `chown app:app` |
| Secret keys with 644 | Others can read your keys | `chmod 600` or `400` |
| Missing execute on dirs | Can't `cd` into directory | `chmod +x dir/` |
| Recursive chmod on files | Makes all files executable | Use `X` instead of `x` |

## What's Next?

Our **SELinux for System Admins** course covers mandatory access controls beyond standard Linux permissions. **Ansible Automation in 30 Minutes** teaches automating permission management. First lessons are free.
