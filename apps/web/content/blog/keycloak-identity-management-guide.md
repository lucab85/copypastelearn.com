---
title: "Keycloak Identity Management Guide"
date: "2026-02-16"
description: "Keycloak provides SSO, OIDC, and SAML authentication for applications and APIs. Learn how to deploy Keycloak on Kubernetes, configure realms, and integrate with web apps and microservices."
category: "DevOps"
tags: ["keycloak", "authentication", "sso", "oidc", "identity", "kubernetes"]
---

Every application needs authentication. Building it yourself means password hashing, session management, MFA, social login, and SAML — each one a security risk. Keycloak handles all of it.

## Kubernetes Deployment

```bash
helm install keycloak bitnami/keycloak \
  --namespace auth --create-namespace \
  --set auth.adminUser=admin \
  --set auth.adminPassword=changeme \
  --set postgresql.enabled=true
```

## Core Concepts

```
Realm → Clients → Users → Roles → Groups
```

- **Realm**: A tenant (one per organization or environment)
- **Client**: An application that uses Keycloak for auth
- **User**: A person who logs in
- **Role**: A permission (admin, editor, viewer)
- **Group**: A collection of users with shared roles

## Configure a Web Application

### Create a Client

```json
{
  "clientId": "order-app",
  "protocol": "openid-connect",
  "publicClient": true,
  "redirectUris": ["https://orders.myorg.com/*"],
  "webOrigins": ["https://orders.myorg.com"],
  "standardFlowEnabled": true
}
```

### Integrate with React

```typescript
// keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://auth.myorg.com',
  realm: 'production',
  clientId: 'order-app',
});

export default keycloak;
```

```typescript
// App.tsx
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';

function App() {
  return (
    <ReactKeycloakProvider authClient={keycloak}>
      <Routes />
    </ReactKeycloakProvider>
  );
}
```

```typescript
// ProtectedPage.tsx
import { useKeycloak } from '@react-keycloak/web';

function OrdersPage() {
  const { keycloak } = useKeycloak();

  if (!keycloak.authenticated) {
    keycloak.login();
    return null;
  }

  return (
    <div>
      <p>Welcome, {keycloak.tokenParsed?.preferred_username}</p>
      <button onClick={() => keycloak.logout()}>Logout</button>
    </div>
  );
}
```

## API Protection

### Backend Verification

```typescript
// Express.js middleware
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://auth.myorg.com/realms/production/protocol/openid-connect/certs',
});

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const decoded = jwt.decode(token, { complete: true });
  const key = await client.getSigningKey(decoded.header.kid);

  jwt.verify(token, key.getPublicKey(), {
    issuer: 'https://auth.myorg.com/realms/production',
    audience: 'order-api',
  });

  req.user = jwt.decode(token);
  next();
}
```

### Role-Based Access

```typescript
function requireRole(role: string) {
  return (req, res, next) => {
    const roles = req.user?.realm_access?.roles || [];
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.delete('/api/orders/:id', requireRole('admin'), deleteOrder);
```

## Social Login

Add Google, GitHub, or Microsoft login:

```
Realm Settings → Identity Providers → Add Provider → Google
  Client ID: from Google Cloud Console
  Client Secret: from Google Cloud Console
```

Users see a "Sign in with Google" button alongside the username/password form.

## Multi-Factor Authentication

```
Realm Settings → Authentication → Flows → Browser
  → Add Execution → OTP Form
  → Set Requirement: Required
```

Every user must set up TOTP (Google Authenticator, Authy) after first login.

## SAML Integration

For enterprise SSO with legacy applications:

```
Clients → Create → Protocol: SAML
  Client ID: urn:myorg:legacy-app
  Master SAML Processing URL: https://legacy-app.myorg.com/saml/callback
```

Keycloak acts as both a SAML Identity Provider and an OIDC provider, bridging old and new applications.

## Keycloak vs Alternatives

| Feature | Keycloak | Auth0 | Clerk | Okta |
|---------|---------|-------|-------|------|
| Self-hosted | Yes | No | No | No |
| OIDC | Yes | Yes | Yes | Yes |
| SAML | Yes | Yes | No | Yes |
| Social login | Yes | Yes | Yes | Yes |
| MFA | Yes | Yes | Yes | Yes |
| Cost | Free | Per-user | Per-user | Per-user |
| Maintenance | You | Managed | Managed | Managed |

**Use Keycloak** when you need full control, SAML support, or cannot use cloud-hosted auth. **Use managed services** (Auth0, Clerk, Okta) when you want zero maintenance and can pay per-user.

---

Ready to go deeper? Master authentication and security with hands-on courses at [CopyPasteLearn](/courses).
