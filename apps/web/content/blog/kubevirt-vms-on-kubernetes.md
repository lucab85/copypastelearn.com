---
title: "Kubevirt VMs on Kubernetes Guide"
date: "2026-03-12"
description: "KubeVirt runs virtual machines alongside containers on Kubernetes. Learn how to deploy VMs as pods, migrate legacy workloads, and manage hybrid container-VM environments."
category: "DevOps"
tags: ["kubevirt", "kubernetes", "virtual-machines", "Containers", "migration", "infrastructure"]
author: "Luca Berton"
---

Not everything runs in containers. Legacy applications, Windows workloads, kernel-dependent software, and compliance-mandated VMs still need virtual machines. KubeVirt lets you manage both VMs and containers with the same Kubernetes tools.

## How KubeVirt Works

KubeVirt adds a `VirtualMachine` CRD to Kubernetes. VMs run inside pods, managed by the same scheduler, networking, and storage systems as containers.

```
kubectl get pods     → shows containers AND VMs
kubectl get vms      → shows virtual machines
```

## Installation

```bash
# Install KubeVirt operator
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/latest/download/kubevirt-operator.yaml

# Install KubeVirt CR
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/latest/download/kubevirt-cr.yaml

# Wait for deployment
kubectl wait -n kubevirt kv kubevirt --for=condition=Available --timeout=5m

# Install virtctl CLI
kubectl krew install virt
```

## Create a Virtual Machine

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: ubuntu-vm
spec:
  running: true
  template:
    metadata:
      labels:
        app: ubuntu-vm
    spec:
      domain:
        devices:
          disks:
            - name: rootdisk
              disk:
                bus: virtio
            - name: cloudinit
              disk:
                bus: virtio
          interfaces:
            - name: default
              masquerade: {}
        resources:
          requests:
            memory: 2Gi
            cpu: "2"
      networks:
        - name: default
          pod: {}
      volumes:
        - name: rootdisk
          containerDisk:
            image: quay.io/containerdisks/ubuntu:22.04
        - name: cloudinit
          cloudInitNoCloud:
            userData: |
              #cloud-config
              password: changeme
              chpasswd:
                expire: false
              ssh_authorized_keys:
                - ssh-rsa AAAA...
```

```bash
kubectl apply -f ubuntu-vm.yaml

# Check VM status
kubectl get vms
# NAME        AGE   STATUS    READY
# ubuntu-vm   30s   Running   True

# Console access
virtctl console ubuntu-vm

# SSH access (via port-forward)
virtctl ssh ubuntu@ubuntu-vm
```

## Expose VM as a Service

VMs use standard Kubernetes networking:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ubuntu-vm-ssh
spec:
  selector:
    app: ubuntu-vm
  ports:
    - port: 22
      targetPort: 22
  type: ClusterIP
```

Other pods in the cluster access the VM via `ubuntu-vm-ssh:22`. LoadBalancer or Ingress work the same as for container services.

## Live Migration

Move a running VM between nodes without downtime:

```bash
# Migrate VM to another node
virtctl migrate ubuntu-vm

# Check migration status
kubectl get vmim
```

Useful for node maintenance: drain a node and VMs migrate automatically.

## Persistent Storage

```yaml
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: vm-data-pvc
```

VMs use the same PVCs as containers. Any CSI storage driver works.

## Use Cases

### Legacy Application Migration

Run Windows Server or older Linux applications that cannot be containerized:

```yaml
domain:
  resources:
    requests:
      memory: 4Gi
      cpu: "4"
  devices:
    disks:
      - name: windows
        disk:
          bus: sata
volumes:
  - name: windows
    persistentVolumeClaim:
      claimName: windows-server-disk
```

### Development Environments

Developers who need full OS environments (kernel modules, systemd, specific distros):

```bash
# Spin up a Fedora VM for testing
virtctl create vm --name test-fedora --image quay.io/containerdisks/fedora:39
```

### Hybrid Architectures

Frontend containers talk to VM-hosted legacy databases. Both managed by Kubernetes:

```
[Container: API Gateway] → [Container: Auth Service] → [VM: Oracle Database]
         ↓
[Container: Web Frontend]
```

All connected via Kubernetes networking. All deployed with `kubectl apply`.

## When to Use KubeVirt

**Good fit:**
- Migrating from VMware/OpenStack to Kubernetes gradually
- Running Windows workloads alongside Linux containers
- Applications requiring full OS (systemd, kernel modules)
- Organizations standardizing on Kubernetes for all workloads

**Not needed:**
- All workloads are already containerized
- You have a working VM platform (vSphere, Proxmox) with no migration plans
- Small-scale deployments where VMs on bare metal are simpler

KubeVirt is a migration tool. The end goal is containers, but KubeVirt bridges the gap for workloads that cannot be containerized yet.

---

Ready to go deeper? Master Kubernetes infrastructure with hands-on courses at [CopyPasteLearn](/courses).
