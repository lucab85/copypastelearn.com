/**
 * Commerce seed (T009).
 *
 * Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.commerce.ts
 *
 * Prereqs:
 *   - DATABASE_URL set (Postgres)
 *   - STRIPE_SECRET_KEY set (test-mode key recommended)
 *   - BLOB_READ_WRITE_TOKEN set (Vercel Blob store)
 *   - RESEND_API_KEY optional (emails skipped if missing)
 */

import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Stripe from "stripe";
import { generateAiInfrastructureKubernetesPdf } from "./seeds/ai-infrastructure-kubernetes.pdf";
import { generateAnsibleAutomationPlaybookPdf } from "./seeds/ansible-automation-playbook.pdf";
import { generateAnsibleForKubernetesRecipesPdf } from "./seeds/ansible-for-kubernetes-recipes.pdf";
import { generateAnsibleForVmwareOperationsRecipesPdf } from "./seeds/ansible-for-vmware-operations-recipes.pdf";
import { generateBareMetalProvisioningRedfishPdf } from "./seeds/baremetal-provisioning-redfish.pdf";
import { generateCloudNativeReferenceStackPdf } from "./seeds/cloud-native-reference-stack.pdf";
import { generateKubernetesRecipesPdf } from "./seeds/kubernetes-recipes.pdf";
import { generateRhelAiEngineeringRecipesPdf } from "./seeds/rhel-ai-engineering-recipes.pdf";
import { generateRhelCisHardeningPlaybookPdf } from "./seeds/rhel9-cis-hardening-playbook.pdf";
import { generateTerraformModulesLibraryPdf } from "./seeds/terraform-modules-library.pdf";

