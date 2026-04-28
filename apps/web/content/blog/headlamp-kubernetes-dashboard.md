---
title: "Headlamp Kubernetes Dashboard Guide"
date: "2026-02-28"
description: "Headlamp is a modern Kubernetes dashboard that replaces the official Kubernetes Dashboard. Learn how to install Headlamp, manage clusters, and extend it with plugins for team workflows."
category: "DevOps"
tags: ["headlamp", "kubernetes", "dashboard", "ui", "developer-experience", "cluster-management"]
---

The official Kubernetes Dashboard has not kept up with modern Kubernetes. Headlamp is a CNCF Sandbox project that provides a fast, extensible web UI for managing Kubernetes clusters.

## Why Not the Official Dashboard

The Kubernetes Dashboard:
- Requires complex RBAC setup for multi-user access
- Has limited CRD support
- No plugin system
- Slow development pace
- No multi-cluster support

Headlamp addresses all of these with a modern React-based UI, plugin architecture, and OIDC authentication out of the box.

## Installation

### In-Cluster

```bash
helm install headlamp headlamp/headlamp \
  --namespace headlamp --create-namespace \
  --set config.oidc.clientID=headlamp \
  --set config.oidc.issuerURL=https://dex.myorg.com \
  --set config.oidc.scopes="openid profile email groups"
```

### Desktop App

```bash
# macOS
brew install --cask headlamp

# Linux (Flatpak)
flatpak install flathub io.kinvolk.Headlamp
```

The desktop app connects to any cluster in your kubeconfig.

## Features

### Resource Management

Browse and manage all Kubernetes resources through a clean UI:

- Workloads: Deployments, StatefulSets, DaemonSets, Jobs, CronJobs
- Networking: Services, Ingresses, NetworkPolicies
- Config: ConfigMaps, Secrets, ResourceQuotas
- Storage: PersistentVolumes, PersistentVolumeClaims, StorageClasses
- RBAC: Roles, ClusterRoles, ServiceAccounts
- CRDs: Full support for custom resources

### Log Viewer

Stream pod logs with filtering:

```
[order-api-7d8f9] 2026-03-01T10:00:00Z INFO Processing order 12345
[order-api-7d8f9] 2026-03-01T10:00:01Z ERROR Payment timeout for order 12345
```

Filter by container, search text, and follow real-time logs.

### Terminal

Open a shell in any container directly from the UI — no `kubectl exec` needed.

### Multi-Cluster

Switch between clusters in the sidebar. Compare resources across clusters side by side.

## OIDC Authentication

```yaml
config:
  oidc:
    clientID: headlamp
    issuerURL: https://dex.myorg.com
    scopes: "openid profile email groups"
```

Users authenticate with your identity provider. RBAC is enforced by Kubernetes — Headlamp passes through the user's token.

## Plugins

Extend Headlamp with custom functionality:

```typescript
// my-plugin/src/index.tsx
import { registerAppBarAction } from "@kinvolk/headlamp-plugin/lib";

function CostButton() {
  return (
    <button onClick={() => window.open("/cost-dashboard")}>
      💰 Cost Report
    </button>
  );
}

registerAppBarAction(CostButton);
```

```bash
# Build and install plugin
npx @kinvolk/headlamp-plugin create my-plugin
cd my-plugin && npm run build
# Copy to Headlamp plugins directory
```

Plugin ideas:
- Cost dashboards (pull from Kubecost)
- Deployment status badges
- Custom resource editors
- Team-specific views

## Comparison

| Feature | Headlamp | K8s Dashboard | Lens | Rancher |
|---------|---------|--------------|------|---------|
| License | Apache 2.0 | Apache 2.0 | Proprietary | Apache 2.0 |
| Plugins | Yes | No | Extensions | No |
| CRD support | Full | Limited | Full | Full |
| Multi-cluster | Yes | No | Yes | Yes |
| OIDC | Built-in | Manual | Built-in | Built-in |
| Desktop app | Yes | No | Yes | No |
| CNCF | Sandbox | Official | No | Graduated |

## When to Use Headlamp

**Good fit:**
- Teams that want a visual Kubernetes UI without vendor lock-in
- Organizations needing OIDC-authenticated cluster access
- Platform teams building custom dashboards with plugins
- Developers who prefer a GUI over `kubectl` for exploration

**kubectl is still better for:**
- Scripting and automation
- Complex operations (rolling restarts, patch operations)
- Power users who think faster in the terminal

Headlamp does not replace `kubectl` — it complements it for visual exploration, onboarding, and team workflows.

---

Ready to go deeper? Master Kubernetes management with hands-on courses at [CopyPasteLearn](/courses).
