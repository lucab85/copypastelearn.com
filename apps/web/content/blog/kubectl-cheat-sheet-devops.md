---
title: "kubectl Cheat Sheet for DevOps"
description: "Essential kubectl commands for pods, deployments, services, logs, and debugging Kubernetes clusters. Copy-paste ready DevOps reference."
date: "2026-04-12"
author: "Luca Berton"
category: "DevOps"
tags: ["kubernetes", "kubectl", "Cheat Sheet", "DevOps", "Containers"]
excerpt: "Essential kubectl commands for pods, deployments, services, logs, and debugging. Copy-paste ready for daily use."
---

## Cluster Info

```bash
kubectl cluster-info
kubectl get nodes
kubectl get nodes -o wide
kubectl top nodes
```

## Pods

```bash
# List pods
kubectl get pods
kubectl get pods -A                    # All namespaces
kubectl get pods -o wide               # Show node and IP
kubectl get pods -w                    # Watch for changes

# Details
kubectl describe pod <pod>
kubectl get pod <pod> -o yaml

# Logs
kubectl logs <pod>
kubectl logs <pod> -f                  # Follow
kubectl logs <pod> --previous          # Previous crash
kubectl logs <pod> -c <container>      # Specific container

# Shell access
kubectl exec -it <pod> -- /bin/bash
kubectl exec -it <pod> -- /bin/sh      # Alpine/minimal images

# Delete
kubectl delete pod <pod>
kubectl delete pod <pod> --force       # Immediate kill
```

## Deployments

```bash
# List
kubectl get deployments
kubectl get deploy

# Create
kubectl create deployment nginx --image=nginx --replicas=3

# Scale
kubectl scale deployment nginx --replicas=5

# Update image
kubectl set image deployment/nginx nginx=nginx:1.25

# Rollout status
kubectl rollout status deployment/nginx
kubectl rollout history deployment/nginx
kubectl rollout undo deployment/nginx
kubectl rollout undo deployment/nginx --to-revision=2

# Restart all pods
kubectl rollout restart deployment/nginx
```

## Services

```bash
# List
kubectl get services
kubectl get svc

# Expose a deployment
kubectl expose deployment nginx --port=80 --type=ClusterIP
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Check endpoints
kubectl get endpoints <service>

# Port forward to local machine
kubectl port-forward svc/nginx 8080:80
kubectl port-forward pod/<pod> 8080:80
```

## Namespaces

```bash
# List
kubectl get namespaces

# Create
kubectl create namespace staging

# Set default namespace
kubectl config set-context --current --namespace=staging

# Run in specific namespace
kubectl get pods -n kube-system
```

## ConfigMaps and Secrets

```bash
# ConfigMap from literal
kubectl create configmap app-config \
  --from-literal=DB_HOST=db.example.com \
  --from-literal=DB_PORT=5432

# ConfigMap from file
kubectl create configmap app-config --from-file=config.yaml

# Secret
kubectl create secret generic db-creds \
  --from-literal=username=admin \
  --from-literal=password=secret123

# View secret (base64 decoded)
kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 -d
```

## Debugging

```bash
# Run a temporary debug pod
kubectl run debug --image=busybox --rm -it -- sh
kubectl run curl --image=curlimages/curl --rm -it -- sh

# Check events
kubectl get events --sort-by='.lastTimestamp'
kubectl get events -n <namespace>

# Resource usage
kubectl top pods
kubectl top pods --sort-by=memory
kubectl top nodes

# DNS check
kubectl run dns --image=busybox --rm -it -- nslookup kubernetes.default
```

## Labels and Selectors

```bash
# Show labels
kubectl get pods --show-labels

# Filter by label
kubectl get pods -l app=nginx
kubectl get pods -l 'environment in (prod,staging)'

# Add label
kubectl label pod <pod> environment=prod

# Remove label
kubectl label pod <pod> environment-
```

## Apply and Delete

```bash
# Apply from file
kubectl apply -f deployment.yaml
kubectl apply -f ./manifests/           # Entire directory
kubectl apply -f https://example.com/manifest.yaml

# Delete
kubectl delete -f deployment.yaml
kubectl delete deployment nginx

# Dry run
kubectl apply -f deployment.yaml --dry-run=client
kubectl apply -f deployment.yaml --dry-run=server
```

## Output Formats

```bash
kubectl get pods -o json
kubectl get pods -o yaml
kubectl get pods -o wide
kubectl get pods -o name
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

## Related Posts

- [Kubernetes Pod Troubleshooting](/blog/kubernetes-pod-troubleshooting) for fixing broken pods
- [Local Kubernetes with Kind](/blog/local-kubernetes-kind-ml) for local development
- [MLflow on Kubernetes](/blog/mlflow-kubernetes-complete-guide) for ML workloads
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use kubectl Cheat Sheet for DevOps as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to kubernetes, kubectl, Cheat Sheet, DevOps. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use kubectl Cheat Sheet for DevOps?

Use it when you need a practical, repeatable way to handle kubernetes, kubectl, Cheat Sheet, DevOps work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

