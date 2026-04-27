---
title: "Wasm on Kubernetes with Spin"
date: "2026-04-10"
description: "WebAssembly (Wasm) runs serverless functions on Kubernetes with sub-millisecond cold starts. Learn how Fermyon Spin and SpinKube bring Wasm workloads to your existing clusters."
category: "DevOps"
tags: ["webassembly", "wasm", "kubernetes", "spin", "serverless", "fermyon"]
---

Containers solved "works on my machine." WebAssembly solves "this container takes 5 seconds to cold start." Wasm binaries start in under a millisecond, use a fraction of the memory, and run in a sandbox stricter than containers.

## Why Wasm on Kubernetes

Containers package an entire OS userspace. A typical Node.js container is 200-900MB and takes 1-5 seconds to start.

A Wasm module packages just the application code. A typical Spin application is 1-10MB and starts in under 1 millisecond.

| Metric | Container | Wasm |
|--------|-----------|------|
| Image size | 200-900 MB | 1-10 MB |
| Cold start | 1-5 seconds | < 1 ms |
| Memory overhead | 50-200 MB per instance | 1-10 MB per instance |
| Isolation | Linux namespaces/cgroups | Wasm sandbox (no syscalls) |

For event-driven workloads, API handlers, and serverless functions, Wasm is a better fit than containers.

## Fermyon Spin

Spin is a framework for building Wasm serverless applications:

```bash
# Install Spin
curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash

# Create a new app
spin new -t http-rust my-api
cd my-api
```

```rust
// src/lib.rs
use spin_sdk::http::{IntoResponse, Request, Response};

#[spin_sdk::http_component]
fn handle_request(req: Request) -> anyhow::Result<impl IntoResponse> {
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"message": "hello from wasm"}"#)?)
}
```

```bash
# Build and run locally
spin build
spin up
# Listening on http://127.0.0.1:3000
```

Spin supports Rust, Go, Python, JavaScript/TypeScript, and C#. The developer experience is similar to writing a serverless function.

## SpinKube: Wasm on Kubernetes

SpinKube runs Spin applications as Kubernetes workloads using the `containerd-shim-spin` runtime:

```yaml
apiVersion: core.spinoperator.dev/v1alpha1
kind: SpinApp
metadata:
  name: my-api
spec:
  image: "ghcr.io/myorg/my-api:v1"
  replicas: 3
  executor: containerd-shim-spin
```

The Spin app runs alongside your existing containers in the same cluster. Kubernetes handles scheduling, scaling, and networking. The Wasm runtime handles execution.

```bash
# Install SpinKube operator
helm install spin-operator \
  oci://ghcr.io/spinkube/charts/spin-operator \
  --namespace spin-operator --create-namespace

# Deploy your Spin app
kubectl apply -f my-api.yaml
```

## When Wasm Replaces Containers

**API gateways and middleware**: Sub-millisecond startup means no cold start penalty. Every request hits a warm handler.

**Edge computing**: Small binary size and low memory footprint make Wasm ideal for edge nodes with limited resources.

**Event processors**: Functions that trigger on queue messages, webhooks, or schedules. Start instantly, process, exit.

**Plugin systems**: Wasm's sandbox model makes it safe to run untrusted code. Envoy, Istio, and many platforms use Wasm for extensibility.

## When Containers Are Still Better

**Long-running services**: Databases, message brokers, and stateful applications that start once and run forever do not benefit from fast cold starts.

**Full OS access**: Wasm runs in a sandbox. If you need filesystem access, network sockets, or system calls, containers give you more flexibility.

**Existing codebases**: Porting a large application to Wasm requires compilation support for your language and all dependencies. Not everything compiles to Wasm yet.

## The Hybrid Future

The practical architecture in 2026 is hybrid: containers for stateful services and legacy applications, Wasm for request handlers, event processors, and anything that benefits from instant scaling.

Kubernetes orchestrates both. The workload type determines the runtime, not the other way around.

---

Ready to go deeper? Learn container orchestration with hands-on courses at [CopyPasteLearn](/courses).
