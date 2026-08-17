---
title: "Dex Federated OIDC Provider Guide"
date: "2026-01-29"
description: "Dex is a federated OpenID Connect provider that integrates with LDAP, SAML, GitHub, and Google. Learn how to deploy Dex for Kubernetes authentication."
category: "DevOps"
tags: ["dex", "oidc", "authentication", "kubernetes", "sso", "identity"]
author: "Luca Berton"
---

Kubernetes API server supports OIDC. Your team uses GitHub for identity. Dex bridges the gap — it speaks OIDC to Kubernetes and authenticates users against GitHub, LDAP, Google, or any identity provider.

## Why Dex

```
Without Dex:
  User → Service Account token → kubectl (shared credentials, no audit)

With Dex:
  User → GitHub login → Dex → OIDC token → kubectl (personal identity, audited)
```

Every kubectl command is tied to a real person. RBAC works on actual identities instead of shared service accounts.

## Installation

```bash
helm install dex dex/dex \
  --namespace auth --create-namespace \
  --values dex-values.yaml
```

```yaml
# dex-values.yaml
config:
  issuer: https://dex.myorg.com
  
  storage:
    type: kubernetes
    config:
      inCluster: true
  
  connectors:
    - type: github
      id: github
      name: GitHub
      config:
        clientID: $GITHUB_CLIENT_ID
        clientSecret: $GITHUB_CLIENT_SECRET
        redirectURI: https://dex.myorg.com/callback
        orgs:
          - name: myorg
  
  staticClients:
    - id: kubernetes
      name: Kubernetes
      secret: kubernetes-client-secret
      redirectURIs:
        - http://localhost:8000
        - http://localhost:18000

  oauth2:
    skipApprovalScreen: true
```

## Configure Kubernetes API Server

```yaml
# kube-apiserver flags
--oidc-issuer-url=https://dex.myorg.com
--oidc-client-id=kubernetes
--oidc-username-claim=email
--oidc-groups-claim=groups
```

Now the API server validates OIDC tokens from Dex.

## User Login Flow

```bash
# Install kubelogin
brew install int128/kubelogin/kubelogin

# Configure kubectl
kubectl config set-credentials oidc \
  --exec-api-version=client.authentication.k8s.io/v1beta1 \
  --exec-command=kubectl \
  --exec-arg=oidc-login \
  --exec-arg=get-token \
  --exec-arg=--oidc-issuer-url=https://dex.myorg.com \
  --exec-arg=--oidc-client-id=kubernetes \
  --exec-arg=--oidc-client-secret=kubernetes-client-secret
```

```bash
kubectl get pods
# Browser opens → GitHub login → OIDC token returned → kubectl works
```

## RBAC with OIDC Groups

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: myorg-admins
subjects:
  - kind: Group
    name: "myorg:platform-team"  # GitHub team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developers
  namespace: staging
subjects:
  - kind: Group
    name: "myorg:developers"  # GitHub team
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

GitHub team membership controls Kubernetes access. Add someone to the `platform-team` on GitHub → they get cluster-admin. No kubeconfig distribution.

## Multiple Connectors

```yaml
connectors:
  # GitHub for developers
  - type: github
    id: github
    name: GitHub
    config:
      clientID: $GITHUB_CLIENT_ID
      clientSecret: $GITHUB_CLIENT_SECRET
      orgs:
        - name: myorg

  # LDAP for corporate users
  - type: ldap
    id: ldap
    name: Corporate LDAP
    config:
      host: ldap.myorg.com:636
      rootCA: /etc/dex/ldap-ca.pem
      bindDN: cn=dex,ou=service,dc=myorg,dc=com
      bindPW: $LDAP_BIND_PW
      userSearch:
        baseDN: ou=users,dc=myorg,dc=com
        filter: "(objectClass=person)"
        username: uid
        emailAttr: mail
      groupSearch:
        baseDN: ou=groups,dc=myorg,dc=com
        filter: "(objectClass=groupOfNames)"
        userMatchers:
          - userAttr: DN
            groupAttr: member
        nameAttr: cn

  # Google Workspace
  - type: google
    id: google
    name: Google
    config:
      clientID: $GOOGLE_CLIENT_ID
      clientSecret: $GOOGLE_CLIENT_SECRET
      redirectURI: https://dex.myorg.com/callback
```

Users choose their identity provider on the login screen.

## Dex for Other Tools

Dex is not just for Kubernetes:

```yaml
staticClients:
  - id: kubernetes
    name: Kubernetes
    secret: k8s-secret
    redirectURIs: ["http://localhost:8000"]
  
  - id: argocd
    name: Argo CD
    secret: argocd-secret
    redirectURIs: ["https://argocd.myorg.com/auth/callback"]
  
  - id: grafana
    name: Grafana
    secret: grafana-secret
    redirectURIs: ["https://grafana.myorg.com/login/generic_oauth"]
  
  - id: harbor
    name: Harbor
    secret: harbor-secret
    redirectURIs: ["https://registry.myorg.com/c/oidc/callback"]
```

One identity provider for your entire platform: Kubernetes, Argo CD, Grafana, Harbor — all using GitHub/LDAP/Google login.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Dex Federated OIDC Provider Guide as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to dex, oidc, authentication, kubernetes. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Dex Federated OIDC Provider Guide?

Use it when you need a practical, repeatable way to handle dex, oidc, authentication, kubernetes work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

