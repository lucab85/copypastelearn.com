---
title: "Falco Runtime Security Kubernetes"
date: "2026-04-03"
description: "Falco detects runtime threats in Kubernetes using eBPF. Learn how to set up Falco for container security monitoring, write custom rules, and integrate with your alerting pipeline."
category: "DevOps"
tags: ["falco", "kubernetes", "security", "runtime-security", "ebpf", "container-security"]
---

Static scanning catches known vulnerabilities before deployment. Falco catches unexpected behavior at runtime — a shell spawned inside a container, a binary downloaded from the internet, a sensitive file read that should not happen.

## What Falco Detects

Falco monitors system calls using eBPF and triggers alerts when behavior matches rules:

```
11:23:45.123456 Warning Shell spawned in container
  (container=web-app pod=order-api-7d8f9 shell=bash
   parent=node cmdline=bash -i user=root)

11:23:47.789012 Critical Sensitive file opened
  (container=web-app pod=order-api-7d8f9
   file=/etc/shadow user=root)
```

No agent inside the container. Falco runs on the host (or as a DaemonSet) and observes kernel-level events.

## Installation

```bash
# Helm install with eBPF driver
helm install falco falcosecurity/falco \
  --namespace falco --create-namespace \
  --set driver.kind=ebpf \
  --set falcosidekick.enabled=true \
  --set falcosidekick.config.slack.webhookurl="https://hooks.slack.com/..."
```

Falco runs as a DaemonSet — one pod per node, monitoring all containers on that node.

## Default Rules

Falco ships with rules that catch common attack patterns:

```yaml
# Built-in: detect shell in container
- rule: Terminal shell in container
  desc: A shell was spawned in a container
  condition: >
    spawned_process and container and
    proc.name in (bash, sh, zsh, dash) and
    not proc.pname in (cron, supervisord)
  output: >
    Shell spawned in container
    (container=%container.name pod=%k8s.pod.name
     shell=%proc.name parent=%proc.pname user=%user.name)
  priority: WARNING
  tags: [container, shell, mitre_execution]
```

Out of the box, Falco detects:
- Shells spawned in containers
- Sensitive file access (`/etc/shadow`, `/etc/passwd`)
- Outbound connections to known malicious IPs
- Binaries written to `/tmp` or `/dev/shm`
- Privilege escalation attempts
- Kubernetes API access from containers

## Custom Rules

Write rules specific to your application:

```yaml
# Alert if the order-api container reads AWS credentials
- rule: Order API accessing AWS credentials
  desc: The order-api should use IAM roles, not credential files
  condition: >
    open_read and container.name = "order-api" and
    fd.name startswith "/root/.aws" or
    fd.name startswith "/home/.aws"
  output: >
    AWS credentials accessed directly
    (pod=%k8s.pod.name file=%fd.name)
  priority: CRITICAL

# Alert on unexpected network connections
- rule: Database container outbound connection
  desc: Database containers should not make outbound connections
  condition: >
    outbound and container.name contains "postgres" and
    not fd.sip in (10.0.0.0/8)
  output: >
    Database container made outbound connection
    (pod=%k8s.pod.name dest=%fd.sip:%fd.sport)
  priority: CRITICAL
```

## Falcosidekick: Alert Routing

Falcosidekick forwards alerts to 50+ destinations:

```yaml
# falcosidekick config
config:
  slack:
    webhookurl: "https://hooks.slack.com/services/..."
    minimumpriority: warning
  pagerduty:
    routingkey: "your-routing-key"
    minimumpriority: critical
  elasticsearch:
    hostport: "https://es:9200"
    index: "falco-alerts"
```

Critical alerts go to PagerDuty. Warnings go to Slack. Everything goes to Elasticsearch for analysis.

## Response Automation

Combine Falco with Kubernetes to auto-respond to threats:

```yaml
# Falcosidekick can trigger Kubernetes actions
config:
  kubeless:
    function: "isolate-pod"
    namespace: "security"
```

When Falco detects a critical event, the function can:
- Add a NetworkPolicy to isolate the pod
- Scale the deployment to zero
- Capture a forensic snapshot
- Create an incident ticket

## What Falco Does Not Do

Falco is detection, not prevention. It tells you something happened — it does not block it. For prevention, combine with:

- **Pod Security Standards** — prevent privileged containers
- **Network Policies** — restrict traffic at the network level
- **OPA/Gatekeeper** — enforce policies at admission time
- **Seccomp profiles** — restrict system calls at the kernel level

Falco is your last line of defense: when prevention fails, detection catches it.

---

Ready to go deeper? Master container security with hands-on courses at [CopyPasteLearn](/courses).
