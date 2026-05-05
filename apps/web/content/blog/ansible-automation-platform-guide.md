---
title: "Ansible Automation Platform Guide"
slug: "ansible-automation-platform-guide"
date: "2026-04-02"
category: "DevOps"
tags: ["Ansible", "AAP", "Red Hat", "Automation Platform", "Enterprise"]
excerpt: "Understand Red Hat Ansible Automation Platform. Compare AAP vs open-source Ansible, learn about Controller, Hub, and EE architecture."
description: "Red Hat Ansible Automation Platform explained. Compare AAP vs open-source Ansible, learn Controller, Hub, and EE architecture."
author: "Luca Berton"
---

Red Hat Ansible Automation Platform (AAP) is the enterprise version of Ansible. If you are evaluating AAP for your organization or preparing for the Red Hat Certified Specialist exam, this guide covers what you need to know.

## AAP vs Open-Source Ansible

| Feature | Ansible (Open Source) | Ansible Automation Platform |
|---|---|---|
| **Cost** | Free | Subscription |
| **CLI automation** | Yes | Yes |
| **Web UI** | No (AWX community) | Automation Controller |
| **Content management** | Galaxy (community) | Private Automation Hub |
| **Execution environments** | Manual setup | Managed EE containers |
| **RBAC** | No | Yes |
| **Audit logging** | No | Yes |
| **Support** | Community | Red Hat support |
| **Certification** | No | RHCS exams |

**When to use AAP**: Teams larger than 5 people, compliance requirements, need for RBAC and audit trails, enterprise support.

**When open-source is enough**: Solo DevOps engineers, small teams, learning, personal projects.

## AAP Architecture

```
┌──────────────────────────────────────┐
│     Automation Controller (UI/API)   │
│     - Job scheduling and execution   │
│     - RBAC and credentials           │
│     - Workflow orchestration          │
├──────────────────────────────────────┤
│     Private Automation Hub           │
│     - Curated content collections    │
│     - Execution environment images   │
│     - Approval workflows             │
├──────────────────────────────────────┤
│     Execution Environments (EE)      │
│     - Container images with Ansible  │
│     - Collections pre-installed      │
│     - Reproducible runtime           │
├──────────────────────────────────────┤
│     Event-Driven Ansible             │
│     - React to events automatically  │
│     - Webhook triggers               │
│     - Rulebook-based automation      │
└──────────────────────────────────────┘
```

## Automation Controller

Formerly Ansible Tower. The control plane for running automation at scale.

Key features:
- **Job Templates**: Reusable definitions combining playbooks, inventory, and credentials
- **Workflows**: Chain multiple job templates with conditional logic
- **Schedules**: Run automation on cron-like schedules
- **RBAC**: Control who can run what on which inventory
- **Credentials**: Securely store SSH keys, cloud tokens, vault passwords
- **Notifications**: Slack, email, webhook alerts on job status

## Execution Environments

EEs replaced the old Python virtualenv approach. They are container images with everything Ansible needs:

Build a custom EE with `ansible-builder`:

```yaml
# execution-environment.yml
version: 3
dependencies:
  galaxy:
    collections:
      - name: amazon.aws
        version: ">=7.0.0"
      - name: community.general
      - name: ansible.posix
  python:
    - boto3>=1.34
    - botocore>=1.34
  system:
    - gcc
    - python3-devel

images:
  base_image:
    name: registry.redhat.io/ansible-automation-platform/ee-minimal-rhel9:latest
```

Build:

```bash
ansible-builder build -t my-custom-ee:1.0 -f execution-environment.yml
```

**Why EEs matter**: Every job runs in the same container image — no more "it worked on my machine" for Ansible.

## Private Automation Hub

Your organization's curated content repository:

- **Collections**: Approved Ansible collections (curated subset of Galaxy)
- **EE images**: Pre-built execution environments
- **Approval workflow**: Content goes through review before availability
- **Sync from Galaxy**: Pull community content, review, then publish internally

## Event-Driven Ansible

React to events in real time:

```yaml
# rulebook.yml
---
- name: Respond to webhook events
  hosts: all
  sources:
    - ansible.eda.webhook:
        host: 0.0.0.0
        port: 5000

  rules:
    - name: Deploy on push
      condition: event.payload.ref == "refs/heads/main"
      action:
        run_job_template:
          name: "Deploy to Production"
          organization: "DevOps"

    - name: Scale on high CPU
      condition: event.payload.metric == "cpu" and event.payload.value > 80
      action:
        run_playbook:
          name: scale-up.yml
```

## Learning Path

1. **Start with open-source Ansible** — learn playbooks, roles, and modules
2. **Understand collections** — the packaging format for Ansible content
3. **Learn execution environments** — the containerized runtime
4. **Explore AWX** — the free upstream of Automation Controller
5. **Study for RHCS** — Red Hat Certified Specialist in Ansible Automation

## What's Next?

Start with our free **Ansible Automation in 30 Minutes** course to build a solid Ansible foundation, then explore AAP concepts with confidence.

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

