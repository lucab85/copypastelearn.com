---
title: "OpenClaw Node Pairing: Control Phones and IoT Devices"
description: "Pair your phone or IoT devices with OpenClaw for camera access, location tracking, screen recording, and remote commands."
date: "2026-02-10"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "IoT", "Mobile"]
---

## What Is Node Pairing?

OpenClaw can pair with mobile devices and other nodes (computers, Raspberry Pis) to extend its capabilities beyond the host machine.

## Paired Node Capabilities

Once paired, your agent can:
- **Take photos** with front/back camera
- **Record screen** activity
- **Get GPS location**
- **Send notifications** with custom sounds
- **Run commands** on the remote device
- **Record video clips**

## Pairing a Device

### On the Device

Install the OpenClaw companion app and enter your gateway URL.

### Approve the Pairing

```
nodes(action: "pending")  # See pairing requests
nodes(action: "approve", requestId: "abc123")
```

## Use Cases

### Security Camera

```
"Take a photo from the front door camera"

nodes(action: "camera_snap", 
  node: "front-door-pi",
  facing: "back")
```

### Find My Phone

```
"Where's my phone?"

nodes(action: "location_get",
  node: "my-iphone")
```

### Smart Home Control

```
"Take a screenshot of the smart home dashboard"

nodes(action: "screen_record",
  node: "home-hub",
  durationMs: 1000)
```

### Remote Monitoring

```
"Check the server room temperature"

nodes(action: "run",
  node: "server-room-pi",
  command: ["cat", "/sys/class/thermal/thermal_zone0/temp"])
```

## Notification System

Send push notifications to paired devices:

```
nodes(action: "notify",
  node: "my-phone",
  title: "Deployment Complete",
  body: "CopyPasteLearn v2.1 is live!",
  priority: "timeSensitive")
```

### Priority Levels

- **passive** — silent delivery
- **active** — normal notification
- **timeSensitive** — breaks through Focus/DND

## Configuration

Store device details in `TOOLS.md`:

```markdown
### Nodes
- my-phone → iPhone 15, personal device
- front-door-pi → Raspberry Pi 4, camera module
- home-hub → Tablet in kitchen, smart home dashboard
```

## Security Considerations

- Pairing requires explicit approval
- Commands run with the paired device's user permissions
- Camera/location access follows device OS privacy settings
- All communication is encrypted
- You can revoke pairing at any time
