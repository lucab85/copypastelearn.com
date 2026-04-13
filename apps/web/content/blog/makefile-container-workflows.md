---
title: "Makefile for Container Workflows"
slug: "makefile-container-workflows"
date: "2026-01-03"
category: "DevOps"
tags: ["Makefile", "Docker", "Containers", "Automation", "DevOps"]
excerpt: "Use Makefiles to simplify container workflows. Build, test, push, deploy targets with variables, conditionals, and multi-stage pipelines."
description: "Use Makefiles for container workflows. Build, test, push, deploy targets with variables and pipelines."
---

Makefiles wrap complex Docker and Kubernetes commands into simple targets. Instead of remembering `docker build --platform linux/amd64 -t registry.example.com/my-app:v2.1.0 .`, just run `make build`.

## Basic Container Makefile

```makefile
# Variables
APP_NAME := my-app
REGISTRY := ghcr.io/myorg
VERSION := $(shell git describe --tags --always --dirty)
IMAGE := $(REGISTRY)/$(APP_NAME):$(VERSION)
IMAGE_LATEST := $(REGISTRY)/$(APP_NAME):latest

.PHONY: build push run test clean

build:
	docker build -t $(IMAGE) -t $(IMAGE_LATEST) .

push: build
	docker push $(IMAGE)
	docker push $(IMAGE_LATEST)

run:
	docker run --rm -p 3000:3000 --env-file .env $(IMAGE)

test:
	docker run --rm $(IMAGE) npm test

clean:
	docker rmi $(IMAGE) $(IMAGE_LATEST) 2>/dev/null || true
```

```bash
make build            # Build image
make push             # Build + push
make run              # Run locally
make test             # Run tests in container
make VERSION=v1.0.0 push  # Override version
```

## Full Development Workflow

```makefile
APP_NAME := my-app
REGISTRY := ghcr.io/myorg
VERSION := $(shell git describe --tags --always --dirty)
IMAGE := $(REGISTRY)/$(APP_NAME):$(VERSION)
COMPOSE := docker compose

.PHONY: help dev up down logs build push deploy lint test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# --- Development ---

dev: ## Start development environment
	$(COMPOSE) up --build

up: ## Start services in background
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

logs: ## Tail logs
	$(COMPOSE) logs -f

# --- Build ---

build: ## Build Docker image
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg BUILD_DATE=$(shell date -u +%Y-%m-%dT%H:%M:%SZ) \
		-t $(IMAGE) \
		-t $(REGISTRY)/$(APP_NAME):latest \
		.

build-no-cache: ## Build without cache
	docker build --no-cache -t $(IMAGE) .

# --- Quality ---

lint: ## Run linters
	$(COMPOSE) run --rm api npm run lint

test: ## Run tests
	$(COMPOSE) run --rm api npm test

test-integration: up ## Run integration tests
	$(COMPOSE) run --rm api npm run test:integration
	$(COMPOSE) down

scan: build ## Scan image for vulnerabilities
	trivy image --severity HIGH,CRITICAL $(IMAGE)

# --- Release ---

push: build ## Push image to registry
	docker push $(IMAGE)
	docker push $(REGISTRY)/$(APP_NAME):latest

deploy: push ## Deploy to Kubernetes
	kubectl set image deployment/$(APP_NAME) $(APP_NAME)=$(IMAGE)
	kubectl rollout status deployment/$(APP_NAME)

rollback: ## Rollback last deployment
	kubectl rollout undo deployment/$(APP_NAME)

# --- Cleanup ---

clean: ## Remove containers and images
	$(COMPOSE) down -v --rmi local
	docker rmi $(IMAGE) 2>/dev/null || true

prune: ## Docker system prune
	docker system prune -af --volumes
```

```bash
make help    # List all targets with descriptions
make dev     # Start dev environment
make deploy  # Build, push, and deploy to K8s
```

## Multi-Platform Builds

```makefile
PLATFORMS := linux/amd64,linux/arm64

build-multi: ## Build multi-platform image
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(IMAGE) \
		-t $(REGISTRY)/$(APP_NAME):latest \
		--push \
		.

setup-buildx: ## Setup buildx builder
	docker buildx create --name multiarch --driver docker-container --use
	docker buildx inspect --bootstrap
```

## Environment-Based Targets

```makefile
ENV ?= development

ifeq ($(ENV),production)
  COMPOSE_FILE := docker-compose.yml -f docker-compose.prod.yml
  KUBECTL_CTX := production
else ifeq ($(ENV),staging)
  COMPOSE_FILE := docker-compose.yml -f docker-compose.staging.yml
  KUBECTL_CTX := staging
else
  COMPOSE_FILE := docker-compose.yml -f docker-compose.dev.yml
  KUBECTL_CTX := minikube
endif

COMPOSE := docker compose $(addprefix -f ,$(COMPOSE_FILE))

deploy:
	kubectl config use-context $(KUBECTL_CTX)
	kubectl set image deployment/$(APP_NAME) $(APP_NAME)=$(IMAGE)
```

```bash
make deploy ENV=staging
make deploy ENV=production
```

## Database Operations

```makefile
db-migrate: ## Run database migrations
	$(COMPOSE) run --rm api npm run migrate

db-seed: ## Seed database
	$(COMPOSE) run --rm api npm run seed

db-reset: ## Reset database
	$(COMPOSE) run --rm api npm run migrate:reset
	$(COMPOSE) run --rm api npm run seed

db-shell: ## Open database shell
	$(COMPOSE) exec postgres psql -U app -d myapp

db-backup: ## Backup database
	$(COMPOSE) exec postgres pg_dump -U app myapp | gzip > backups/db-$$(date +%Y%m%d).sql.gz
```

## Kubernetes Targets

```makefile
K8S_NAMESPACE ?= default

k8s-apply: ## Apply Kubernetes manifests
	kubectl apply -k k8s/overlays/$(ENV) -n $(K8S_NAMESPACE)

k8s-status: ## Check deployment status
	kubectl get pods,svc,ingress -n $(K8S_NAMESPACE) -l app=$(APP_NAME)

k8s-logs: ## Tail pod logs
	kubectl logs -f -l app=$(APP_NAME) -n $(K8S_NAMESPACE) --tail=100

k8s-shell: ## Open shell in running pod
	kubectl exec -it $$(kubectl get pod -l app=$(APP_NAME) -n $(K8S_NAMESPACE) -o jsonpath='{.items[0].metadata.name}') -n $(K8S_NAMESPACE) -- /bin/sh

k8s-port-forward: ## Forward local port to pod
	kubectl port-forward svc/$(APP_NAME) 3000:80 -n $(K8S_NAMESPACE)
```

## What's Next?

Our **Docker Fundamentals** course covers container build automation. **Terraform for Beginners** teaches infrastructure automation. First lessons are free.
