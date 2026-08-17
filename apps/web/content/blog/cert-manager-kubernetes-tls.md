---
title: "Cert Manager Kubernetes TLS Guide"
date: "2026-03-11"
description: "Cert-manager automates TLS certificate management in Kubernetes with Let's Encrypt. Learn how to install cert-manager, configure issuers, and secure your."
category: "DevOps"
tags: ["cert-manager", "kubernetes", "tls", "lets-encrypt", "certificates", "Security"]
author: "Luca Berton"
---

Managing TLS certificates manually is tedious and error-prone. Cert-manager automates the entire lifecycle: request, validate, issue, and renew — all within Kubernetes.

## Installation

```bash
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true
```

## Configure a Let's Encrypt Issuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-production
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-production-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

For staging (higher rate limits, untrusted certs — good for testing):

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

## Automatic TLS on Ingress

Add one annotation and cert-manager handles everything:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-example-com-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 8080
```

Cert-manager:
1. Sees the annotation
2. Creates a Certificate resource
3. Solves the ACME HTTP-01 challenge
4. Stores the certificate in the `app-example-com-tls` Secret
5. Renews automatically before expiry (default: 30 days before)

## DNS-01 Challenge

For wildcard certificates or when HTTP-01 is not possible:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-dns
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-dns-key
    solvers:
      - dns01:
          cloudflare:
            email: admin@example.com
            apiTokenSecretRef:
              name: cloudflare-api-token
              key: api-token
```

```yaml
# Wildcard certificate
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-example-com
spec:
  secretName: wildcard-example-com-tls
  issuerRef:
    name: letsencrypt-dns
    kind: ClusterIssuer
  dnsNames:
    - "*.example.com"
    - "example.com"
```

## Certificate Resources

For certificates not tied to an Ingress:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-internal
  namespace: production
spec:
  secretName: api-internal-tls
  duration: 2160h    # 90 days
  renewBefore: 360h  # Renew 15 days before expiry
  issuerRef:
    name: letsencrypt-production
    kind: ClusterIssuer
  dnsNames:
    - api.internal.example.com
    - api-v2.internal.example.com
```

## Monitoring Certificates

```bash
# List all certificates
kubectl get certificates -A

# Check certificate status
kubectl describe certificate app-example-com -n production

# Check certificate expiry
kubectl get certificates -A -o custom-columns=\
  NAME:.metadata.name,\
  READY:.status.conditions[0].status,\
  EXPIRY:.status.notAfter
```

Alert on certificate issues:

```yaml
# Prometheus rule
- alert: CertManagerCertExpiringSoon
  expr: certmanager_certificate_expiration_timestamp_seconds - time() < 604800
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Certificate {{ $labels.name }} expires in less than 7 days"
```

## Troubleshooting

```bash
# Check certificate request status
kubectl get certificaterequests -A

# Check ACME orders
kubectl get orders -A

# Check ACME challenges
kubectl get challenges -A

# Common issues:
# - HTTP-01: Ingress not routing /.well-known/acme-challenge/
# - DNS-01: API token permissions insufficient
# - Rate limits: Too many certificates for the same domain
```

## Private CA

For internal services, use a self-signed CA:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: internal-ca
spec:
  ca:
    secretName: internal-ca-key
```

Internal mTLS certificates without external dependencies.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Cert Manager Kubernetes TLS Guide as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to cert-manager, kubernetes, tls, lets-encrypt. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Cert Manager Kubernetes TLS Guide?

Use it when you need a practical, repeatable way to handle cert-manager, kubernetes, tls, lets-encrypt work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

