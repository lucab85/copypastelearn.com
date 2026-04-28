---
title: "Terraform Testing with Terratest"
date: "2026-01-27"
description: "Terratest lets you write automated tests for Terraform infrastructure using Go. Learn how to test Terraform modules, validate cloud resources, and integrate infrastructure tests into CI/CD."
category: "DevOps"
tags: ["terratest", "terraform", "testing", "infrastructure-testing", "go", "cicd"]
---

You write a Terraform module. You run `terraform plan`. It looks right. But does it actually create working infrastructure? Terratest deploys your Terraform, validates the result, and tears it down — automated infrastructure integration tests.

## How Terratest Works

```
Test starts → terraform init/apply → Validate resources → terraform destroy → Test ends
```

Terratest calls Terraform, waits for resources to be created, runs assertions against them, and cleans up.

## Basic Test

```go
// test/vpc_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestVpc(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "vpc_cidr":     "10.0.0.0/16",
            "environment":  "test",
            "subnet_count": 2,
        },
    }

    // Clean up after test
    defer terraform.Destroy(t, terraformOptions)

    // Deploy
    terraform.InitAndApply(t, terraformOptions)

    // Validate outputs
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)

    subnetIds := terraform.OutputList(t, terraformOptions, "subnet_ids")
    assert.Equal(t, 2, len(subnetIds))
}
```

```bash
cd test/
go test -v -timeout 30m
```

## HTTP Validation

Test that deployed infrastructure actually works:

```go
func TestWebServer(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/web-server",
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    // Get the public URL
    url := terraform.Output(t, terraformOptions, "url")

    // Validate HTTP response
    http_helper.HttpGetWithRetry(t, url, nil, 200, "Hello, World!", 30, 10*time.Second)
}
```

Terratest retries the HTTP request up to 30 times (infrastructure might take a moment to be ready).

## SSH Validation

```go
func TestSshAccess(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/bastion",
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    publicIp := terraform.Output(t, terraformOptions, "public_ip")
    keyPair := terraform.Output(t, terraformOptions, "private_key")

    host := ssh.Host{
        Hostname:    publicIp,
        SshUserName: "ubuntu",
        SshKeyPair:  &ssh.KeyPair{PrivateKey: keyPair},
    }

    // Run command over SSH
    output := ssh.CheckSshCommand(t, host, "echo 'Hello from $(hostname)'")
    assert.Contains(t, output, "Hello from")
}
```

## Testing Kubernetes Resources

```go
func TestKubernetesDeployment(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/k8s-app",
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    kubeconfig := terraform.Output(t, terraformOptions, "kubeconfig")

    options := k8s.NewKubectlOptions("", kubeconfig, "production")

    // Wait for deployment to be available
    k8s.WaitUntilDeploymentAvailable(t, options, "order-api", 30, 10*time.Second)

    // Validate pod count
    deployment := k8s.GetDeployment(t, options, "order-api")
    assert.Equal(t, int32(3), *deployment.Spec.Replicas)

    // Validate service
    service := k8s.GetService(t, options, "order-api")
    assert.Equal(t, int32(8080), service.Spec.Ports[0].Port)
}
```

## Test Structure

```
modules/
├── vpc/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── web-server/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
test/
├── vpc_test.go
├── web_server_test.go
├── go.mod
└── go.sum
```

## CI/CD Integration

```yaml
# GitHub Actions
jobs:
  infrastructure-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"
      - uses: hashicorp/setup-terraform@v3

      - name: Run Terratest
        working-directory: test/
        run: go test -v -timeout 30m -parallel 4
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Best Practices

**Use unique names**: Append random suffixes to avoid collisions between parallel tests:

```go
uniqueId := random.UniqueId()
terraformOptions := &terraform.Options{
    Vars: map[string]interface{}{
        "name": fmt.Sprintf("test-%s", uniqueId),
    },
}
```

**Run tests in parallel**: Each test deploys independently:

```go
func TestVpc(t *testing.T)       { t.Parallel(); /* ... */ }
func TestWebServer(t *testing.T) { t.Parallel(); /* ... */ }
```

**Set timeouts**: Infrastructure takes time:

```bash
go test -v -timeout 30m
```

**Always defer destroy**: Even if assertions fail, cleanup runs:

```go
defer terraform.Destroy(t, terraformOptions)
```

---

Ready to go deeper? Master Terraform testing with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
