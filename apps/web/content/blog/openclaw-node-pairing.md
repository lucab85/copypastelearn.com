---
title: "OpenClaw Node Pairing Guide"
description: "Pair your phone or IoT devices with OpenClaw for camera access, location tracking, screen recording, and remote commands."
date: "2026-02-10"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "IoT", "Mobile"]
---

An OpenClaw agent usually lives somewhere you are not: a home server, a VM, a Raspberry Pi behind a router. That's fine for background automation, but it breaks down the moment the agent needs *you* — to approve a risky action, or to warn you something failed before you find out the hard way. Node pairing closes that gap: it attaches the agent to a device you actually carry, so it can push to you and, within limits you set, act through that device.

## Prerequisites

Before pairing a device, make sure you have:

- **OpenClaw already installed and running**, with a gateway reachable from the network the device will be on. Pairing attaches a node to an existing agent — it doesn't set one up.
- **A phone, tablet, or single-board computer.** Anything that can run the companion app works as a node.
- **Network reachability between the device and the gateway.** If the device is on a different network than the host (mobile data, a VPN, a NAT'd office network), confirm the gateway URL is reachable from there — the most common reason a pairing request never shows up as pending.
- **The ability to approve the pairing yourself**, since anyone who can approve one can attach a new device to the agent.

## What Is Node Pairing?

OpenClaw can pair with mobile devices and other nodes (computers, Raspberry Pis) to extend its capabilities beyond the host machine.

Conceptually, pairing is a two-sided handshake, not a one-way registration: the device has to prove it's the one you meant to add, not just announce itself. It generates a pairing request — by scanning a QR code the gateway shows, or entering a short-lived token — which sits in a pending queue until approved. That step stops any node that can merely reach your gateway URL from silently attaching itself. Once approved, the device gets a stable `node` identifier (`my-phone`, `front-door-pi`), and pairing becomes a one-time trust decision, not something repeated per action.

## Paired Node Capabilities

A paired node is closer to a remote peripheral than a notification target — the agent can *pull* from it (a photo, a location fix) as well as *push* to it (a notification, a command). Once paired, your agent can:
- **Take photos** with front/back camera
- **Record screen** activity
- **Get GPS location**
- **Send notifications** with custom sounds
- **Run commands** on the remote device
- **Record video clips**

What actually works depends on the device: a Pi with a camera module has no GPS to query; a phone restricts `run` under its own OS sandboxing. Pairing grants the *possibility* of a capability — the device's platform still gates what's allowed.

## Pairing a Device

Pairing mirrors the handshake above: the device initiates, you confirm.

### On the Device

Install the OpenClaw companion app and enter your gateway URL. This is the initiate step; until you approve the resulting request, the device has no access to anything.

### Approve the Pairing

```
nodes(action: "pending")  # See pairing requests
nodes(action: "approve", requestId: "abc123")
```

Check the request ID against the device you're actually holding. If one shows up that you didn't initiate, don't approve it — something else reached your gateway URL.

## Use Cases

The capabilities above matter once you have a concrete moment where "the agent asked my phone" beats "the agent logged it." A realistic version: a scheduled deploy fails while you're out. The agent sends a time-sensitive notification describing what broke; you reply "roll it back" from the notification; it runs the rollback and confirms with a passive notification seconds later — no keyboard required.

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

Priority exists because an agent generates far more events than you'd ever page yourself for, and each one could technically justify a notification. Send everything as `timeSensitive` and you learn to ignore your phone within a week, burying the one alert that mattered — the same alert-fatigue failure mode that plagues any paging system, human or agentic. Treat priority as a decision the agent has to justify, not a default: `timeSensitive` for things that need a response and can't wait (a failed deploy, an unrecognized pairing request), `active` for things worth seeing but not urgent, `passive` for anything you'd want logged but never pushed in front of you. If the agent keeps escalating routine events, fix that in `TOOLS.md` before it trains you to stop trusting the channel.

## Configuration

Store device details in `TOOLS.md`:

```markdown
### Nodes
- my-phone → iPhone 15, personal device
- front-door-pi → Raspberry Pi 4, camera module
- home-hub → Tablet in kitchen, smart home dashboard
```

## Security Considerations

Pairing a device is a different trust decision than installing an app on it: an app only does what you tell it, when you tell it, while a paired node can be queried or commanded by the agent on its own initiative. The real question isn't "do I trust this app" but "do I trust an autonomous process to hold standing access to my camera, location, and a command channel on this device."

- Pairing requires explicit approval
- Commands run with the paired device's user permissions
- Camera/location access follows device OS privacy settings
- All communication is encrypted
- You can revoke pairing at any time

Explicit approval is your only real gate — there's no secondary verification beyond checking the pending request against the device you're holding — so treat it like granting SSH access, not clicking through an OS permissions popup. Scope what a node is paired *for* rather than granting it everything: a Pi with a camera module needs `camera_snap`, not location or notification delivery. A compromised agent can only do as much damage through a node as that node's granted scope allows.

Know where revocation is before you need it, not while locked out of your phone at an airport. If a device is lost or stolen, the exposure isn't "someone has my phone," it's "someone has a phone the agent still trusts" until you revoke it — do that the moment it's out of your control, the same way you'd revoke an API key. Commands still run under the device's own OS permissions, so a stolen phone hands an attacker only whatever it was already allowed to do, not root on your agent. Encryption protects the pairing channel from eavesdropping; it does nothing once the device is in someone else's hands.

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Related guide

Related reading: [OpenClaw-driven CVE remediation with Ansible](https://lucaberton.com/blog/openclaw-agentic-automation-ansible-cve-remediation-red-hat-2026/) covers this in real-world detail.
