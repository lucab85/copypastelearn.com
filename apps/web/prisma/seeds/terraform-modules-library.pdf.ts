/**
 * PDF generator for the "Terraform Modules Library" product.
 *
 * Produces a ~15-page deliverable covering AWS / GCP / Azure modules with
 * usage examples, conventions, and support information. Re-runnable from
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
    subject: "Battle-tested Terraform modules for AWS, GCP, and Azure.",
    keywords: ["terraform", "iac", "aws", "gcp", "azure", "devops", "modules"],
    headerLeft: "Terraform Modules Library",
  });

  // --- Cover ---
  drawCover(ctx, {
    title: "Terraform Modules Library",
    subtitle: "Battle-tested Terraform modules for AWS, GCP, and Azure",
    version: "1.1",
    releaseMonth: "May 2026",
  });

  // --- TOC ---
  newPage(ctx);
  drawToc(ctx, [
    "About this library",
    "Conventions and prerequisites",
    "AWS modules",
    "GCP modules",
    "Azure modules",
    "Cross-cloud patterns",
    "Versioning, releases, and support",
    "License",
  ]);

  // --- 1. About ---
  newPage(ctx);
  drawHeading(ctx, "1. About this library", 1);
  drawParagraph(
    ctx,
    "The Terraform Modules Library is a curated set of production-ready Terraform modules for the three major hyperscalers — AWS, GCP, and Azure. Every module has been deployed in real-world environments, hardened against common failure modes, and tagged with semantic versions so you can pin and upgrade safely.",
  );
  drawParagraph(
    ctx,
    "The library is opinionated: each module picks a sensible default architecture (multi-AZ, encrypted at rest, private endpoints by default) and exposes a small, stable input surface. You can always extend a module via outputs and additional resources in your own root configuration.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Twenty production-grade modules across networking, container platforms, databases, identity, observability, and CI/CD.",
    "Per-module README with inputs/outputs, an architecture diagram, and a copy-paste example root configuration.",
    "Pre-commit hooks for terraform fmt, terraform validate, tflint, tfsec, and trivy.",
    "Reusable GitHub Actions and GitLab CI templates for plan/apply pipelines with manual approval gates.",
    "Lifetime updates while the module is maintained, delivered as new releases in /library.",
  ]);

  // --- 2. Conventions ---
  newPage(ctx);
  drawHeading(ctx, "2. Conventions and prerequisites", 1);
  drawHeading(ctx, "Required tooling", 3);
  drawBullets(ctx, [
    "Terraform >= 1.7 (we test against 1.7 and 1.8).",
    "Provider versions pinned in each module via required_providers.",
    "Remote state in S3 + DynamoDB (AWS), GCS (GCP), or Azure Storage with state locking.",
    "Optional: terragrunt for stack composition, atlantis or env0 for PR-driven workflows.",
  ]);
  drawHeading(ctx, "Repository layout", 3);
  drawCode(
    ctx,
    [
      "modules/",
      "  aws/",
      "    vpc/",
      "    eks/",
      "    rds-postgres/",
      "    iam-roles-for-service-accounts/",
      "  gcp/",
      "    vpc/",
      "    gke/",
      "    cloud-sql/",
      "    workload-identity/",
      "  azure/",
      "    vnet/",
      "    aks/",
      "    postgres-flexible/",
      "    managed-identity/",
    ].join("\n"),
  );
  drawHeading(ctx, "Input naming", 3);
  drawBullets(ctx, [
    "name_prefix: short string that prefixes every taggable resource.",
    "environment: one of dev | staging | prod (used for default sizing).",
    "tags: a map(string) merged with the module's default tags.",
    "Everything else is opt-in with safe defaults; required inputs are limited to 5 or fewer per module.",
  ]);

  // --- 3. AWS modules ---
  newPage(ctx);
  drawHeading(ctx, "3. AWS modules", 1);

  drawHeading(ctx, "3.1 modules/aws/vpc", 2);
  drawParagraph(
    ctx,
    "Multi-AZ VPC with public, private, and isolated subnet tiers, NAT gateways per-AZ (or single-NAT in dev), flow logs to CloudWatch, and pre-tagged subnets compatible with the AWS Load Balancer Controller and the EKS VPC CNI.",
  );
  drawCode(
    ctx,
    [
      'module "vpc" {',
      '  source  = "./modules/aws/vpc"',
      '  version = "1.1.0"',
      "",
      '  name_prefix = "acme-prod"',
      '  environment = "prod"',
      '  cidr        = "10.40.0.0/16"',
      '  azs         = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]',
      '  enable_flow_logs = true',
      '  tags = { owner = "platform" }',
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "3.2 modules/aws/eks", 2);
  drawParagraph(
    ctx,
    "Production EKS cluster with private endpoint, OIDC provider, managed node groups (graviton + x86), Karpenter-ready instance profile, IRSA helpers, and add-ons (coredns, kube-proxy, vpc-cni, ebs-csi) installed with managed versions.",
  );
  drawCode(
    ctx,
    [
      'module "eks" {',
      '  source  = "./modules/aws/eks"',
      '  version = "1.1.0"',
      "",
      "  name_prefix         = local.name",
      "  vpc_id              = module.vpc.vpc_id",
      "  subnet_ids          = module.vpc.private_subnet_ids",
      '  cluster_version     = "1.30"',
      "  enable_karpenter    = true",
      "  node_groups = {",
      '    system  = { instance_types = ["m7g.large"], min = 2, max = 4 }',
      "  }",
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "3.3 modules/aws/rds-postgres", 2);
  drawParagraph(
    ctx,
    "Multi-AZ RDS for PostgreSQL with KMS encryption, Performance Insights, IAM database authentication, automated minor-version upgrades, parameter group tuned for OLTP, and a secrets-manager secret rotated by the bundled Lambda.",
  );
  drawCode(
    ctx,
    [
      'module "db" {',
      '  source  = "./modules/aws/rds-postgres"',
      '  version = "1.1.0"',
      "",
      "  name_prefix       = local.name",
      "  vpc_id            = module.vpc.vpc_id",
      "  subnet_ids        = module.vpc.isolated_subnet_ids",
      '  engine_version    = "16.3"',
      '  instance_class    = "db.m7g.large"',
      "  allocated_storage = 200",
      "  multi_az          = true",
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "3.4 modules/aws/iam-roles-for-service-accounts", 2);
  drawParagraph(
    ctx,
    "Helper module that creates an IAM role trusted by your EKS cluster's OIDC provider with a managed policy attached. Designed to be invoked per workload from a Helm values file or an Argo CD ApplicationSet.",
  );

  // --- 4. GCP modules ---
  newPage(ctx);
  drawHeading(ctx, "4. GCP modules", 1);

  drawHeading(ctx, "4.1 modules/gcp/vpc", 2);
  drawParagraph(
    ctx,
    "Custom-mode VPC with regional subnets, Cloud NAT per region, Private Google Access, VPC flow logs sampled at 50%, and pre-configured firewall rules for the GKE control plane and IAP SSH access.",
  );
  drawCode(
    ctx,
    [
      'module "vpc" {',
      '  source  = "./modules/gcp/vpc"',
      '  version = "1.1.0"',
      "",
      '  name_prefix = "acme-prod"',
      "  project_id  = var.project_id",
      '  regions = {',
      '    "europe-west4" = { primary_cidr = "10.10.0.0/20" }',
      "  }",
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "4.2 modules/gcp/gke", 2);
  drawParagraph(
    ctx,
    "Private regional GKE cluster with Workload Identity enabled, Shielded Nodes, Binary Authorization wired to the Artifact Registry, Dataplane v2, and a default node pool sized for control-plane workloads. Optional auto-pilot mode swap via a single boolean.",
  );
  drawCode(
    ctx,
    [
      'module "gke" {',
      '  source  = "./modules/gcp/gke"',
      '  version = "1.1.0"',
      "",
      "  name_prefix    = local.name",
      "  project_id     = var.project_id",
      "  vpc_self_link  = module.vpc.network_self_link",
      "  subnet_name    = module.vpc.subnets[\"europe-west4\"].name",
      "  release_channel = \"REGULAR\"",
      "  workload_identity = true",
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "4.3 modules/gcp/cloud-sql", 2);
  drawParagraph(
    ctx,
    "Regional Cloud SQL Postgres with private IP only, CMEK encryption, automated backups, point-in-time recovery, and read replicas configured via a single map input.",
  );

  drawHeading(ctx, "4.4 modules/gcp/workload-identity", 2);
  drawParagraph(
    ctx,
    "Binds a Kubernetes service account to a Google service account with least-privilege IAM bindings. Outputs the annotation snippet ready to paste into your Helm values.",
  );

  // --- 5. Azure modules ---
  newPage(ctx);
  drawHeading(ctx, "5. Azure modules", 1);

  drawHeading(ctx, "5.1 modules/azure/vnet", 2);
  drawParagraph(
    ctx,
    "Hub-and-spoke ready VNet with delegated subnets for AKS, Private Link, and App Gateway, NSGs with least-privilege baselines, and optional peering to a hub VNet.",
  );
  drawCode(
    ctx,
    [
      'module "vnet" {',
      '  source  = "./modules/azure/vnet"',
      '  version = "1.1.0"',
      "",
      '  name_prefix         = "acme-prod"',
      "  resource_group_name = azurerm_resource_group.this.name",
      "  location            = \"westeurope\"",
      "  address_space       = [\"10.50.0.0/16\"]",
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "5.2 modules/azure/aks", 2);
  drawParagraph(
    ctx,
    "Private AKS cluster with Azure CNI Overlay, Managed Identity, Microsoft Defender for Containers enabled, automatic upgrade channel, and a system node pool plus an opinionated workload node pool with cluster autoscaler.",
  );
  drawCode(
    ctx,
    [
      'module "aks" {',
      '  source  = "./modules/azure/aks"',
      '  version = "1.1.0"',
      "",
      "  name_prefix         = local.name",
      "  resource_group_name = azurerm_resource_group.this.name",
      "  vnet_subnet_id      = module.vnet.subnet_ids[\"aks\"]",
      "  kubernetes_version  = \"1.30\"",
      "  workload_identity_enabled = true",
      "}",
    ].join("\n"),
  );

  drawHeading(ctx, "5.3 modules/azure/postgres-flexible", 2);
  drawParagraph(
    ctx,
    "Postgres Flexible Server with private VNet integration, geo-redundant backups, password-less AAD authentication, and a managed-identity-driven secrets-rotation policy.",
  );

  drawHeading(ctx, "5.4 modules/azure/managed-identity", 2);
  drawParagraph(
    ctx,
    "Creates a user-assigned managed identity, federated credentials for AKS workload identity, and the minimum RBAC role assignments you specify via a map.",
  );

  // --- 6. Cross-cloud patterns ---
  newPage(ctx);
  drawHeading(ctx, "6. Cross-cloud patterns", 1);

  drawHeading(ctx, "Stack composition", 3);
  drawParagraph(
    ctx,
    "Each module is consumed from a thin root configuration per environment. We recommend Terragrunt or a Makefile-driven workspace pattern. The library ships an example terragrunt.hcl that wires remote state, locking, and per-environment inputs.",
  );
  drawCode(
    ctx,
    [
      "stacks/",
      "  live/",
      "    dev/",
      "      network/terragrunt.hcl",
      "      cluster/terragrunt.hcl",
      "    prod/",
      "      network/terragrunt.hcl",
      "      cluster/terragrunt.hcl",
      "  _envcommon/",
      "    network.hcl",
      "    cluster.hcl",
    ].join("\n"),
  );

  drawHeading(ctx, "Tagging strategy", 3);
  drawParagraph(
    ctx,
    "Every module merges three tag layers (provider defaults, then environment tags, then module tags) and exposes the final map as an output. This lets cost-allocation reports group spend by team, environment, and component without bespoke regexes.",
  );

  drawHeading(ctx, "CI/CD baseline", 3);
  drawBullets(ctx, [
    "Pull-request pipeline: terraform fmt, validate, tflint, tfsec, trivy, then terraform plan with a comment-back action.",
    "Apply pipeline: gated by a manual approval, runs terraform apply with --lock-timeout=10m, posts the resource diff to chat.",
    "Drift detection: scheduled terraform plan exits non-zero on drift and pages the on-call.",
  ]);

  // --- 7. Versioning & Support ---
  newPage(ctx);
  drawHeading(ctx, "7. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "The library follows semantic versioning at the module level. Breaking changes only ship in major versions; new optional inputs and outputs ship in minor versions; doc and test improvements ship in patch versions. Pin via the `version =` argument of each module block.",
  );
  drawHeading(ctx, "Release cadence", 3);
  drawBullets(ctx, [
    "Patch releases: as needed, typically weekly.",
    "Minor releases: monthly, with a CHANGELOG entry per module.",
    "Major releases: announced at least 30 days in advance with a migration guide.",
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
    "Bug reports and feature requests: include your module version, Terraform version, and the relevant plan output.",
  ]);

  // --- 8. License ---
  newPage(ctx);
  drawHeading(ctx, "8. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the source files included in this product inside your own infrastructure projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the modules as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "The full Terms of Service and Refund Policy that govern this purchase are available at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "© 2026 Open Empower B.V. — De Boelelaan 471, 1082 RK Amsterdam, The Netherlands · VAT NL866954958B01 · CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
