---
title: "Testkube Kubernetes Testing Guide"
date: "2026-03-09"
description: "Testkube runs tests natively on Kubernetes using any testing framework. Learn how to run integration tests, load tests, and API tests inside your cluster for accurate production-like results."
category: "DevOps"
tags: ["testkube", "kubernetes", "testing", "integration-testing", "load-testing", "cicd"]
---

Running integration tests against localhost does not catch the problems that matter. Network policies, DNS resolution, service mesh behavior, and resource constraints only surface in the real cluster. Testkube runs your tests inside Kubernetes.

## Why Test in Kubernetes

Your CI runner connects to a test database on localhost:5432. Everything passes. In production, the database is behind a NetworkPolicy, DNS resolves through CoreDNS, and connections go through a service mesh. Tests that pass locally fail in production.

Testkube eliminates this gap by executing tests as Kubernetes jobs inside the cluster.

## Installation

```bash
helm install testkube kubeshop/testkube \
  --namespace testkube --create-namespace
```

```bash
# Install CLI
brew install testkube
```

## Create and Run Tests

### From a Test File

```bash
# Upload a Postman collection
testkube create test \
  --name api-tests \
  --type postman/collection \
  --file tests/api-collection.json

# Run it
testkube run test api-tests
```

### From a Git Repository

```bash
testkube create test \
  --name integration-tests \
  --type pytest/test \
  --git-uri https://github.com/myorg/tests.git \
  --git-branch main \
  --git-path tests/integration/
```

### Supported Frameworks

| Framework | Type | Use Case |
|-----------|------|----------|
| Postman | API testing | REST/GraphQL endpoint validation |
| k6 | Load testing | Performance and stress tests |
| pytest | Integration | Python test suites |
| Jest | Unit/Integration | JavaScript/TypeScript tests |
| Cypress | E2E | Browser-based testing |
| curl | Smoke tests | Quick endpoint checks |
| Artillery | Load testing | Scenario-based load tests |
| JMeter | Load testing | Complex load scenarios |

## Load Testing with k6

```javascript
// k6-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://order-api.production.svc:8080/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

```bash
testkube create test \
  --name load-test \
  --type k6/script \
  --file k6-test.js

testkube run test load-test
```

The k6 test runs as a pod inside the cluster, hitting `order-api` through actual Kubernetes networking — not through an ingress or port-forward.

## Test Suites

Chain multiple tests together:

```yaml
apiVersion: tests.testkube.io/v3
kind: TestSuite
metadata:
  name: release-validation
  namespace: testkube
spec:
  steps:
    - execute:
        - test: smoke-tests
    - execute:
        - test: api-tests
        - test: integration-tests
    - execute:
        - test: load-test
```

Smoke tests run first. If they pass, API and integration tests run in parallel. Load tests run last.

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run Testkube tests
  uses: kubeshop/testkube-run-action@v1
  with:
    test: release-validation
    type: test-suite
    api-key: ${{ secrets.TESTKUBE_API_KEY }}
```

## Scheduled Tests

```bash
# Run load tests every night at 2 AM
testkube create test \
  --name nightly-load-test \
  --type k6/script \
  --file k6-test.js \
  --schedule "0 2 * * *"
```

## Test Results

```bash
# View results
testkube get execution <execution-id>

# View logs
testkube get execution <execution-id> --logs-only

# List recent executions
testkube get executions --test api-tests --limit 10
```

Testkube stores results and provides a dashboard for test history, pass/fail trends, and execution details.

## When to Use Testkube

**Good fit:**
- Integration tests that need access to cluster services
- Load tests against internal services (not through public endpoints)
- Smoke tests after deployment (post-deploy validation)
- Teams wanting to standardize test execution across frameworks

**Not needed:**
- Unit tests (run these in CI, not in the cluster)
- Tests that do not interact with Kubernetes services
- Small projects where `kubectl port-forward` + local tests are sufficient

---

Ready to go deeper? Master Kubernetes testing and CI/CD with hands-on courses at [CopyPasteLearn](/courses).
