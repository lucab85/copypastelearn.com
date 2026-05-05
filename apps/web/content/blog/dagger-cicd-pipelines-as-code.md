---
title: "Dagger CI/CD Pipelines as Code"
date: "2026-04-08"
description: "Dagger lets you write CI/CD pipelines in real programming languages instead of YAML. Learn how Dagger works, how it compares to GitHub Actions, and when to adopt it."
category: "DevOps"
tags: ["dagger", "cicd", "pipelines", "DevOps", "Containers", "Automation"]
author: "Luca Berton"
---

YAML pipelines are configuration pretending to be code. Dagger lets you write CI/CD pipelines in actual programming languages — Go, Python, TypeScript — with type checking, IDE support, and local execution.

## The YAML Problem

Every CI system invented its own YAML dialect:

```yaml
# GitHub Actions
- run: echo "hello"
# GitLab CI
script: echo "hello"
# CircleCI
- run: echo "hello"
# Azure Pipelines
- script: echo "hello"
```

Same operation, four syntaxes. None of them have type checking, autocompletion, or debuggers. You test YAML pipelines by pushing commits and waiting.

## How Dagger Works

Dagger runs your pipeline inside containers, orchestrated by a GraphQL API. You write pipeline logic in a real language:

```python
# ci/main.py
import dagger

async def test():
    async with dagger.Connection() as client:
        src = client.host().directory(".")

        result = await (
            client.container()
            .from_("python:3.12")
            .with_directory("/app", src)
            .with_workdir("/app")
            .with_exec(["pip", "install", "-r", "requirements.txt"])
            .with_exec(["pytest", "tests/"])
            .stdout()
        )
        print(result)
```

```bash
# Run locally — same as CI
dagger run python ci/main.py
```

The pipeline runs identically on your laptop and in CI. No "push and pray."

## Dagger vs YAML Pipelines

| Feature | YAML Pipelines | Dagger |
|---------|---------------|--------|
| Language | YAML dialect | Go, Python, TS |
| Type checking | No | Yes |
| IDE support | Syntax highlighting only | Full (autocomplete, docs) |
| Local execution | Partial (act for GH Actions) | Full, identical to CI |
| Debugging | Print statements, re-run | Breakpoints, local execution |
| Vendor lock-in | High (CI-specific syntax) | Low (runs anywhere) |
| Caching | CI-specific | Content-addressed, automatic |

## Composable Pipelines

Dagger functions are composable. Build complex pipelines from reusable pieces:

```go
// ci/main.go
package main

import (
    "context"
    "dagger/ci/internal/dagger"
)

type Ci struct{}

func (c *Ci) Build(ctx context.Context, src *dagger.Directory) *dagger.Container {
    return dag.Container().
        From("golang:1.22").
        WithDirectory("/app", src).
        WithWorkdir("/app").
        WithExec([]string{"go", "build", "-o", "app", "."})
}

func (c *Ci) Test(ctx context.Context, src *dagger.Directory) (string, error) {
    return c.Build(ctx, src).
        WithExec([]string{"go", "test", "./..."}).
        Stdout(ctx)
}

func (c *Ci) Lint(ctx context.Context, src *dagger.Directory) (string, error) {
    return dag.Container().
        From("golangci/golangci-lint:latest").
        WithDirectory("/app", src).
        WithWorkdir("/app").
        WithExec([]string{"golangci-lint", "run"}).
        Stdout(ctx)
}
```

Call these functions from any CI system:

```yaml
# GitHub Actions — just calls Dagger
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dagger/dagger-for-github@v6
        with:
          verb: call
          args: test --src .
```

The pipeline logic lives in your repo, not in your CI provider's configuration.

## Content-Addressed Caching

Dagger caches every operation by its inputs. If the source code has not changed, `go build` uses the cached result. This works across runs and across machines — no manual cache key management.

## When to Adopt Dagger

**Good fit:**
- Teams frustrated with YAML pipeline debugging
- Organizations using multiple CI providers
- Complex pipelines with shared logic across repos
- Teams that want to test CI locally before pushing

**Not yet ideal:**
- Simple pipelines (10 lines of YAML is fine)
- Teams without Go/Python/TypeScript experience
- Organizations deeply invested in a single CI provider's ecosystem

Start by converting your most painful pipeline — the one with 500 lines of YAML and 20-minute debug cycles. That is where Dagger's value is most obvious.

---

Ready to go deeper? Learn CI/CD automation with hands-on courses at [CopyPasteLearn](/courses).
