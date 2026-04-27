---
title: "Tofu vs Terraform Comparison"
date: "2026-04-20"
description: "OpenTofu forked Terraform after the BSL license change. Compare features, compatibility, licensing, and ecosystem to decide which IaC tool fits your team in 2026."
category: "DevOps"
tags: ["opentofu", "terraform", "infrastructure-as-code", "iac", "hashicorp", "open-source"]
---

In August 2023, HashiCorp changed Terraform's license from MPL 2.0 to the Business Source License (BSL). OpenTofu forked Terraform in response, maintaining an open-source alternative under the Linux Foundation. Two years later, both tools are actively developed with diverging feature sets.

## License Difference

| | Terraform | OpenTofu |
|---|-----------|----------|
| License | BSL 1.1 | MPL 2.0 |
| Commercial use | Restricted (cannot compete with HashiCorp) | Unrestricted |
| Governance | HashiCorp (IBM) | Linux Foundation |
| Contribution model | HashiCorp-controlled | Community-driven |

If you build products that compete with HashiCorp's offerings, BSL restricts your use of Terraform. For most end users, the license difference does not affect daily operations.

## Feature Comparison (2026)

### State Encryption

OpenTofu added client-side state encryption in version 1.7. Your state file is encrypted before it reaches any backend — S3, GCS, or Consul. Terraform does not offer this natively. You rely on backend-level encryption (S3 SSE) which means the state is decrypted at rest in the backend.

```hcl
# OpenTofu state encryption
terraform {
  encryption {
    method "aes_gcm" "default" {
      keys = key_provider.pbkdf2.default
    }
    state {
      method = method.aes_gcm.default
    }
  }
}
```

### Provider-Defined Functions

Both support provider-defined functions as of 2026. The implementation is compatible — providers that define custom functions work with both tools.

### Testing Framework

Terraform introduced `terraform test` with HCL-based test files. OpenTofu adopted the same syntax for compatibility. Both support:

```hcl
# main.tftest.hcl
run "verify_vpc" {
  command = plan
  assert {
    condition     = aws_vpc.main.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR block mismatch"
  }
}
```

### Removed Block

OpenTofu added a `removed` block for safely removing resources from state without destroying them. Terraform added equivalent functionality shortly after.

## Compatibility

OpenTofu maintains backward compatibility with Terraform 1.5.x (the last MPL release). Most Terraform modules, providers, and state files work with OpenTofu without modification.

The tools are diverging over time. Features added after the fork may not be compatible in both directions. If you switch, test your full configuration.

## Migration

Switching from Terraform to OpenTofu:

```bash
# Install OpenTofu
brew install opentofu

# In your project directory
tofu init    # downloads providers
tofu plan    # verify everything works
```

State files are compatible. The migration is usually a tool swap with no infrastructure changes.

## Which Should You Choose

**Choose Terraform if:**
- You use Terraform Cloud/Enterprise
- Your organization has an existing HashiCorp relationship
- BSL does not affect your use case
- You want the larger ecosystem and community momentum

**Choose OpenTofu if:**
- Open-source licensing matters to your organization
- You need state encryption at the client level
- You build products in the infrastructure space
- You prefer Linux Foundation governance

For most teams running infrastructure as code, either tool works. The provider ecosystem is shared, the HCL syntax is identical, and the operational model is the same. Pick one and standardize.

---

Ready to go deeper? Master Terraform from scratch with our hands-on course at [CopyPasteLearn](/courses/terraform-beginners).