const prisma = new PrismaClient();

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getStripe(): Stripe {
  return new Stripe(need("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

function ensureBlobToken(): void {
  need("BLOB_READ_WRITE_TOKEN");
}

async function generateSamplePdf(title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("CopyPasteLearn", { x: 50, y: 780, size: 24, font, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(title, { x: 50, y: 740, size: 16, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText("Sample seed file — replace with your real content.", {
    x: 50,
    y: 700,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  return pdf.save();
}

async function ensureStripeProduct(args: {
  name: string;
  amountMinor: number;
  currency: string;
  metadata: Record<string, string>;
}): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripe();
  // Look up by metadata.slug to be idempotent.
  const slug = args.metadata.slug;
  const existing = await stripe.products.search({
    query: `metadata['slug']:'${slug}' AND active:'true'`,
    limit: 1,
  });
  let productId: string;
  if (existing.data.length) {
    productId = existing.data[0].id;
  } else {
    const created = await stripe.products.create({
      name: args.name,
      tax_code: "txcd_10501000",
      metadata: args.metadata,
    });
    productId = created.id;
  }

  // Find a matching active price; if currency/amount differs, create a new one.
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const match = prices.data.find(
    (p) =>
      p.unit_amount === args.amountMinor &&
      p.currency.toLowerCase() === args.currency.toLowerCase(),
  );
  const priceId = match
    ? match.id
    : (
        await stripe.prices.create({
          product: productId,
          unit_amount: args.amountMinor,
          currency: args.currency.toLowerCase(),
          tax_behavior: "exclusive",
        })
      ).id;

  return { productId, priceId };
}

async function uploadProductFile(args: {
  productId: string;
  version: string;
  filename: string;
  bytes: Uint8Array;
}): Promise<{ storageKey: string }> {
  ensureBlobToken();
  const storageKey = `products/${args.productId}/v${args.version}/${args.filename}`;
  await put(storageKey, Buffer.from(args.bytes), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { storageKey };
}

async function seedProduct(input: {
  slug: string;
  title: string;
  description: string;
  brand: "AnsiblePilot" | "TerraformPilot" | "AnsibleByExample" | "KubernetesRecipes" | "CopyPasteLearn";
  productType: "EBOOK" | "TEMPLATE" | "COURSE";
  amountMinor: number;
  currency: string;
  fileVersion?: string;
  pdfFactory?: () => Promise<Uint8Array>;
}) {
  const { productId: stripeProductId, priceId: stripePriceId } =
    await ensureStripeProduct({
      name: input.title,
      amountMinor: input.amountMinor,
      currency: input.currency,
      metadata: { slug: input.slug, brand: input.brand, type: input.productType },
    });

  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      subtitle: input.description.slice(0, 200),
      description: input.description,
      stripeProductId,
      stripePriceId,
      priceAmount: input.amountMinor,
      currency: input.currency,
      status: "PUBLISHED",
    },
    create: {
      slug: input.slug,
      title: input.title,
      subtitle: input.description.slice(0, 200),
      description: input.description,
      productType: input.productType,
      brand: input.brand,
      categories: [],
      priceAmount: input.amountMinor,
      currency: input.currency,
      status: "PUBLISHED",
      stripeProductId,
      stripePriceId,
      taxCode: process.env.STRIPE_TAX_CODE_DIGITAL ?? "txcd_10000000",
      canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com"}/shop/${input.slug}`,
    },
  });

  // Ensure the requested file version is present and marked current.
  const version = input.fileVersion ?? "1.0";
  const existingThisVersion = await prisma.productFile.findFirst({
    where: { productId: product.id, version },
  });
  const existingCurrent = await prisma.productFile.findFirst({
    where: { productId: product.id, isCurrent: true },
  });

  // If a pdfFactory is provided, always regenerate and (re)upload the bytes so
  // content updates land in the blob even when the version string hasn't been
  // bumped, or when a prior seed run already created a row at this version
  // pointing to stale content. The blob put() is overwrite-safe.
  // If no factory is provided, only upload when the version row is missing.
  const shouldUpload = input.pdfFactory ? true : !existingThisVersion;

  if (shouldUpload) {
    const bytes = input.pdfFactory
      ? await input.pdfFactory()
      : await generateSamplePdf(input.title);
    const { storageKey } = await uploadProductFile({
      productId: product.id,
      version,
      filename: `${input.slug}.pdf`,
      bytes,
    });
    if (existingThisVersion) {
      // Refresh row: same storageKey (overwritten), update size, ensure current.
      if (existingCurrent && existingCurrent.id !== existingThisVersion.id) {
        await prisma.productFile.update({
          where: { id: existingCurrent.id },
          data: { isCurrent: false },
        });
      }
      await prisma.productFile.update({
        where: { id: existingThisVersion.id },
        data: {
          storageKey,
          sizeBytes: bytes.length,
          contentType: "application/pdf",
          isCurrent: true,
        },
      });
      console.log(`  ✓ refreshed ${storageKey} (${bytes.length} bytes)`);
    } else {
      if (existingCurrent) {
        await prisma.productFile.update({
          where: { id: existingCurrent.id },
          data: { isCurrent: false },
        });
      }
      await prisma.productFile.create({
        data: {
          productId: product.id,
          version,
          storageKey,
          sizeBytes: bytes.length,
          contentType: "application/pdf",
          isCurrent: true,
        },
      });
      console.log(`  ✓ uploaded ${storageKey} (${bytes.length} bytes)`);
    }
  } else if (existingThisVersion && !existingThisVersion.isCurrent) {
    if (existingCurrent && existingCurrent.id !== existingThisVersion.id) {
      await prisma.productFile.update({
        where: { id: existingCurrent.id },
        data: { isCurrent: false },
      });
    }
    await prisma.productFile.update({
      where: { id: existingThisVersion.id },
      data: { isCurrent: true },
    });
  }

  console.log(`  ✓ product ${input.slug} (${stripePriceId})`);
  return product;
}

async function seedBundle(input: {
  slug: string;
  title: string;
  description: string;
  amountMinor: number;
  currency: string;
  productSlugs: string[];
}) {
  const { productId: stripeProductId, priceId: stripePriceId } =
    await ensureStripeProduct({
      name: input.title,
      amountMinor: input.amountMinor,
      currency: input.currency,
      metadata: { slug: input.slug, type: "BUNDLE" },
    });

  const bundle = await prisma.bundle.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      priceAmount: input.amountMinor,
      currency: input.currency,
      stripeProductId,
      stripePriceId,
      status: "PUBLISHED",
    },
    create: {
      slug: input.slug,
      title: input.title,
      description: input.description,
      priceAmount: input.amountMinor,
      currency: input.currency,
      status: "PUBLISHED",
      stripeProductId,
      stripePriceId,
      taxCode: process.env.STRIPE_TAX_CODE_DIGITAL ?? "txcd_10000000",
      canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com"}/shop/bundles/${input.slug}`,
    },
  });

  // Members
  const products = await prisma.product.findMany({
    where: { slug: { in: input.productSlugs } },
  });
  for (const p of products) {
    await prisma.bundleItem.upsert({
      where: { bundleId_productId: { bundleId: bundle.id, productId: p.id } },
      update: {},
      create: { bundleId: bundle.id, productId: p.id },
    });
  }
  console.log(`  ✓ bundle ${input.slug} (${products.length} items)`);
}

async function seedPolicy(slug: string, version: string, bodyMd: string) {
  await prisma.policyDocument.updateMany({
    where: { slug, isCurrent: true, version: { not: version } },
    data: { isCurrent: false },
  });
  await prisma.policyDocument.upsert({
    where: { slug_version: { slug, version } },
    update: { bodyMd, isCurrent: true },
    create: { slug, version, bodyMd, isCurrent: true, publishedAt: new Date() },
  });
  console.log(`  ✓ policy ${slug}@${version}`);
}

async function main() {
  console.log("🌱 Commerce seed");

  await seedProduct({
    slug: "ansible-automation-playbook",
    title: "Ansible Automation Playbook",
    description: [
      "Production-ready Ansible patterns, roles, and CI templates — the reference architecture we use on real client engagements to manage thousands of Linux and Windows hosts. Stop rebuilding the same scaffolding on every project.",
      "",
      "What's inside:",
      "• A scalable repository layout (inventories, group_vars, roles, collections, playbooks, vault, molecule, CI) ready for 10 or 10,000 hosts.",
      "• 12 reusable roles: base hardening, users, SSH, sudoers, time, logging, monitoring agents, package mirrors, container runtimes, nginx, app_deploy, and database client tooling.",
      "• Static and dynamic inventory templates (AWS EC2, GCP, Azure, Proxmox, Netbox) with sensible group_vars layering.",
      "• Ansible Vault layout with a password client script that fetches the master key from 1Password / HashiCorp Vault / AWS Secrets Manager — nothing sensitive committed to git.",
      "• Molecule scenarios (Podman, Docker, EC2 drivers) with idempotency and verifier steps for every role.",
      "• AWX / Ansible Automation Platform project import and an Event-Driven Ansible rule book sample.",
      "• GitHub Actions and GitLab CI templates: ansible-lint, yamllint, syntax-check, Molecule matrix, gated apply pipelines.",
      "• pre-commit hooks and an opinionated ansible.cfg tuned for production fleets.",
      "• Reference of the 22-level variable precedence and a numeric performance playbook (which knob delivers 2x, which delivers 10x, which breaks idempotency).",
      "",
      "Tested against Ansible Core 2.16 and 2.17. Lifetime updates while the playbook is maintained, delivered via /library.",
    ].join("\n"),
    brand: "AnsiblePilot",
    productType: "EBOOK",
    amountMinor: 2900,
    currency: "EUR",
    fileVersion: "1.2",
    pdfFactory: generateAnsibleAutomationPlaybookPdf,
  });

  await seedProduct({
    slug: "terraform-modules-library",
    title: "Terraform Modules Library",
    description: [
      "Battle-tested Terraform modules for AWS, GCP, and Azure — the ones we run in production, packaged with documentation, examples, and a CI/CD baseline so you can ship infrastructure on day one.",
      "",
      "What's inside:",
      "• 20 modules across networking, container platforms (EKS, GKE, AKS), managed Postgres, identity (IRSA, Workload Identity, Managed Identity), and observability.",
      "• Per-module README with inputs, outputs, an architecture diagram, and a copy-paste example root configuration.",
      "• Sensible, opinionated defaults: multi-AZ, encrypted at rest, private endpoints, least-privilege IAM, flow logs.",
      "• Pre-commit hooks: terraform fmt, validate, tflint, tfsec, trivy.",
      "• Reusable GitHub Actions and GitLab CI templates for plan/apply pipelines with manual approval gates and OIDC (no static credentials).",
      "• Native terraform test scenarios, tflint and tfsec configurations, pre-commit hooks.",
      "• Lifecycle and refactor patterns: prevent_destroy, create_before_destroy, moved {} and removed {} blocks.",
      "• Remote state recipes for S3 + DynamoDB, AzureRM, GCS, and OpenTofu state encryption.",
      "• Semantic versioning per module. Pin with `version = \"~> 1.4\"` and upgrade safely.",
      "",
      "Tested against Terraform 1.7 / 1.8 and OpenTofu 1.7+. Lifetime updates while the modules are maintained, delivered via /library.",
    ].join("\n"),
    brand: "TerraformPilot",
    productType: "TEMPLATE",
    amountMinor: 3900,
    currency: "EUR",
    fileVersion: "1.2",
    pdfFactory: generateTerraformModulesLibraryPdf,
  });

  await seedProduct({
    slug: "kubernetes-recipes",
    title: "Kubernetes Recipes",
    description: [
      "Production-grade Kubernetes patterns for SRE teams running real clusters — the cookbook we hand to new engineers on day one. Skip the months of trial and error.",
      "",
      "What's inside:",
      "\u2022 Cluster layout templates: namespaces, ResourceQuota, LimitRange, default-deny NetworkPolicy, scoped RBAC, GitOps repo structure.",
      "\u2022 Workload decision matrix: Deployment vs StatefulSet vs DaemonSet vs Job vs CronJob with full examples.",
      "\u2022 Hardened pod templates compliant with the restricted Pod Security Standard (runAsNonRoot, read-only rootfs, dropped capabilities, seccomp RuntimeDefault).",
      "\u2022 Rollout playbooks: RollingUpdate tuning, Blue-Green via Service selector switch, Canary with Argo Rollouts and analysis templates.",
      "\u2022 Autoscaling stack: HPA on CPU + custom metrics, VPA, Cluster Autoscaler, KEDA ScaledObject for queue-driven workloads.",
      "\u2022 Configuration patterns: immutable ConfigMaps, External Secrets Operator, Vault Agent Injector, secret rotation.",
      "\u2022 Ingress + Gateway API + cert-manager with Let's Encrypt (HTTP-01 and DNS-01 wildcard) recipes.",
      "\u2022 Helm chart anatomy, Sprig idioms, hooks; Kustomize base + overlays + components; Argo CD Application and Flux Kustomization / HelmRelease templates.",
      "\u2022 Observability: kube-prometheus-stack, ServiceMonitor, PrometheusRule, SLO-driven alerting, Alertmanager routing.",
      "\u2022 OpenTelemetry Collector daemonset with OTLP -> Tempo / Jaeger pipeline.",
      "\u2022 Debugging runbook: CrashLoopBackOff, OOMKilled, ImagePullBackOff, DNS, Pending pods, kubectl debug ephemeral containers.",
      "\u2022 Cluster operations: etcd snapshot + verified restore, drain with PodDisruptionBudget, upgrade order.",
      "\u2022 Supply chain hardening: Trivy CI gates, SBOM generation, cosign keyless signing, Kyverno verify-images policies.",
      "",
      "Tested against Kubernetes 1.29, 1.30, and 1.31 on EKS, GKE, AKS, DOKS, and kubeadm clusters. Lifetime updates while the book is maintained, delivered via /library.",
    ].join("\n"),
    brand: "KubernetesRecipes",
    productType: "EBOOK",
    amountMinor: 3900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateKubernetesRecipesPdf,
  });

  await seedProduct({
    slug: "rhel9-cis-hardening-playbook",
    title: "RHEL 9 CIS Hardening Playbook",
    description: [
      "Production-ready Ansible automation to bring RHEL 9 fleets into CIS Level 1 or Level 2 compliance — the field manual we use to ship 500 hardened hosts before the next audit window. Idempotent, reversible, fully tagged.",
      "",
      "What's inside:",
      "\u2022 All six CIS RHEL 9 benchmark sections: filesystems, services, network, auditing, access (SSH/PAM/users), and file/group permissions.",
      "\u2022 Copy-paste Ansible task blocks with correct `when:` guards, tags, and handler notifications - drop them into your role today.",
      "\u2022 Per-rule and per-section toggles (`rhel9cis_rule_X_Y_Z`) so you deploy one control or the whole benchmark.",
      "\u2022 SSH hardening template (sshd_config) with modern ciphers, MACs, KexAlgorithms tested against RHEL 9 OpenSSH defaults.",
      "\u2022 PAM, pwquality.conf, and faillock.conf hardened to CIS Level 2 with `even_deny_root` + 24-cycle pwhistory.",
      "\u2022 SELinux chapter: enforcing targeted policy, booleans, custom seport/sefcontext labels, SETroubleshoot + audit2allow workflow.",
      "\u2022 Crypto policies and FIPS mode walkthrough (DEFAULT, FUTURE, DEFAULT:NO-SHA1, fips-mode-setup).",
      "\u2022 AIDE baseline + nightly systemd timer + S3 off-host shipping.",
      "\u2022 OpenSCAP pre and post-remediation scan workflow with ssg-rhel9-ds.xml, ARF + HTML report capture.",
      "\u2022 Deviations register (YAML) doubling as audit evidence; every disabled rule tracked with reason, approver, review date.",
      "\u2022 Molecule scenarios (Podman + EC2 drivers), GitHub Actions pipeline (lint -> molecule -> staging -> canary -> fleet).",
      "\u2022 Drift detection via daily systemd-timer scans uploaded to S3 with 13-month retention.",
      "\u2022 Common pitfalls quick reference: Docker breaks after IP forwarding off, SSH lockout from cipher whitelist, AIDE noise after first run, faillock locking root, and seven more.",
      "",
      "Mapped to the Ansible Lockdown RHEL9-CIS role and the CIS Red Hat Enterprise Linux 9 Benchmark v1.0.0. Tested against RHEL 9, AlmaLinux 9, and Rocky Linux 9. Lifetime updates while the benchmark is maintained, delivered via /library.",
    ].join("\n"),
    brand: "CopyPasteLearn",
    productType: "EBOOK",
    amountMinor: 4900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateRhelCisHardeningPlaybookPdf,
  });

  await seedProduct({
    slug: "rhel-ai-engineering-recipes",
    title: "RHEL AI Engineering Recipes",
    description: [
      "Production cookbook for Red Hat AI \u2014 the recipes platform and SRE engineers need to ship InstructLab fine-tunes, vLLM serving, RAG, and multi-agent stacks on RHEL 9 GPU nodes.",
      "",
      "What's inside:",
      "\u2022 Subscription-manager + repo enablement for `ilab`, CUDA, and Intel Gaudi accelerators.",
      "\u2022 GPU smoke tests and troubleshooting recipes (nvidia-smi, CDI device resolution, persistent mode, ECC).",
      "\u2022 Cloud bootstrap recipes for AWS p5/g5, Azure ND H100 v5, GCP A3, and IBM Cloud GX3.",
      "\u2022 Bare-metal kickstart for PXE-provisioned RHEL AI nodes.",
      "\u2022 InstructLab taxonomy templates (knowledge + skills), SDG runbook, multi-GPU DeepSpeed ZeRO-3 training.",
      "\u2022 vLLM serving with tensor parallel, chunked prefill, GPU memory tuning, and OpenAI-compatible inference.",
      "\u2022 FastAPI wrapper, ChromaDB + LangChain RAG pipeline, CrewAI multi-agent template.",
      "\u2022 Idempotent Ansible role to deploy RHEL AI across a fleet, vaulted activation keys included.",
      "\u2022 Observability: nvidia-dcgm-exporter, vLLM /metrics scrape config, SLO Prometheus rules, Grafana alerts.",
      "\u2022 Scale-out topologies: data-parallel vs tensor-parallel vs pipeline-parallel, multi-node DeepSpeed + Ray.",
      "\u2022 Governance: SPDX lineage YAML, model cards, cosign keyless artifact signing, request-level audit logs.",
      "\u2022 Blue-green and canary model rollouts via weighted upstreams.",
      "\u2022 Hardware sizing reference (VRAM per parameter, tokens/sec per GPU class) and 10 common-error fixes.",
      "",
      "Tested against RHEL AI 1.5 on A100, H100, and L40S GPUs. Lifetime updates while the recipes are maintained, delivered via /library.",
    ].join("\n"),
    brand: "CopyPasteLearn",
    productType: "EBOOK",
    amountMinor: 4900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateRhelAiEngineeringRecipesPdf,
  });

  await seedProduct({
    slug: "ai-infrastructure-kubernetes",
    title: "AI Infrastructure on Kubernetes",
    description: [
      "Production cookbook for platform engineers running GPU clusters, model training, and inference on Kubernetes.",
      "",
      "What's inside:",
      "\u2022 NVIDIA GPU Operator install + ClusterPolicy tuned for production.",
      "\u2022 GPU sharing recipes: MIG, time-slicing, MPS - when to use which.",
      "\u2022 Karpenter / Cluster Autoscaler templates for cost-aware H100 / A100 / L40S / L4 pools.",
      "\u2022 Volcano gang scheduling + Kueue fair-share queues + priority and preemption.",
      "\u2022 Fluid + Alluxio model caching from S3 / GCS to local NVMe.",
      "\u2022 NCCL / RDMA / IB / RoCE setup for multi-node training.",
      "\u2022 vLLM Deployment + HPA on tokens/sec, KServe InferenceService, KAITO patterns.",
      "\u2022 KubeRay RayJob, PyTorchJob + FSDP, Kubeflow Pipelines for end-to-end MLOps.",
      "\u2022 Model registries: MLflow, Hugging Face, OCI artifacts with cosign signing.",
      "\u2022 Autoscaling: HPA + KEDA scale-to-zero on queue depth.",
      "\u2022 dcgm-exporter + vLLM /metrics + Prometheus SLO rules + Grafana dashboards.",
      "\u2022 Cost control: per-tenant quotas, idle-GPU alerts, spot pools, chargeback.",
      "\u2022 Multi-tenant isolation: PSS, NetworkPolicy, Kyverno generate rules.",
      "\u2022 Supply chain: signed model images + Kyverno verify-images.",
      "\u2022 Disaster recovery for models and checkpoints, 10 common errors.",
      "",
      "Tested against Kubernetes 1.29-1.31 on EKS, GKE, AKS, OpenShift, and on-prem. Lifetime updates while the recipes are maintained, delivered via /library.",
    ].join("\n"),
    brand: "NvidiaAI",
    productType: "EBOOK",
    amountMinor: 4900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateAiInfrastructureKubernetesPdf,
  });

  await seedProduct({
    slug: "ansible-for-kubernetes-recipes",
    title: "Ansible for Kubernetes Recipes",
    description: [
      "Operations cookbook for installing, upgrading, and managing Kubernetes clusters with Ansible. Distinct from the author's Apress 2023 book; recipes are written from public Ansible / kubernetes.core patterns.",
      "",
      "What's inside:",
      "\u2022 Inventory patterns for control-plane / workers / GPU nodes / edge.",
      "\u2022 Pre-flight role: kernel modules, sysctl, swap, time sync.",
      "\u2022 containerd + CRI-O install with SystemdCgroup enabled.",
      "\u2022 kubeadm cluster from scratch, k3s HA, OpenShift agent-based installer wrapper.",
      "\u2022 Joining workers, rotating bootstrap tokens.",
      "\u2022 Day-2 lifecycle: drain, cordon, uncordon, rolling kubelet upgrade with serial: 1.",
      "\u2022 kubernetes.core deep dive: k8s, k8s_info, k8s_exec, k8s_drain.",
      "\u2022 Jinja2 manifest templating + Helm releases via kubernetes.core.helm.",
      "\u2022 Secrets: SealedSecrets, ExternalSecrets, Vault.",
      "\u2022 GitOps bootstrap: Argo CD app-of-apps and Flux.",
      "\u2022 Addons: ingress-nginx, cert-manager, metrics-server, MetalLB, Calico, Cilium.",
      "\u2022 Persistent storage (OpenEBS, Longhorn, Rook-Ceph) and DR with Velero.",
      "\u2022 kube-prometheus-stack + Loki observability.",
      "\u2022 Execution Environments + AAP job templates + molecule/kind CI tests.",
      "\u2022 10 common errors with one-line fixes.",
      "",
      "Tested against ansible-core 2.18, kubernetes.core 5.x, Kubernetes 1.29-1.31, k3s 1.31+, OpenShift 4.17. Lifetime updates while the recipes are maintained, delivered via /library.",
    ].join("\n"),
    brand: "AnsiblePilot",
    productType: "EBOOK",
    amountMinor: 2900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateAnsibleForKubernetesRecipesPdf,
  });

  await seedProduct({
    slug: "ansible-for-vmware-operations-recipes",
    title: "Ansible for VMware Operations Recipes",
    description: [
      "Day-2 operations cookbook for vCenter / ESXi fleets driven by Ansible. Distinct from the author's Apress 2023 book; recipes use public community.vmware and vmware.vmware_rest collection patterns.",
      "",
      "What's inside:",
      "\u2022 Inventory + auth: vault, dynamic inventory, REST token reuse.",
      "\u2022 Pre-flight: collections, python deps, Execution Environment image.",
      "\u2022 Folders, resource pools, clusters with DRS rules and reservations.",
      "\u2022 VM lifecycle: clone-from-template, hot reconfigure, delete.",
      "\u2022 Content libraries, OVF / OVA template publishing and deployment.",
      "\u2022 Linux + Windows customization specs, cloud-init via guestinfo, Sysprep domain join.",
      "\u2022 Snapshots: create, consolidate, prune, restore - quiesced for DB VMs.",
      "\u2022 Backups via Velero-vSphere and tag-driven 3rd-party tools.",
      "\u2022 Tagging + categories for governance, cost reports, RBAC.",
      "\u2022 Networking: dvSwitch, dvPortgroup, NSX-T segments.",
      "\u2022 Storage: datastore mounts, vSAN SPBM policies.",
      "\u2022 Host lifecycle: enter / exit maintenance, rolling ESXi patching with serial: 1.",
      "\u2022 vCenter + ESXi upgrade orchestration via vLCM.",
      "\u2022 STIG-aligned hardening for ESXi + vCenter (lockdown mode, syslog, certs).",
      "\u2022 Prometheus vsphere_exporter scrape + SRM DR orchestration.",
      "\u2022 Execution Environment for vmware.vmware_rest + AAP job templates.",
      "\u2022 10 common errors with one-line fixes.",
      "",
      "Tested against vSphere 7.0 U3 + 8.0 U3, NSX-T 4.1+, vSAN 8 ESA, ansible-core 2.18. Lifetime updates while the recipes are maintained, delivered via /library.",
    ].join("\n"),
    brand: "AnsiblePilot",
    productType: "EBOOK",
    amountMinor: 3900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateAnsibleForVmwareOperationsRecipesPdf,
  });

  await seedProduct({
    slug: "baremetal-provisioning-redfish",
    title: "Bare-metal Provisioning with Redfish",
    description: [
      "Automation cookbook for provisioning bare-metal servers via the DMTF Redfish API - the recipes platform engineers need to drive iDRAC, iLO, Supermicro, and XCC fleets from CI / AAP / Metal3.",
      "",
      "What's inside:",
      "\u2022 Redfish basics: schema, sessions, ETags, pretty curl invocations.",
      "\u2022 BMC inventory queries (power, NICs, drives, firmware) as curl and Ansible.",
      "\u2022 Authentication: local accounts, LDAP / AD, mTLS, lockout policies.",
      "\u2022 Power and one-time boot (PXE / HDD / virtual media) recipes.",
      "\u2022 Virtual-media attach for image-based installs - no PXE / DHCP required.",
      "\u2022 BIOS get/set with ETag concurrency, apply-on-next-reset patterns.",
      "\u2022 SimpleUpdate firmware flow for iDRAC, iLO, Supermicro.",
      "\u2022 RAID / storage controller volume creation.",
      "\u2022 PXE + iPXE + DHCP + TFTP baseline for fleet boot.",
      "\u2022 Kickstart for RHEL / Rocky / AlmaLinux, autoinstall for Ubuntu 24.04.",
      "\u2022 Image-based provisioning with osbuild and coreos-installer (Ignition).",
      "\u2022 community.general.redfish_* Ansible modules + Redfish dynamic inventory.",
      "\u2022 Metal3 + Ironic BareMetalHost on Kubernetes; Tinkerbell alternative.",
      "\u2022 Secure Boot, TPM, LUKS2 + clevis + tang at scale.",
      "\u2022 Day-2 telemetry: Redfish event subscriptions + rsyslog forwarding.",
      "\u2022 10 common errors with one-line fixes and reference YAML.",
      "",
      "Tested against iDRAC 9 firmware 7.x, iLO 5 + 6, Supermicro X12 BMC, Lenovo XCC2, Redfish 1.20. Lifetime updates while the recipes are maintained, delivered via /library.",
    ].join("\n"),
    brand: "CopyPasteLearn",
    productType: "EBOOK",
    amountMinor: 3900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateBareMetalProvisioningRedfishPdf,
  });

  await seedProduct({
    slug: "cloud-native-reference-stack",
    title: "Cloud-Native Reference Stack",
    description: [
      "Opinionated end-to-end reference architecture for a modern Kubernetes-based platform. 12 concerns, one tool each, ship to production with a 3-5 person platform team.",
      "",
      "What's inside:",
      "\u2022 The 12-concern checklist platform teams use to scope themselves.",
      "\u2022 Cluster baseline: K8s version, runtime, CNI (Cilium kube-proxy-free).",
      "\u2022 Ingress and Gateway API with Cilium Gateway + cert-manager.",
      "\u2022 Service mesh decision tree: Istio Ambient vs Linkerd vs Cilium.",
      "\u2022 SPIFFE / SPIRE workload identity federated across clusters.",
      "\u2022 Argo CD app-of-apps reference layout with ApplicationSet per tenant.",
      "\u2022 Progressive delivery with Argo Rollouts via Gateway API weights.",
      "\u2022 External Secrets + Vault for secret distribution.",
      "\u2022 Kyverno baseline policies (PSS Restricted, require resources, verify-images).",
      "\u2022 Supply chain: cosign signing + SBOM + Kyverno admission verification.",
      "\u2022 Observability: Prometheus + Loki + Tempo + Grafana + OTel Collector.",
      "\u2022 SLOs + error budgets with sloth + Pyrra; auto-freeze deploys on burn.",
      "\u2022 Multi-tenancy: namespace + ResourceQuota + default-deny NetworkPolicy.",
      "\u2022 FinOps: OpenCost chargeback, idle-pod detection, rightsizing via VPA.",
      "\u2022 Backstage scaffolder templates for self-service tenant onboarding.",
      "\u2022 CloudNativePG + Strimzi database operators, MinIO object storage.",
      "\u2022 Velero cross-region DR pattern + quarterly restore drill.",
      "\u2022 10 common errors, reference monorepo layout.",
      "",
      "Tested against Kubernetes 1.30 / 1.31 on EKS, GKE, AKS, OpenShift 4.17. Lifetime updates while the recipes are maintained, delivered via /library.",
    ].join("\n"),
    brand: "KubernetesRecipes",
    productType: "EBOOK",
    amountMinor: 3900,
    currency: "EUR",
    fileVersion: "1.0",
    pdfFactory: generateCloudNativeReferenceStackPdf,
  });

  await seedBundle({
    slug: "devops-copy-paste-bundle",
    title: "DevOps Copy-Paste Bundle",
    description:
      "The Ansible playbook, Terraform library, and Kubernetes Recipes at a discount.",
    amountMinor: 8900,
    currency: "EUR",
    productSlugs: [
      "ansible-automation-playbook",
      "terraform-modules-library",
      "kubernetes-recipes",
    ],
  });

  await seedPolicy(
    "terms",
    "2026-05",
    "# Terms of Service\n\nThe canonical Terms of Service are rendered from `apps/web/src/app/(marketing)/terms/page.tsx`. This PolicyDocument row exists so checkout, invoice templates, and webhook receipts can reference a versioned identifier (terms@2026-05).",
  );
  await seedPolicy(
    "privacy",
    "2026-05",
    "# Privacy Policy\n\nThe canonical Privacy Policy is rendered from `apps/web/src/app/(marketing)/privacy/page.tsx`. This PolicyDocument row exists so checkout, invoice templates, and webhook receipts can reference a versioned identifier (privacy@2026-05).",
  );
  await seedPolicy(
    "refund-policy",
    "2026-05",
    [
      "# Refund Policy",
      "",
      "_Open Empower B.V., operator of CopyPasteLearn — Last updated: May 2026 (version 2026-05)_",
      "",
      "This Refund Policy explains when and how we issue refunds for purchases made on www.copypastelearn.com. It supplements, and does not override, mandatory consumer-protection rights granted to EU consumers under Directive 2011/83/EU and applicable national law.",
      "",
      "## 1. Statutory right of withdrawal (EU consumers)",
      "",
      "If you are an EU consumer (a natural person purchasing for non-professional purposes), you normally have **14 days** from the day of purchase to withdraw from the contract without giving a reason, under Art. 9 of Directive 2011/83/EU.",
      "",
      "**Important — digital content exception:** At checkout you explicitly consent to the immediate performance of the contract and acknowledge that, once performance has begun, you lose your right of withdrawal in accordance with Art. 16(m) of the Directive. Performance is deemed to have begun when:",
      "",
      "- you download any file from your order (ebooks, templates, playbooks), or",
      "- you start streaming any video lesson from a course or subscription, or",
      "- you launch any interactive lab session.",
      "",
      "If you have not started consuming the product within 14 days, you may still withdraw by emailing support@copypastelearn.com with your order ID and a written withdrawal statement.",
      "",
      "## 2. One-time digital products (ebooks, templates, playbooks)",
      "",
      "- **Full refund** within 14 days if no file from the order has been downloaded.",
      "- **No refund** once any file has been downloaded, except where required by mandatory law or if the file is materially defective and we are unable to provide a corrected version within a reasonable time.",
      "",
      "## 3. Course bundles and one-time course purchases",
      "",
      "- **Full refund** within 14 days if no lesson video has been started and no lab has been launched.",
      "- **Pro-rata refund** at our discretion if a documented technical issue prevented you from accessing more than 50% of the content during the first 30 days.",
      "",
      "## 4. Subscriptions",
      "",
      "- You can **cancel your subscription at any time** from your account dashboard or by emailing support. Cancellation stops the next renewal; you retain access until the end of the period you have already paid for.",
      "- We do **not** provide pro-rated refunds for unused portions of a paid period, except where required by law.",
      "- **First-period refund:** if you cancel within 14 days of your initial paid period and you have not viewed more than the first lesson of any course nor launched any paid lab, we will refund the period in full.",
      "",
      "## 5. Renewals",
      "",
      "Automatic renewals are charged to the payment method on file at the price displayed at the time of renewal. If a renewal is charged in error (for example, after a cancellation we failed to record), contact us within 30 days and we will refund the renewal in full.",
      "",
      "## 6. Defective or undelivered products",
      "",
      "If a product cannot be delivered, is materially defective, or does not match its description on the product page, you are entitled to repair, replacement, or a full refund regardless of whether you have started consuming it. Contact support@copypastelearn.com with your order ID and a description of the problem.",
      "",
      "## 7. How to request a refund",
      "",
      "Send an email to **support@copypastelearn.com** including:",
      "",
      "1. your order ID (visible in your purchase confirmation email and at `/library`);",
      "2. the email address associated with the purchase;",
      "3. the product or subscription you want refunded;",
      "4. a brief reason (optional but helpful).",
      "",
      "## 8. Processing time and method",
      "",
      "Approved refunds are issued to the **original payment method** within **14 days** of approval. Stripe usually returns funds within 5–10 business days, depending on your bank. We do not issue refunds in cash, store credit, or to a different payment method unless required by law.",
      "",
      "## 9. Chargebacks",
      "",
      "If you have a problem with a charge, please contact us first — most issues are resolved within a day. Initiating a chargeback without first attempting to contact us may result in account suspension while the dispute is being investigated.",
      "",
      "## 10. Contact",
      "",
      "Open Empower B.V. — Customer Support",
      "Email: support@copypastelearn.com",
    ].join("\n"),
  );
  await seedPolicy(
    "digital-delivery-policy",
    "2026-05",
    [
      "# Digital Delivery Policy",
      "",
      "_Open Empower B.V., operator of CopyPasteLearn — Last updated: May 2026 (version 2026-05)_",
      "",
      "This Digital Delivery Policy describes how and when you receive the digital products and services you buy on www.copypastelearn.com.",
      "",
      "## 1. Products covered",
      "",
      "- **Ebooks, templates, and playbooks** — delivered as downloadable files (PDF or archives of source files).",
      "- **Video courses** — streamed on demand inside your `/library` dashboard.",
      "- **Interactive labs** — ephemeral, browser-accessible sandbox environments.",
      "- **Subscriptions** — recurring access to a curated catalog of courses and labs.",
      "",
      "## 2. When delivery happens",
      "",
      "Delivery is **immediate**. As soon as Stripe confirms a successful payment (typically within seconds), our webhook provisions your entitlement. You will receive:",
      "",
      "1. an order confirmation email with your invoice attached, and",
      "2. a separate email with a time-limited access link for each file in the order.",
      "",
      "Your purchases also appear instantly in `/library` once you sign in with the email used at checkout.",
      "",
      "## 3. Time-limited access links",
      "",
      "Files are delivered through signed, time-limited URLs to protect both you and us against abuse:",
      "",
      "- **Validity:** each link expires **24 hours** after it is generated.",
      "- **Download cap:** each link allows up to **3 successful downloads**.",
      "- **Re-issuing:** you can mint a fresh link at any time from `/library`. The number of fresh links you can mint is not artificially limited; we monitor only for sharing patterns that suggest the link is being redistributed.",
      "",
      "If a link expires before you finish downloading, simply visit `/library` and request a new one.",
      "",
      "## 4. Streaming access (courses and labs)",
      "",
      "Course videos are streamed through Mux and are tied to your authenticated account. They cannot be downloaded; we provide unlimited replays for as long as your entitlement or subscription remains active.",
      "",
      "Lab environments are ephemeral. When you launch a lab, we provision a sandboxed container or VM for a limited duration (see the course page for per-lab caps). Anything you write inside the lab is destroyed at session end. **Do not store personal data, secrets, or production credentials inside a lab.**",
      "",
      "## 5. Lifetime updates",
      "",
      "Products marketed with &quot;lifetime updates&quot; entitle you to all future revisions of the same product for as long as we continue to maintain it. Updates appear in `/library` and we email you when a new version is published.",
      "",
      "&quot;Lifetime&quot; refers to the lifetime of the product, not the buyer; we may discontinue an individual product, but if we do we will give 90 days&apos; notice and let you download the final version before access ends.",
      "",
      "## 6. Compatibility and system requirements",
      "",
      "- **Ebooks:** PDF (any modern PDF reader).",
      "- **Templates / playbooks:** require the tool documented on the product page (Ansible, Terraform, Kubernetes, etc.).",
      "- **Video:** any modern browser; mobile browsers are supported.",
      "- **Labs:** desktop browser recommended; minimum 1 Mbps connection.",
      "",
      "We do not refund purchases for incompatibility that was disclosed on the product page before checkout. If you are unsure whether a product fits your environment, contact us **before** buying.",
      "",
      "## 7. Failed or missing delivery",
      "",
      "If you have not received your order confirmation within 30 minutes:",
      "",
      "1. check your spam / promotions folder;",
      "2. sign in to `/library` using the email used at checkout (entitlements provision in real-time);",
      "3. if the order is still missing, email support@copypastelearn.com with your order ID.",
      "",
      "We will deliver or fully refund any undelivered order reported within **30 days** of the original charge.",
      "",
      "## 8. Restrictions and license",
      "",
      "All deliveries are licensed for personal or single-organization use. Resale, sublicensing, or republication of the original files is not permitted; using the included code, templates, and snippets inside your own projects (including paid client work) is permitted. The full license terms are in our [Terms of Service](/terms).",
      "",
      "## 9. Customer responsibilities",
      "",
      "- Keep your account email up to date so delivery and renewal notices reach you.",
      "- Do not share access links or account credentials.",
      "- Back up the files you download; we keep them available in `/library`, but you are responsible for your local copies.",
      "",
      "## 10. Contact",
      "",
      "Open Empower B.V. — Customer Support",
      "Email: support@copypastelearn.com",
    ].join("\n"),
  );

  console.log("✅ Commerce seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
