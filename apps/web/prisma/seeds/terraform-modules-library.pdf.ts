/**
 * PDF generator for the "Terraform Modules Library" product.
 *
 * Produces a multi-section deliverable derived from production patterns
 * mined from terraformpilot.com tutorials: module anatomy, variables and
 * outputs, remote state with locking, workspaces vs stacks, versioning,
 * AWS / Azure / GCP module patterns, cross-cloud conventions, native
 * `terraform test`, CI/CD, lifecycle rules, and security. Re-runnable from
 * the commerce seed; bytes are uploaded to Vercel Blob as the current
 * ProductFile.
 */

import {
  drawBullets,
  drawCode,
  drawCover,
  drawHeading,
  drawParagraph,
  drawToc,
  initDoc,
  newPage,
} from "./_pdf-doc";

export async function generateTerraformModulesLibraryPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Terraform Modules Library",
    subject:
      "Production-grade Terraform module patterns: anatomy, state, AWS / Azure / GCP, testing, CI/CD, lifecycle, and security.",
    keywords: [
      "terraform",
      "opentofu",
      "iac",
      "aws",
      "gcp",
      "azure",
      "modules",
      "devops",
      "tflint",
      "tfsec",
    ],
    headerLeft: "Terraform Modules Library",
  });

  // --- Cover ---
  drawCover(ctx, {
    title: "Terraform Modules Library",
    subtitle:
      "Battle-tested module patterns for AWS, Azure, GCP, and OpenTofu",
    version: "1.2",
    releaseMonth: "May 2026",
  });

  // --- TOC ---
  newPage(ctx);
  drawToc(ctx, [
    "About this library",
    "Repository layout for a modules monorepo",
    "Module anatomy: required files",
    "Variables, locals, and outputs",
    "State and backends: S3+DynamoDB, AzureRM, GCS, OpenTofu encryption",
    "Workspaces vs stacks vs separate state",
    "Versioning, required_providers, semver",
    "AWS module patterns",
    "Azure module patterns",
    "GCP module patterns",
    "Cross-cloud: tagging, naming, IAM, OIDC federation",
    "Testing: validate, tflint, tfsec, terraform test",
    "CI/CD: GitHub Actions and GitLab pipelines",
    "Lifecycle rules and refactoring",
    "Security and secrets",
    "Common errors and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  // --- 1. About ---
  newPage(ctx);
  drawHeading(ctx, "1. About this library", 1);
  drawParagraph(
    ctx,
    "The Terraform Modules Library is the opinionated set of building blocks we use on real client engagements to ship cloud infrastructure on day one. It sits in the gap between raw provider documentation (which covers individual resources in isolation) and Terraform Registry marketplace modules (which rarely match your security baseline or naming standards).",
  );
  drawParagraph(
    ctx,
    "Every pattern below has been validated against Terraform 1.7 / 1.8 and OpenTofu 1.7+ in production on AWS, Azure, GCP, and DigitalOcean. The design pillars, in order: security by default, predictable interfaces, blast-radius isolation, and minimal cognitive load for the caller.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "A modules monorepo layout that scales from one team to many: per-module variables.tf, outputs.tf, versions.tf, examples/, and tests/.",
    "Reference modules across AWS (VPC, EKS, RDS, S3 hardening, IAM-OIDC), Azure (VNet, AKS, Key Vault, Storage), and GCP (VPC, GKE, Cloud SQL, Workload Identity).",
    "Remote state recipes for S3 + DynamoDB locking, AzureRM blob lease locking, GCS native locking, and OpenTofu state encryption.",
    "Native terraform test scenarios and tflint + tfsec / checkov pre-commit + CI templates.",
    "Plan-on-PR / manual-apply GitHub Actions and GitLab CI templates with environment gates.",
    "Lifecycle and refactor patterns including moved {} and removed {} blocks for safe renames and deletions.",
    "Security defaults: sensitive variables, OIDC for CI, no static credentials, encrypted state, and no plaintext secrets at rest.",
    "Lifetime updates while the library is maintained, delivered via /library.",
  ]);

  // --- 2. Repository layout ---
  newPage(ctx);
  drawHeading(ctx, "2. Repository layout for a modules monorepo", 1);
  drawParagraph(
    ctx,
    "One repository per provider family is fine, but a monorepo wins when modules share conventions and CI. Every module lives in its own directory with the same five files (main, variables, outputs, versions, README) plus examples/ and tests/.",
  );
  drawCode(
    ctx,
    [
      "modules/",
      "  README.md",
      "  CHANGELOG.md",
      "  .pre-commit-config.yaml",
      "  .tflint.hcl",
      "  aws/",
      "    vpc/",
      "      main.tf",
      "      variables.tf",
      "      outputs.tf",
      "      versions.tf",
      "      README.md",
      "      examples/",
      "        basic/",
      "          main.tf",
      "          outputs.tf",
      "      tests/",
      "        vpc_basic.tftest.hcl",
      "    eks/",
      "    rds/",
      "    s3/",
      "  azure/",
      "    vnet/",
      "    aks/",
      "    key-vault/",
      "    storage-account/",
      "  gcp/",
      "    vpc/",
      "    gke/",
      "    cloud-sql/",
      "    iam/",
      "  shared/",
      "    naming/",
      "    tags/",
      "  .github/workflows/",
      "    ci.yml",
    ].join("\n"),
  );
  drawHeading(ctx, "Layout rules", 3);
  drawBullets(ctx, [
    "One module per directory; one responsibility per module.",
    "examples/ is the source of truth for usage; every example must be a runnable root configuration.",
    "tests/ holds .tftest.hcl files run by the native terraform test framework.",
    "shared/ holds cross-module helper inputs (naming, tagging) - never resources.",
    "All modules expose the same conventional outputs (id, arn, name) so callers feel at home.",
  ]);

  // --- 3. Module anatomy ---
  newPage(ctx);
  drawHeading(ctx, "3. Module anatomy: required files", 1);
  drawParagraph(
    ctx,
    "A production module has five files. versions.tf declares constraints, never pins. variables.tf defines every input with a description and a validation block. main.tf uses 'this' as the primary resource name. outputs.tf exposes everything a caller might need. examples/basic/main.tf documents the minimum useful invocation.",
  );
  drawCode(
    ctx,
    [
      "# versions.tf - constraints only, no provider blocks",
      "terraform {",
      "  required_version = \">= 1.7\"",
      "  required_providers {",
      "    aws = {",
      "      source  = \"hashicorp/aws\"",
      "      version = \">= 5.40\"",
      "    }",
      "  }",
      "}",
      "",
      "# variables.tf",
      "variable \"vpc_cidr\" {",
      "  type        = string",
      "  description = \"CIDR block for the VPC.\"",
      "  validation {",
      "    condition     = can(cidrhost(var.vpc_cidr, 0))",
      "    error_message = \"vpc_cidr must be a valid CIDR block.\"",
      "  }",
      "}",
      "",
      "# main.tf",
      "resource \"aws_vpc\" \"this\" {",
      "  cidr_block           = var.vpc_cidr",
      "  enable_dns_hostnames = true",
      "  tags                 = merge(var.tags, { Name = var.name })",
      "}",
      "",
      "# outputs.tf",
      "output \"vpc_id\"  { value = aws_vpc.this.id }",
      "output \"vpc_arn\" { value = aws_vpc.this.arn }",
      "output \"vpc\" {",
      "  value       = aws_vpc.this",
      "  description = \"Full VPC resource for advanced callers.\"",
      "}",
      "",
      "# examples/basic/main.tf",
      "module \"vpc\" {",
      "  source   = \"../../\"",
      "  name     = \"demo\"",
      "  vpc_cidr = \"10.0.0.0/16\"",
      "  tags     = { Environment = \"dev\" }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "Anatomy rules", 3);
  drawBullets(ctx, [
    "Modules never contain provider {} blocks - the root configuration owns those.",
    "Validate every input that can be wrong (CIDRs, enums, ranges, lengths).",
    "Export both flat attributes (vpc_id) and the full resource object (vpc) - callers will thank you.",
    "Use 'this' as the canonical name for the primary resource; use descriptive names only when there is no primary.",
    "Every public input and output has a description; tflint will fail without it.",
  ]);

  // --- 4. Variables / locals / outputs ---
  newPage(ctx);
  drawHeading(ctx, "4. Variables, locals, and outputs", 1);
  drawParagraph(
    ctx,
    "Inputs flow through validation blocks; never expose a variable that lets the caller break the module. Use locals to compute derived values once and reuse them. Mark sensitive variables and outputs so they do not appear in plan / apply output.",
  );
  drawCode(
    ctx,
    [
      "variable \"environment\" {",
      "  type = string",
      "  validation {",
      "    condition     = contains([\"dev\", \"staging\", \"prod\"], var.environment)",
      "    error_message = \"environment must be one of dev, staging, prod.\"",
      "  }",
      "}",
      "",
      "variable \"db_password\" {",
      "  type      = string",
      "  sensitive = true",
      "  validation {",
      "    condition     = length(var.db_password) >= 16",
      "    error_message = \"db_password must be at least 16 characters.\"",
      "  }",
      "}",
      "",
      "locals {",
      "  name_prefix = \"${var.project}-${var.environment}\"",
      "  common_tags = merge(var.tags, {",
      "    Environment = var.environment",
      "    Project     = var.project",
      "    ManagedBy   = \"terraform\"",
      "  })",
      "}",
      "",
      "output \"vpc\" {",
      "  description = \"VPC details for downstream modules.\"",
      "  value = {",
      "    id              = aws_vpc.this.id",
      "    cidr            = aws_vpc.this.cidr_block",
      "    private_subnets = aws_subnet.private[*].id",
      "    public_subnets  = aws_subnet.public[*].id",
      "  }",
      "}",
      "",
      "output \"db_password\" {",
      "  value     = aws_db_instance.this.password",
      "  sensitive = true",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "When to use locals vs variables", 3);
  drawBullets(ctx, [
    "Locals: derived values reused 3+ times, string composition, conditionals; immutable per invocation.",
    "Variables: caller-supplied configuration that needs validation, defaults, and a description.",
    "Outputs: anything a downstream module or human reviewer might reasonably need; favour grouped objects over a long flat list.",
    "Mark every secret-bearing variable and output with sensitive = true; the value still flows, just stays out of logs.",
  ]);

  // --- 5. State / backends ---
  newPage(ctx);
  drawHeading(ctx, "5. State and backends: S3+DynamoDB, AzureRM, GCS, OpenTofu encryption", 1);
  drawParagraph(
    ctx,
    "Remote state with pessimistic locking is non-negotiable for team work. Each major cloud has a battle-tested combination: S3 + DynamoDB on AWS, Azure Blob with native blob-lease locking on Azure, and GCS with native object locking on GCP. OpenTofu 1.7+ adds end-to-end state encryption on top of any of them.",
  );
  drawCode(
    ctx,
    [
      "# S3 + DynamoDB (AWS)",
      "terraform {",
      "  backend \"s3\" {",
      "    bucket         = \"acme-tfstate-prod\"",
      "    key            = \"networking/terraform.tfstate\"",
      "    region         = \"eu-west-1\"",
      "    dynamodb_table = \"terraform-locks\"",
      "    encrypt        = true",
      "    kms_key_id     = \"alias/tfstate\"",
      "  }",
      "}",
      "",
      "# Azure Blob (lease locking is automatic)",
      "terraform {",
      "  backend \"azurerm\" {",
      "    resource_group_name  = \"tfstate-rg\"",
      "    storage_account_name = \"acmetfstate\"",
      "    container_name       = \"tfstate\"",
      "    key                  = \"prod/networking.tfstate\"",
      "  }",
      "}",
      "",
      "# GCS (object locking is automatic)",
      "terraform {",
      "  backend \"gcs\" {",
      "    bucket = \"acme-tfstate-prod\"",
      "    prefix = \"networking\"",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "OpenTofu state encryption", 3);
  drawCode(
    ctx,
    [
      "terraform {",
      "  encryption {",
      "    key_provider \"aws_kms\" \"team\" {",
      "      kms_key_id = \"arn:aws:kms:eu-west-1:111122223333:key/abcd\"",
      "      region     = \"eu-west-1\"",
      "      key_spec   = \"AES_256\"",
      "    }",
      "    method \"aes_gcm\" \"kms\" {",
      "      keys = key_provider.aws_kms.team",
      "    }",
      "    state {",
      "      method   = method.aes_gcm.kms",
      "      enforced = true",
      "    }",
      "    plan {",
      "      method   = method.aes_gcm.kms",
      "      enforced = true",
      "    }",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "State rules", 3);
  drawBullets(ctx, [
    "Enable versioning on every state bucket - it is the cheapest disaster-recovery insurance you will buy.",
    "Encrypt state at rest with a customer-managed key; rotate the key on a documented schedule.",
    "Split state by blast radius (per environment per component), not by team.",
    "Never commit .tfstate or .tfstate.backup to git; they contain plaintext secrets.",
    "force-unlock only after confirming there is no live apply; reach for it last, not first.",
  ]);

  // --- 6. Workspaces vs stacks ---
  newPage(ctx);
  drawHeading(ctx, "6. Workspaces vs stacks vs separate state", 1);
  drawParagraph(
    ctx,
    "Terraform workspaces share configuration across environments while keeping state files separate - convenient for one team running identical infrastructure. Separate state directories suit multi-team ownership. Terraform Stacks (HCP Terraform, 2025+) orchestrate several components together when dependencies are complex.",
  );
  drawCode(
    ctx,
    [
      "# Workspaces - same code, separate state per workspace",
      "terraform workspace new dev",
      "terraform workspace new staging",
      "terraform workspace new prod",
      "terraform workspace select prod",
      "terraform apply -var-file=envs/prod.tfvars",
      "",
      "# Separate state directories",
      "environments/",
      "  prod/",
      "    networking/   # owns network state",
      "    database/     # references networking outputs",
      "    compute/      # references both",
      "",
      "# HCP Terraform Stacks (.tfdeploy.hcl)",
      "component \"networking\" {",
      "  source = \"./components/networking\"",
      "  inputs = { region = \"eu-west-1\" }",
      "}",
      "",
      "component \"database\" {",
      "  source = \"./components/database\"",
      "  inputs = {",
      "    vpc_id     = component.networking.vpc_id",
      "    subnet_ids = component.networking.private_subnet_ids",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "Which to pick", 3);
  drawBullets(ctx, [
    "Workspaces: one team, identical architecture across environments, tight coupling acceptable.",
    "Separate state: multi-team ownership, clear component boundaries, blast-radius reduction.",
    "Stacks: 3+ components with non-trivial dependencies, coordinated apply/destroy required.",
    "Avoid mixing all three in the same repository - pick the model that matches your team topology and commit.",
  ]);

  // --- 7. Versioning / required_providers ---
  newPage(ctx);
  drawHeading(ctx, "7. Versioning, required_providers, and semver", 1);
  drawParagraph(
    ctx,
    "Modules declare floor versions for the providers they need; root configurations pin tightly for reproducible builds. Follow semver strictly: major for breaking input/output changes, minor for additive features, patch for bug fixes. Document every breaking change in CHANGELOG.md.",
  );
  drawCode(
    ctx,
    [
      "# Inside a module - permissive, no exact pins",
      "terraform {",
      "  required_version = \">= 1.7\"",
      "  required_providers {",
      "    aws = {",
      "      source  = \"hashicorp/aws\"",
      "      version = \">= 5.40\"",
      "    }",
      "    random = {",
      "      source  = \"hashicorp/random\"",
      "      version = \">= 3.6\"",
      "    }",
      "  }",
      "}",
      "",
      "# In a root configuration - pin tightly",
      "terraform {",
      "  required_version = \"~> 1.8.0\"",
      "  required_providers {",
      "    aws = {",
      "      source  = \"hashicorp/aws\"",
      "      version = \"~> 5.50\"",
      "    }",
      "  }",
      "}",
      "",
      "# Calling a module",
      "module \"vpc\" {",
      "  source  = \"acme/vpc/aws\"",
      "  version = \"~> 1.4\"  # 1.4.x and 1.5.x, never 2.0.0",
      "  # ...",
      "}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Use ~> in callers; use >= without an exact pin inside modules.",
    "Tag releases v1.2.0 in git; Terraform Registry resolves tags as module versions automatically.",
    "Maintain a CHANGELOG.md with sections for Added, Changed, Deprecated, Removed, Fixed, Security.",
    "Promise N and N-1 minor compatibility; deprecate at least one minor before removal.",
  ]);

  // --- 8. AWS ---
  newPage(ctx);
  drawHeading(ctx, "8. AWS module patterns", 1);
  drawHeading(ctx, "S3 hardening (the four-line rule)", 3);
  drawCode(
    ctx,
    [
      "resource \"aws_s3_bucket\" \"this\" {",
      "  bucket = local.bucket_name",
      "  tags   = local.common_tags",
      "}",
      "",
      "resource \"aws_s3_bucket_public_access_block\" \"this\" {",
      "  bucket                  = aws_s3_bucket.this.id",
      "  block_public_acls       = true",
      "  block_public_policy     = true",
      "  ignore_public_acls      = true",
      "  restrict_public_buckets = true",
      "}",
      "",
      "resource \"aws_s3_bucket_versioning\" \"this\" {",
      "  bucket = aws_s3_bucket.this.id",
      "  versioning_configuration { status = \"Enabled\" }",
      "}",
      "",
      "resource \"aws_s3_bucket_server_side_encryption_configuration\" \"this\" {",
      "  bucket = aws_s3_bucket.this.id",
      "  rule {",
      "    apply_server_side_encryption_by_default {",
      "      sse_algorithm     = \"aws:kms\"",
      "      kms_master_key_id = var.kms_key_arn",
      "    }",
      "    bucket_key_enabled = true",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "EKS cluster skeleton", 3);
  drawCode(
    ctx,
    [
      "resource \"aws_eks_cluster\" \"this\" {",
      "  name     = var.cluster_name",
      "  version  = var.kubernetes_version",
      "  role_arn = aws_iam_role.cluster.arn",
      "  vpc_config {",
      "    subnet_ids              = var.subnet_ids",
      "    endpoint_private_access = true",
      "    endpoint_public_access  = var.endpoint_public_access",
      "  }",
      "  enabled_cluster_log_types = [\"api\", \"audit\", \"authenticator\"]",
      "}",
      "",
      "resource \"aws_iam_openid_connect_provider\" \"eks\" {",
      "  client_id_list  = [\"sts.amazonaws.com\"]",
      "  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]",
      "  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "RDS hardening", 3);
  drawBullets(ctx, [
    "storage_encrypted = true with a customer-managed KMS key.",
    "backup_retention_period >= 7 days; skip_final_snapshot = false in prod.",
    "publicly_accessible = false; require IAM authentication where supported.",
    "Use db_subnet_group with private subnets only; never the default subnet group.",
    "Enable Performance Insights and enhanced monitoring; route logs to CloudWatch.",
  ]);

  // --- 9. Azure ---
  newPage(ctx);
  drawHeading(ctx, "9. Azure module patterns", 1);
  drawHeading(ctx, "VNet and subnets", 3);
  drawCode(
    ctx,
    [
      "resource \"azurerm_virtual_network\" \"this\" {",
      "  name                = local.vnet_name",
      "  resource_group_name = var.resource_group_name",
      "  location            = var.location",
      "  address_space       = [var.vnet_cidr]",
      "  tags                = local.common_tags",
      "}",
      "",
      "resource \"azurerm_subnet\" \"this\" {",
      "  for_each             = { for s in var.subnets : s.name => s }",
      "  name                 = each.value.name",
      "  resource_group_name  = var.resource_group_name",
      "  virtual_network_name = azurerm_virtual_network.this.name",
      "  address_prefixes     = [each.value.cidr]",
      "  service_endpoints    = each.value.service_endpoints",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "Key Vault hardening", 3);
  drawCode(
    ctx,
    [
      "resource \"azurerm_key_vault\" \"this\" {",
      "  name                          = local.kv_name",
      "  resource_group_name           = var.resource_group_name",
      "  location                      = var.location",
      "  tenant_id                     = data.azurerm_client_config.current.tenant_id",
      "  sku_name                      = \"standard\"",
      "  enable_rbac_authorization     = true",
      "  purge_protection_enabled      = true",
      "  soft_delete_retention_days    = 90",
      "  public_network_access_enabled = false",
      "  network_acls {",
      "    default_action = \"Deny\"",
      "    bypass         = \"AzureServices\"",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "Storage Account hardening", 3);
  drawBullets(ctx, [
    "https_traffic_only_enabled = true and min_tls_version = TLS1_2.",
    "shared_access_key_enabled = false; default_to_oauth_authentication = true.",
    "Enable customer-managed keys (azurerm_storage_account_customer_managed_key).",
    "Set blob soft delete (>=7 days) and container soft delete (>=7 days).",
    "Configure private endpoints; never rely on firewall IP allow-lists alone.",
  ]);

  // --- 10. GCP ---
  newPage(ctx);
  drawHeading(ctx, "10. GCP module patterns", 1);
  drawHeading(ctx, "VPC with Cloud NAT", 3);
  drawCode(
    ctx,
    [
      "resource \"google_compute_network\" \"this\" {",
      "  name                    = local.network_name",
      "  auto_create_subnetworks = false",
      "  routing_mode            = \"REGIONAL\"",
      "}",
      "",
      "resource \"google_compute_subnetwork\" \"private\" {",
      "  for_each      = { for s in var.private_subnets : s.name => s }",
      "  name          = each.value.name",
      "  network       = google_compute_network.this.id",
      "  region        = each.value.region",
      "  ip_cidr_range = each.value.cidr",
      "  private_ip_google_access = true",
      "  secondary_ip_range = [",
      "    { range_name = \"pods\",     ip_cidr_range = each.value.pods_cidr },",
      "    { range_name = \"services\", ip_cidr_range = each.value.svcs_cidr },",
      "  ]",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "GKE with Workload Identity", 3);
  drawCode(
    ctx,
    [
      "resource \"google_container_cluster\" \"this\" {",
      "  name     = var.cluster_name",
      "  location = var.region",
      "  network  = google_compute_network.this.id",
      "",
      "  remove_default_node_pool = true",
      "  initial_node_count       = 1",
      "",
      "  workload_identity_config {",
      "    workload_pool = \"${var.project_id}.svc.id.goog\"",
      "  }",
      "  enable_shielded_nodes = true",
      "  network_policy { enabled = true }",
      "  release_channel { channel = \"REGULAR\" }",
      "  private_cluster_config {",
      "    enable_private_nodes    = true",
      "    enable_private_endpoint = false",
      "    master_ipv4_cidr_block  = \"172.16.0.0/28\"",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "Cloud SQL hardening", 3);
  drawCode(
    ctx,
    [
      "resource \"google_sql_database_instance\" \"this\" {",
      "  name             = local.instance_name",
      "  database_version = \"POSTGRES_16\"",
      "  region           = var.region",
      "  settings {",
      "    tier              = var.tier",
      "    availability_type = \"REGIONAL\"",
      "    backup_configuration {",
      "      enabled                        = true",
      "      point_in_time_recovery_enabled = true",
      "      transaction_log_retention_days = 7",
      "    }",
      "    ip_configuration {",
      "      ipv4_enabled    = false",
      "      private_network = google_compute_network.this.id",
      "      require_ssl     = true",
      "    }",
      "  }",
      "  deletion_protection = true",
      "}",
    ].join("\n"),
  );

  // --- 11. Cross-cloud ---
  newPage(ctx);
  drawHeading(ctx, "11. Cross-cloud: tagging, naming, IAM, OIDC federation", 1);
  drawHeading(ctx, "Consistent tagging and naming", 3);
  drawCode(
    ctx,
    [
      "locals {",
      "  common_tags = {",
      "    Environment = var.environment",
      "    Owner       = var.owner",
      "    Project     = var.project",
      "    CostCenter  = var.cost_center",
      "    ManagedBy   = \"terraform\"",
      "  }",
      "",
      "  # Cloud-specific naming - Azure dislikes hyphens in many resources",
      "  name = {",
      "    aws   = \"${var.project}-${var.environment}-${var.component}\"",
      "    azure = lower(replace(\"${var.project}${var.environment}${var.component}\", \"-\", \"\"))",
      "    gcp   = \"${var.project}-${var.environment}-${var.component}\"",
      "  }",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "OIDC federation for CI (no static credentials)", 3);
  drawCode(
    ctx,
    [
      "# AWS: GitHub Actions assume role via OIDC",
      "resource \"aws_iam_openid_connect_provider\" \"github\" {",
      "  url             = \"https://token.actions.githubusercontent.com\"",
      "  client_id_list  = [\"sts.amazonaws.com\"]",
      "  thumbprint_list = [\"6938fd4d98bab03faadb97b34396831e3780aea1\"]",
      "}",
      "",
      "resource \"aws_iam_role\" \"github_actions\" {",
      "  name = \"github-actions-terraform\"",
      "  assume_role_policy = jsonencode({",
      "    Version = \"2012-10-17\"",
      "    Statement = [{",
      "      Effect    = \"Allow\"",
      "      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }",
      "      Action    = \"sts:AssumeRoleWithWebIdentity\"",
      "      Condition = {",
      "        StringEquals = {",
      "          \"token.actions.githubusercontent.com:aud\" = \"sts.amazonaws.com\"",
      "        }",
      "        StringLike = {",
      "          \"token.actions.githubusercontent.com:sub\" = \"repo:acme/*:ref:refs/heads/main\"",
      "        }",
      "      }",
      "    }]",
      "  })",
      "}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Standardise five tag keys: Environment, Owner, Project, CostCenter, ManagedBy. Everything else is optional.",
    "Adopt one naming pattern per cloud; encode the differences in locals, not in callers.",
    "Use OIDC everywhere: GitHub / GitLab to AWS, Azure, and GCP. Static credentials in CI are a 2018 antipattern.",
    "IAM least privilege: scope by resource ARN, never grant Action: \"*\" in a non-bootstrap role.",
  ]);

  // --- 12. Testing ---
  newPage(ctx);
  drawHeading(ctx, "12. Testing: validate, tflint, tfsec, terraform test", 1);
  drawParagraph(
    ctx,
    "terraform validate only checks syntax. The real testing stack starts there and stacks tflint (style, deprecations), tfsec or checkov (security), and the native terraform test framework (assertions on plan / apply). Reach for Terratest only when you need cross-resource Go logic.",
  );
  drawCode(
    ctx,
    [
      "# tests/vpc_basic.tftest.hcl",
      "variables {",
      "  name     = \"unit\"",
      "  vpc_cidr = \"10.0.0.0/16\"",
      "  tags     = { Environment = \"test\" }",
      "}",
      "",
      "run \"plan_succeeds\" {",
      "  command = plan",
      "  assert {",
      "    condition     = aws_vpc.this.cidr_block == \"10.0.0.0/16\"",
      "    error_message = \"CIDR did not flow through to the resource.\"",
      "  }",
      "}",
      "",
      "run \"validation_rejects_bad_cidr\" {",
      "  command   = plan",
      "  variables { vpc_cidr = \"not-a-cidr\" }",
      "  expect_failures = [var.vpc_cidr]",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, ".tflint.hcl", 3);
  drawCode(
    ctx,
    [
      "plugin \"aws\" {",
      "  enabled = true",
      "  version = \"0.30.0\"",
      "  source  = \"github.com/terraform-linters/tflint-ruleset-aws\"",
      "}",
      "",
      "rule \"terraform_required_version\"   { enabled = true }",
      "rule \"terraform_required_providers\" { enabled = true }",
      "rule \"terraform_naming_convention\"  { enabled = true }",
      "rule \"terraform_unused_declarations\"{ enabled = true }",
    ].join("\n"),
  );
  drawHeading(ctx, "Local commands", 3);
  drawCode(
    ctx,
    [
      "terraform fmt -recursive",
      "terraform validate",
      "tflint --recursive",
      "tfsec . --soft-fail=false",
      "terraform test",
    ].join("\n"),
  );

  // --- 13. CI/CD ---
  newPage(ctx);
  drawHeading(ctx, "13. CI/CD: GitHub Actions and GitLab pipelines", 1);
  drawHeading(ctx, ".github/workflows/terraform.yml", 3);
  drawCode(
    ctx,
    [
      "name: terraform",
      "on:",
      "  pull_request:",
      "    branches: [main]",
      "  push:",
      "    branches: [main]",
      "permissions:",
      "  id-token: write",
      "  contents: read",
      "  pull-requests: write",
      "jobs:",
      "  plan:",
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: aws-actions/configure-aws-credentials@v4",
      "        with:",
      "          role-to-assume: arn:aws:iam::111122223333:role/github-actions-terraform",
      "          aws-region: eu-west-1",
      "      - uses: hashicorp/setup-terraform@v3",
      "      - run: terraform fmt -check -recursive",
      "      - run: terraform init",
      "      - run: terraform validate",
      "      - run: terraform plan -out=tfplan -no-color | tee plan.txt",
      "      - uses: actions/upload-artifact@v4",
      "        with: { name: tfplan, path: tfplan }",
      "  apply:",
      "    needs: plan",
      "    if: github.ref == 'refs/heads/main' && github.event_name == 'push'",
      "    environment: production  # manual approval gate",
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/download-artifact@v4",
      "        with: { name: tfplan }",
      "      - uses: hashicorp/setup-terraform@v3",
      "      - run: terraform init",
      "      - run: terraform apply -input=false tfplan",
    ].join("\n"),
  );
  drawHeading(ctx, ".gitlab-ci.yml", 3);
  drawCode(
    ctx,
    [
      "stages: [plan, apply]",
      "image: hashicorp/terraform:1.8",
      "plan:",
      "  stage: plan",
      "  script:",
      "    - terraform init",
      "    - terraform fmt -check -recursive",
      "    - terraform validate",
      "    - terraform plan -out=plan.tfplan",
      "  artifacts:",
      "    paths: [plan.tfplan]",
      "  rules:",
      "    - if: $CI_PIPELINE_SOURCE == \"merge_request_event\"",
      "    - if: $CI_COMMIT_BRANCH == \"main\"",
      "apply:",
      "  stage: apply",
      "  needs: [plan]",
      "  environment: production",
      "  script:",
      "    - terraform init",
      "    - terraform apply -input=false plan.tfplan",
      "  rules:",
      "    - if: $CI_COMMIT_BRANCH == \"main\"",
      "      when: manual",
    ].join("\n"),
  );

  // --- 14. Lifecycle ---
  newPage(ctx);
  drawHeading(ctx, "14. Lifecycle rules and refactoring", 1);
  drawParagraph(
    ctx,
    "Lifecycle blocks let you guard prod resources and reshape configurations without destroying state. moved {} renames cleanly; removed {} (Terraform 1.7+) drops a resource from state while leaving the cloud object untouched.",
  );
  drawCode(
    ctx,
    [
      "resource \"aws_db_instance\" \"prod\" {",
      "  identifier = \"acme-prod\"",
      "  lifecycle {",
      "    prevent_destroy = true",
      "  }",
      "}",
      "",
      "resource \"aws_launch_template\" \"app\" {",
      "  lifecycle {",
      "    create_before_destroy = true",
      "  }",
      "}",
      "",
      "resource \"aws_instance\" \"web\" {",
      "  lifecycle {",
      "    ignore_changes = [tags[\"LastDeployed\"], ami]",
      "  }",
      "}",
      "",
      "resource \"aws_instance\" \"app\" {",
      "  lifecycle {",
      "    replace_triggered_by = [aws_security_group.app.id]",
      "  }",
      "}",
      "",
      "# Refactor without destroy",
      "moved {",
      "  from = aws_instance.old_app",
      "  to   = module.app.aws_instance.web",
      "}",
      "",
      "# Drop from state but keep the cloud resource alive",
      "removed {",
      "  from = aws_s3_bucket.legacy_logs",
      "  lifecycle { destroy = false }",
      "}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "prevent_destroy: stateful prod resources (databases, KMS keys, S3 buckets with data).",
    "create_before_destroy: ASGs, launch templates, anything fronted by a load balancer.",
    "ignore_changes: attributes managed outside Terraform (auto-tags, drift-prone metadata).",
    "moved {}: renaming a resource or moving it into a module without a destroy/create cycle.",
    "removed {}: handing ownership to another team or another stack while leaving the resource running.",
  ]);

  // --- 15. Security ---
  newPage(ctx);
  drawHeading(ctx, "15. Security and secrets", 1);
  drawParagraph(
    ctx,
    "State files contain plaintext secrets - treat them as keys, not config. Never commit them. Use sensitive variables, fetch secrets from Vault / Key Vault / Secret Manager at runtime, and use OIDC for all CI credentials.",
  );
  drawCode(
    ctx,
    [
      "# Sensitive variable + Vault lookup",
      "variable \"db_password\" {",
      "  type      = string",
      "  sensitive = true",
      "}",
      "",
      "data \"vault_kv_secret_v2\" \"db\" {",
      "  mount = \"secret\"",
      "  name  = \"prod/database\"",
      "}",
      "",
      "module \"rds\" {",
      "  source       = \"../../modules/aws/rds\"",
      "  db_password  = data.vault_kv_secret_v2.db.data[\"password\"]",
      "}",
      "",
      "# OIDC providers (no static credentials)",
      "provider \"aws\" {",
      "  region = \"eu-west-1\"",
      "  assume_role {",
      "    role_arn     = \"arn:aws:iam::111122223333:role/TerraformCI\"",
      "    session_name = \"github-actions\"",
      "  }",
      "}",
      "",
      "provider \"azurerm\" {",
      "  use_oidc = true",
      "  features {}",
      "}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Add *.tfstate, *.tfstate.backup, .terraform/, *.tfplan to .gitignore.",
    "Mark every secret-bearing variable AND every output that exposes a secret with sensitive = true.",
    "Use OIDC for AWS, Azure, GCP from GitHub / GitLab; rotate the trust policy quarterly.",
    "Scan every PR with tfsec or checkov; gate merges on a clean SARIF report.",
    "Encrypt state at rest with a customer-managed key; turn on bucket versioning for recovery.",
  ]);

  // --- 16. Common errors ---
  newPage(ctx);
  drawHeading(ctx, "16. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "\"Error acquiring the state lock\": another apply is in progress; wait, or terraform force-unlock LOCK_ID after confirming nothing is running.",
    "\"Backend configuration changed\": run terraform init -reconfigure (or -migrate-state when truly moving state).",
    "\"Failed to query available provider packages\": pin a known-good version in required_providers and re-run terraform init -upgrade.",
    "\"Resource already exists\": import it - terraform import aws_s3_bucket.this acme-logs - or use a moved {} block if it lives in state under another address.",
    "\"No valid credential sources found\": configure OIDC (preferred) or export AWS_PROFILE; never paste static keys into CI variables.",
    "\"Provider produced inconsistent result after apply\": usually a provider bug on a transient attribute; mark with ignore_changes and file an upstream issue.",
    "\"State snapshot was created by a newer version\": bump your local Terraform version (terraform version) to match the one used in CI.",
  ]);

  // --- 17. Versioning / support ---
  newPage(ctx);
  drawHeading(ctx, "17. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Modules follow semantic versioning, tagged in git as vMAJOR.MINOR.PATCH. Major bumps only for breaking input or output changes; minor for additive features; patch for bug fixes. We promise compatibility for the current and previous minor versions.",
  );
  drawCode(
    ctx,
    [
      "git tag -a v1.4.0 -m \"feat(aws/eks): add Karpenter-ready node IAM outputs\"",
      "git push origin v1.4.0",
      "",
      "# In the caller:",
      "module \"eks\" {",
      "  source  = \"acme/eks/aws\"",
      "  version = \"~> 1.4\"",
      "}",
    ].join("\n"),
  );
  drawHeading(ctx, "Release cadence", 3);
  drawBullets(ctx, [
    "Patch: as needed, typically weekly.",
    "Minor: monthly, with a CHANGELOG entry per module.",
    "Major: announced at least 30 days in advance with a migration guide.",
  ]);
  drawHeading(ctx, "Where to download updates", 3);
  drawParagraph(
    ctx,
    "Sign in to https://www.copypastelearn.com/library to mint a fresh, signed download link for the latest version. Each link is valid for 24 hours and allows up to 3 downloads (see the Digital Delivery Policy on the site).",
  );
  drawHeading(ctx, "Support", 3);
  drawBullets(ctx, [
    "Email: support@copypastelearn.com (response within one business day).",
    "Security disclosures: security@copypastelearn.com (PGP key on request).",
    "Bug reports: include Terraform / OpenTofu version, provider versions, the failing plan output, and a minimal reproducer.",
  ]);

  // --- 18. License ---
  newPage(ctx);
  drawHeading(ctx, "18. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the modules included in this product inside your own infrastructure projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the modules and templates as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "Terraform itself is licensed under the Business Source License 1.1; OpenTofu under the Mozilla Public License 2.0. Refer to upstream documentation for compliance details. The full Terms of Service and Refund Policy that govern this purchase are available at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
