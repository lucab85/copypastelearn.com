---
title: "Linux Disk Management LVM Guide"
slug: "linux-disk-management-lvm-guide"
date: "2026-01-06"
category: "DevOps"
tags: ["Linux", "LVM", "Disk", "Storage", "System Administration"]
excerpt: "Manage Linux disks with LVM. Physical volumes, volume groups, logical volumes, resizing, snapshots, and storage troubleshooting."
description: "Manage Linux disks with LVM. Physical volumes, volume groups, logical volumes, online resizing, snapshots, and migration strategies."
---

LVM (Logical Volume Manager) adds flexibility between physical disks and filesystems. Resize volumes, add disks, and take snapshots without downtime.

## LVM Architecture

```
Physical Disks:  /dev/sda   /dev/sdb   /dev/sdc
                    ↓          ↓          ↓
Physical Volumes: PV1        PV2        PV3
                    ↓          ↓          ↓
Volume Group:    ←─── vg_data ────────────→
                    ↓          ↓
Logical Volumes: lv_app     lv_db
                    ↓          ↓
Filesystems:     /opt/app   /var/lib/postgres
```

## Basic Workflow

### 1. Create Physical Volumes

```bash
# Partition the disk (or use whole disk)
sudo pvcreate /dev/sdb
sudo pvcreate /dev/sdc

# Verify
sudo pvs
sudo pvdisplay
```

### 2. Create Volume Group

```bash
sudo vgcreate vg_data /dev/sdb /dev/sdc

# Verify
sudo vgs
sudo vgdisplay vg_data
```

### 3. Create Logical Volumes

```bash
# Fixed size
sudo lvcreate -L 50G -n lv_app vg_data

# Percentage of free space
sudo lvcreate -l 80%FREE -n lv_db vg_data

# All remaining space
sudo lvcreate -l 100%FREE -n lv_logs vg_data

# Verify
sudo lvs
sudo lvdisplay
```

### 4. Create Filesystem and Mount

```bash
sudo mkfs.ext4 /dev/vg_data/lv_app
sudo mkfs.xfs /dev/vg_data/lv_db

sudo mkdir -p /opt/app /var/lib/postgres

sudo mount /dev/vg_data/lv_app /opt/app
sudo mount /dev/vg_data/lv_db /var/lib/postgres

# Persistent mount
echo '/dev/vg_data/lv_app /opt/app ext4 defaults 0 2' | sudo tee -a /etc/fstab
echo '/dev/vg_data/lv_db /var/lib/postgres xfs defaults 0 2' | sudo tee -a /etc/fstab
```

## Resizing

### Extend Logical Volume

```bash
# Add 20GB
sudo lvextend -L +20G /dev/vg_data/lv_app

# Extend to specific size
sudo lvextend -L 100G /dev/vg_data/lv_app

# Use all free space
sudo lvextend -l +100%FREE /dev/vg_data/lv_app

# Resize filesystem to match
sudo resize2fs /dev/vg_data/lv_app    # ext4
sudo xfs_growfs /opt/app               # xfs (mounted path)

# Or do both at once
sudo lvextend -L +20G --resizefs /dev/vg_data/lv_app
```

**ext4** can grow online (while mounted). **xfs** can only grow, never shrink.

### Add a New Disk

```bash
# Add physical volume
sudo pvcreate /dev/sdd

# Extend volume group
sudo vgextend vg_data /dev/sdd

# Now extend logical volumes with the new space
sudo lvextend -l +100%FREE --resizefs /dev/vg_data/lv_app
```

### Shrink (ext4 only)

```bash
# Must unmount first!
sudo umount /opt/app

# Check filesystem
sudo e2fsck -f /dev/vg_data/lv_app

# Shrink filesystem first
sudo resize2fs /dev/vg_data/lv_app 30G

# Then shrink LV
sudo lvreduce -L 30G /dev/vg_data/lv_app

# Remount
sudo mount /dev/vg_data/lv_app /opt/app
```

## Snapshots

Point-in-time copy for backups:

```bash
# Create snapshot (needs free space in VG)
sudo lvcreate -L 5G -s -n lv_app_snap /dev/vg_data/lv_app

# Mount snapshot (read-only)
sudo mkdir /mnt/snap
sudo mount -o ro /dev/vg_data/lv_app_snap /mnt/snap

# Backup from snapshot
tar czf /backup/app-$(date +%Y%m%d).tar.gz /mnt/snap/

# Remove snapshot
sudo umount /mnt/snap
sudo lvremove /dev/vg_data/lv_app_snap
```

### Restore from Snapshot

```bash
# Merge snapshot back (restores to snapshot point)
sudo umount /opt/app
sudo lvconvert --merge /dev/vg_data/lv_app_snap
sudo mount /dev/vg_data/lv_app /opt/app
```

## Monitoring

```bash
# Overview
sudo pvs && sudo vgs && sudo lvs

# Detailed info
sudo pvdisplay
sudo vgdisplay
sudo lvdisplay

# Free space
sudo vgs -o +vg_free

# Disk usage
df -h

# Physical extent map
sudo pvs -o +pv_used
```

## Standard Disk Management (Without LVM)

```bash
# List disks
lsblk
fdisk -l

# Partition
sudo fdisk /dev/sdb
# or
sudo parted /dev/sdb

# Format
sudo mkfs.ext4 /dev/sdb1
sudo mkfs.xfs /dev/sdb1

# Mount
sudo mount /dev/sdb1 /mnt/data

# Check filesystem
sudo fsck /dev/sdb1        # ext4 (must be unmounted)
sudo xfs_repair /dev/sdb1  # xfs

# Disk health
sudo smartctl -a /dev/sda
```

## Troubleshooting

| Issue | Command | Fix |
|---|---|---|
| Disk full | `df -h` | Extend LV or clean up files |
| Inode exhaustion | `df -i` | Delete small files or resize |
| Slow disk I/O | `iostat -x 1` | Check for high `%util` or `await` |
| Bad blocks | `smartctl -a /dev/sda` | Replace disk |
| Can't extend LV | `vgs` | Add new PV to VG |
| Mount fails | `dmesg \| tail` | Check filesystem or fstab |

## What's Next?

Our **SELinux for System Admins** course covers Linux system administration fundamentals. **Docker Fundamentals** teaches container storage management. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

