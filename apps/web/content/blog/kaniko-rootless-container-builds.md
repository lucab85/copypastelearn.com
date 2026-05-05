---
title: "Kaniko Rootless Container Builds"
date: "2026-03-19"
description: "Kaniko builds container images inside Kubernetes without Docker daemon or root access. Learn how to use Kaniko in CI/CD pipelines, Tekton, and GitHub Actions for secure image builds."
category: "DevOps"
tags: ["kaniko", "Docker", "container-builds", "cicd", "kubernetes", "Security"]
author: "Luca Berton"
---

Building container images inside containers is a chicken-and-egg problem. Docker-in-Docker needs privileged access. Kaniko builds images from a Dockerfile without a Docker daemon and without root privileges.

## Why Kaniko

Traditional image builds in CI require one of:

- **Docker-in-Docker (DinD)**: Runs a Docker daemon inside a container. Requires `--privileged`, which gives full host access.
- **Docker socket mount**: Mounts `/var/run/docker.sock`. Any container with the socket can control all containers on the host.

Both are security risks. Kaniko executes Dockerfile commands in userspace — no daemon, no privileges, no socket.

## Basic Usage

```bash
# Run Kaniko as a container
docker run \
  -v $(pwd):/workspace \
  -v ~/.docker/config.json:/kaniko/.docker/config.json \
  gcr.io/kaniko-project/executor:latest \
  --dockerfile=/workspace/Dockerfile \
  --context=/workspace \
  --destination=ghcr.io/myorg/myapp:v1.0
```

## Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: build-myapp
spec:
  template:
    spec:
      containers:
        - name: kaniko
          image: gcr.io/kaniko-project/executor:latest
          args:
            - --dockerfile=Dockerfile
            - --context=git://github.com/myorg/myapp.git#refs/heads/main
            - --destination=ghcr.io/myorg/myapp:latest
            - --cache=true
            - --cache-repo=ghcr.io/myorg/myapp/cache
          volumeMounts:
            - name: docker-config
              mountPath: /kaniko/.docker/
      volumes:
        - name: docker-config
          secret:
            secretName: registry-credentials
      restartPolicy: Never
```

No privileged mode. No service account with elevated permissions. Just a regular pod that builds an image.

## Caching

Kaniko supports layer caching via a remote registry:

```bash
# First build: populates cache
--cache=true
--cache-repo=ghcr.io/myorg/myapp/cache

# Subsequent builds: reuses cached layers
# Only changed layers are rebuilt
```

Cache layers are stored as images in your registry. Builds that only change application code skip dependency installation entirely.

## GitHub Actions

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build with Kaniko
        uses: aevea/action-kaniko@master
        with:
          image: myorg/myapp
          tag: ${{ github.sha }}
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          cache: true
          cache_registry: ghcr.io/myorg/myapp/cache
```

## Tekton Integration

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: kaniko-build
spec:
  params:
    - name: IMAGE
      type: string
  workspaces:
    - name: source
    - name: docker-config
  steps:
    - name: build-and-push
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --dockerfile=$(workspaces.source.path)/Dockerfile
        - --context=$(workspaces.source.path)
        - --destination=$(params.IMAGE)
        - --cache=true
      env:
        - name: DOCKER_CONFIG
          value: $(workspaces.docker-config.path)
```

## Multi-Platform Builds

```bash
# Build for multiple architectures
--customPlatform=linux/amd64
--customPlatform=linux/arm64
```

Run separate Kaniko jobs per platform, then use `docker manifest` to create a multi-arch image.

## Kaniko vs Alternatives

| Tool | Daemon | Privileges | Speed | Caching |
|------|--------|-----------|-------|---------|
| Kaniko | No | None | Good | Registry-based |
| BuildKit | Optional | Rootless available | Fast | Local + registry |
| Buildah | No | Rootless | Good | Local |
| Docker | Yes | Root or socket | Fast | Local layer cache |

**Choose Kaniko** for Kubernetes-native builds where security is the priority. **Choose BuildKit** when build speed matters more and you can run rootless mode. **Choose Buildah** for non-Kubernetes environments that need rootless builds.

## Limitations

- **No `RUN --mount`**: Kaniko does not support BuildKit-specific Dockerfile syntax
- **Slower than BuildKit**: Userspace execution adds overhead
- **No interactive debugging**: Cannot shell into a failed build step
- **Single-platform per run**: Multi-arch requires multiple executions

For most CI/CD pipelines, these limitations are acceptable tradeoffs for the security benefits.

---

Ready to go deeper? Master Docker and container security with hands-on courses at [CopyPasteLearn](/courses/docker-fundamentals).
