---
title: "Cert Manager Kubernetes TLS Guide"
date: "2026-03-11"
description: "Cert-manager automates TLS certificate management in Kubernetes with Let's Encrypt. Learn how to install cert-manager, configure issuers, and secure your ingress with automatic certificate renewal."
category: "DevOps"
tags: ["cert-manager", "kubernetes", "tls", "lets-encrypt", "certificates", "security"]
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
