---
title: "Makefile for DevOps Automation"
slug: "makefile-devops-automation"
date: "2026-03-04"
category: "DevOps"
tags: ["Makefile", "Automation", "DevOps", "Developer Experience", "CLI"]
excerpt: "Use Makefiles as your project's command runner. Common targets for Docker, Terraform, testing, deployment, and team onboarding."
description: "Use Makefiles as your DevOps command runner. Targets for Docker builds, Terraform plans, test suites, and developer onboarding."
author: "Luca Berton"
---

Every project has commands nobody remembers. "How do I run tests?" "What's the deploy command?" A Makefile puts every project command in one place.

## Why Makefile?

- Available on every Unix system (no install needed)
- Self-documenting with `make help`
- Tab completion in most shells
- Works as a thin wrapper around any tooling

## Basic Structure

```makefile
.PHONY: help build test deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the application
	docker build -t my-app .

test: ## Run tests
	docker compose run --rm app npm test

deploy: ## Deploy to production
	kubectl apply -f k8s/
```

```bash
make help    # Shows all targets with descriptions
make build   # Builds Docker image
make test    # Runs tests
make deploy  # Deploys to Kubernetes
```

## Full DevOps Makefile

```makefile
.PHONY: help install dev build test lint format clean docker-build docker-push deploy rollback logs

# Variables
APP_NAME    := my-app
REGISTRY    := ghcr.io/my-org
VERSION     := $(shell git describe --tags --always --dirty)
ENVIRONMENT ?= staging

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Development ===

install: ## Install dependencies
	npm ci

dev: ## Start development server
	docker compose up -d
	npm run dev

clean: ## Clean build artifacts and containers
	rm -rf dist node_modules/.cache
	docker compose down -v

# === Quality ===

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

test: ## Run tests
	npm test

test-coverage: ## Run tests with coverage
	npm test -- --coverage

typecheck: ## Run TypeScript type checking
	npx tsc --noEmit

check: lint typecheck test ## Run all checks

# === Docker ===

docker-build: ## Build Docker image
	docker build -t $(REGISTRY)/$(APP_NAME):$(VERSION) .
	docker tag $(REGISTRY)/$(APP_NAME):$(VERSION) $(REGISTRY)/$(APP_NAME):latest

docker-push: docker-build ## Push Docker image
	docker push $(REGISTRY)/$(APP_NAME):$(VERSION)
	docker push $(REGISTRY)/$(APP_NAME):latest

# === Database ===

db-migrate: ## Run database migrations
	npx prisma migrate deploy

db-seed: ## Seed the database
	npx prisma db seed

db-reset: ## Reset database (DESTRUCTIVE)
	@echo "⚠️  This will delete all data. Press Ctrl+C to cancel."
	@sleep 3
	npx prisma migrate reset --force

db-studio: ## Open Prisma Studio
	npx prisma studio

# === Deployment ===

deploy: ## Deploy to current environment
	@echo "Deploying $(VERSION) to $(ENVIRONMENT)..."
	kubectl set image deployment/$(APP_NAME) \
		app=$(REGISTRY)/$(APP_NAME):$(VERSION) \
		-n $(ENVIRONMENT)
	kubectl rollout status deployment/$(APP_NAME) -n $(ENVIRONMENT)

deploy-staging: ## Deploy to staging
	ENVIRONMENT=staging $(MAKE) deploy

deploy-production: ## Deploy to production
	@echo "⚠️  Deploying to PRODUCTION. Press Ctrl+C to cancel."
	@sleep 5
	ENVIRONMENT=production $(MAKE) deploy

rollback: ## Rollback last deployment
	kubectl rollout undo deployment/$(APP_NAME) -n $(ENVIRONMENT)

# === Infrastructure ===

tf-init: ## Initialize Terraform
	cd terraform && terraform init

tf-plan: ## Plan Terraform changes
	cd terraform && terraform plan -out=plan.tfplan

tf-apply: ## Apply Terraform changes
	cd terraform && terraform apply plan.tfplan

tf-destroy: ## Destroy Terraform resources (DESTRUCTIVE)
	@echo "⚠️  This will destroy infrastructure. Press Ctrl+C to cancel."
	@sleep 5
	cd terraform && terraform destroy

# === Monitoring ===

logs: ## Tail application logs
	kubectl logs -f deployment/$(APP_NAME) -n $(ENVIRONMENT)

status: ## Show deployment status
	kubectl get pods -n $(ENVIRONMENT) -l app=$(APP_NAME)

metrics: ## Open Grafana dashboard
	@echo "Opening Grafana..."
	open http://localhost:3000

# === Onboarding ===

setup: install db-migrate db-seed ## Full project setup for new developers
	@echo "✅ Setup complete! Run 'make dev' to start."
```

## Terraform Makefile

```makefile
.PHONY: help init plan apply destroy

ENV ?= staging
TF_DIR := environments/$(ENV)

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

init: ## Initialize Terraform for environment
	cd $(TF_DIR) && terraform init

plan: ## Plan changes
	cd $(TF_DIR) && terraform plan -out=plan.tfplan

apply: ## Apply planned changes
	cd $(TF_DIR) && terraform apply plan.tfplan

destroy: ## Destroy infrastructure
	cd $(TF_DIR) && terraform destroy

validate: ## Validate configuration
	cd $(TF_DIR) && terraform validate

fmt: ## Format Terraform files
	terraform fmt -recursive

# Usage: make plan ENV=production
```

## Tips

### Default Target

```makefile
.DEFAULT_GOAL := help
```

### Confirmation Prompts

```makefile
confirm:
	@echo "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]

dangerous-action: confirm ## Do something dangerous
	rm -rf /important/data
```

### Colored Output

```makefile
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

deploy:
	@echo "$(GREEN)Deploying $(VERSION)...$(NC)"
```

## What's Next?

Our **Docker Fundamentals** and **Terraform for Beginners** courses use Makefiles for project automation throughout. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

