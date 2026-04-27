---
title: "Kubebuilder Custom Operators Guide"
date: "2026-03-16"
description: "Kubebuilder scaffolds Kubernetes operators in Go. Learn how to create custom controllers, define CRDs, and build operators that automate complex application lifecycle management."
category: "DevOps"
tags: ["kubebuilder", "kubernetes", "operators", "crd", "go", "automation"]
---

Kubernetes operators extend the platform with custom automation. Instead of writing scripts that run `kubectl` commands, you teach Kubernetes how to manage your application by writing a controller that watches custom resources and reconciles desired state.

## What an Operator Does

A database operator example:

```yaml
apiVersion: database.example.com/v1
kind: PostgresCluster
metadata:
  name: orders-db
spec:
  version: "16"
  replicas: 3
  storage: 100Gi
  backup:
    schedule: "0 2 * * *"
    retention: 7d
```

Apply this YAML and the operator:
1. Creates a StatefulSet with 3 PostgreSQL pods
2. Configures streaming replication
3. Sets up automated backups on schedule
4. Handles failover when the primary dies
5. Manages version upgrades with zero downtime

You describe *what* you want. The operator handles *how*.

## Kubebuilder Setup

```bash
# Install Kubebuilder
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/

# Initialize project
mkdir my-operator && cd my-operator
kubebuilder init --domain example.com --repo github.com/myorg/my-operator

# Create an API (CRD + Controller)
kubebuilder create api --group webapp --version v1 --kind Application
```

This scaffolds:
- `api/v1/application_types.go` — your custom resource definition
- `internal/controller/application_controller.go` — your reconciliation logic
- Kubernetes manifests, RBAC, webhook config

## Define Your CRD

```go
// api/v1/application_types.go
type ApplicationSpec struct {
    // Image is the container image to deploy
    Image string `json:"image"`
    
    // Replicas is the desired number of pods
    // +kubebuilder:validation:Minimum=1
    // +kubebuilder:validation:Maximum=100
    Replicas int32 `json:"replicas"`
    
    // Port is the container port
    Port int32 `json:"port"`
}

type ApplicationStatus struct {
    // ReadyReplicas is the number of ready pods
    ReadyReplicas int32 `json:"readyReplicas"`
    
    // Conditions represent the latest observations
    Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Replicas",type=integer,JSONPath=`.spec.replicas`
// +kubebuilder:printcolumn:name="Ready",type=integer,JSONPath=`.status.readyReplicas`
type Application struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec              ApplicationSpec   `json:"spec,omitempty"`
    Status            ApplicationStatus `json:"status,omitempty"`
}
```

## Write the Controller

```go
// internal/controller/application_controller.go
func (r *ApplicationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)
    
    // Fetch the Application resource
    var app webappv1.Application
    if err := r.Get(ctx, req.NamespacedName, &app); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    
    // Create or update the Deployment
    deploy := &appsv1.Deployment{
        ObjectMeta: metav1.ObjectMeta{
            Name:      app.Name,
            Namespace: app.Namespace,
        },
    }
    
    _, err := ctrl.CreateOrUpdate(ctx, r.Client, deploy, func() error {
        deploy.Spec.Replicas = &app.Spec.Replicas
        deploy.Spec.Template.Spec.Containers = []corev1.Container{
            {
                Name:  "app",
                Image: app.Spec.Image,
                Ports: []corev1.ContainerPort{
                    {ContainerPort: app.Spec.Port},
                },
            },
        }
        return ctrl.SetControllerReference(&app, deploy, r.Scheme)
    })
    if err != nil {
        return ctrl.Result{}, err
    }
    
    // Update status
    app.Status.ReadyReplicas = deploy.Status.ReadyReplicas
    if err := r.Status().Update(ctx, &app); err != nil {
        return ctrl.Result{}, err
    }
    
    return ctrl.Result{}, nil
}
```

The controller watches `Application` resources and ensures a matching Deployment exists with the correct configuration.

## Build and Deploy

```bash
# Generate CRD manifests
make manifests

# Install CRDs in cluster
make install

# Build and push the operator image
make docker-build docker-push IMG=ghcr.io/myorg/my-operator:v0.1.0

# Deploy the operator
make deploy IMG=ghcr.io/myorg/my-operator:v0.1.0
```

## Use Your Operator

```yaml
apiVersion: webapp.example.com/v1
kind: Application
metadata:
  name: order-api
spec:
  image: ghcr.io/myorg/order-api:v2.1.0
  replicas: 3
  port: 8080
```

```bash
kubectl apply -f application.yaml
kubectl get applications
# NAME        REPLICAS   READY
# order-api   3          3
```

## When to Build an Operator

**Worth it:**
- Stateful applications (databases, message queues, caches)
- Complex lifecycle management (upgrades, backup, failover)
- Multi-component applications that must be coordinated
- Platform teams providing self-service infrastructure

**Not worth it:**
- Simple stateless deployments (use Helm or Kustomize)
- One-off automation (use a CronJob or script)
- Learning Kubernetes (understand built-in resources first)

---

Ready to go deeper? Master Kubernetes with hands-on courses at [CopyPasteLearn](/courses).
