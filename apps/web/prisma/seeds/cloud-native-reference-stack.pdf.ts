/**
 * PDF generator for "Cloud-Native Reference Stack".
 *
 * Opinionated, end-to-end reference architecture for a modern Kubernetes-
 * based platform: ingress + gateway, service mesh, observability,
 * GitOps, secrets, policy, supply chain, multi-tenancy, FinOps, DR.
 * Pick one tool per concern, ship to prod, scale to 100+ tenants.
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

export async function generateCloudNativeReferenceStackPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Cloud-Native Reference Stack",
    subject:
      "Opinionated end-to-end reference architecture for a modern Kubernetes-based platform - ingress, service mesh, observability, GitOps, secrets, policy, supply chain, FinOps.",
    keywords: [
      "kubernetes",
      "cloud-native",
      "platform",
      "argocd",
      "flux",
      "istio",
      "cilium",
      "envoy",
      "gatewayapi",
      "prometheus",
      "grafana",
      "loki",
      "tempo",
      "opentelemetry",
      "kyverno",
      "vault",
      "cosign",
      "sbom",
      "opencost",
    ],
    headerLeft: "Cloud-Native Reference Stack",
  });

  drawCover(ctx, {
    title: "Cloud-Native Reference Stack",
    subtitle: "One opinionated platform - 12 concerns, 1 tool each, ship to prod",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "The 12 concerns of a platform team",
    "Cluster baseline: Kubernetes version, runtime, CNI",
    "Ingress and Gateway API: Cilium / Envoy Gateway / NGINX",
    "Service mesh: Istio Ambient vs Linkerd vs Cilium",
    "Identity: SPIFFE / SPIRE workload identity",
    "GitOps: Argo CD app-of-apps reference layout",
    "Continuous Delivery: progressive rollouts with Argo Rollouts",
    "Secrets: External Secrets + Vault",
    "Policy: Kyverno baseline policies",
    "Supply chain: cosign + SBOM + Kyverno verify-images",
    "Observability: Prometheus + Loki + Tempo + Grafana + OTel",
    "SLOs and error budgets with sloth + Pyrra",
    "Backup and DR: Velero + cross-region pattern",
    "Multi-tenancy: namespace-per-tenant + ResourceQuota + NP",
    "Cost: OpenCost + chargeback report",
    "Developer portal: Backstage + scaffolder templates",
    "Database operators: CloudNativePG + Strimzi",
    "Object storage: MinIO operator + S3 SDK clients",
    "FinOps controls: rightsize + idle-detection",
    "Upgrade strategy: cluster + control-plane + addons",
    "Common errors and one-line fixes",
    "Reference repo layout",
    "Versioning, releases, and support",
    "License",
  ]);

  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "Cloud-Native Reference Stack is the platform-team handbook we hand to a 3-5 person team standing up a multi-tenant Kubernetes platform. Every concern (ingress, mesh, observability, GitOps, secrets, policy, supply chain, cost) is matched with exactly ONE tool plus a fallback, so you stop debating and start shipping.",
  );
  drawParagraph(
    ctx,
    "Every recipe is tested against Kubernetes 1.30 / 1.31 on EKS, GKE, AKS, and OpenShift 4.17. The stack scales from one cluster + 5 tenants to a 50-cluster fleet with 200+ tenants. Pick the recipes you need, ignore the rest, and grow incrementally.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "The 12-concern checklist platform teams use to scope themselves.",
    "One opinionated tool choice per concern - plus a 'when to switch' note.",
    "Argo CD app-of-apps reference layout with all 12 concerns wired up.",
    "Istio Ambient + Cilium L7 mesh decision tree.",
    "Prometheus + Loki + Tempo + OTel Collector + Grafana stack with SLO rules.",
    "Kyverno baseline policies that enforce PSS Restricted from day one.",
    "Supply-chain: cosign signing + SBOM with syft + Kyverno verify-images.",
    "OpenCost + chargeback report you can hand to finance.",
    "Backstage scaffolder templates for self-service tenant onboarding.",
    "Velero cross-region DR pattern + quarterly restore drill checklist.",
    "Reference monorepo layout for the platform team's git repo.",
    "Lifetime updates while the recipes are maintained, delivered via /library.",
  ]);

  // 2
  newPage(ctx);
  drawHeading(ctx, "2. The 12 concerns of a platform team", 1);
  drawBullets(ctx, [
    "1. Cluster baseline (Kubernetes version, runtime, CNI).",
    "2. Ingress / Gateway (north-south traffic).",
    "3. Service mesh (east-west traffic, mTLS, retries).",
    "4. Identity (workload + human, SPIFFE + OIDC).",
    "5. GitOps (declarative delivery).",
    "6. Continuous delivery (progressive rollouts).",
    "7. Secrets (Vault + External Secrets).",
    "8. Policy (Kyverno).",
    "9. Supply chain (signing + SBOM + verify-images).",
    "10. Observability (metrics + logs + traces + SLOs).",
    "11. Backup / DR (Velero).",
    "12. Cost (OpenCost + quotas + rightsizing).",
  ]);
  drawParagraph(
    ctx,
    "Cover every concern with one tool before adopting a second one for any concern. A 'good enough' tool deployed everywhere beats a 'perfect' tool covering 60% of the surface.",
  );

  // 3 baseline
  newPage(ctx);
  drawHeading(ctx, "3. Cluster baseline: Kubernetes version, runtime, CNI", 1);
  drawBullets(ctx, [
    "Kubernetes version: track N-1 (when 1.32 ships, run 1.31). Never N-2 unsupported.",
    "Container runtime: containerd 1.7+ everywhere; CRI-O fine on OpenShift.",
    "CNI: Cilium 1.16+ for eBPF + Hubble + Gateway API; Calico if you need stronger BGP.",
    "kube-proxy replacement: Cilium kube-proxy-free mode, saves a hop + adds Hubble visibility.",
    "Node OS: Ubuntu 24.04 / Talos / Bottlerocket - immutable + auto-patching wins.",
    "Logging driver: journald + fluent-bit DaemonSet shipping to Loki.",
  ]);

  // 4 ingress
  newPage(ctx);
  drawHeading(ctx, "4. Ingress and Gateway API: Cilium / Envoy Gateway / NGINX", 1);
  drawCode(
    ctx,
    [
      "apiVersion: gateway.networking.k8s.io/v1",
      "kind: Gateway",
      "metadata: { name: prod, namespace: gateway-system }",
      "spec:",
      "  gatewayClassName: cilium",
      "  listeners:",
      "    - name: https",
      "      hostname: \"*.example.com\"",
      "      port: 443",
      "      protocol: HTTPS",
      "      tls:",
      "        certificateRefs:",
      "          - kind: Secret",
      "            name: example-com-tls",
      "      allowedRoutes:",
      "        namespaces: { from: All }",
      "---",
      "apiVersion: gateway.networking.k8s.io/v1",
      "kind: HTTPRoute",
      "metadata: { name: web, namespace: tenant-a }",
      "spec:",
      "  parentRefs: [{ name: prod, namespace: gateway-system }]",
      "  hostnames: [\"app.example.com\"]",
      "  rules:",
      "    - matches: [{ path: { type: PathPrefix, value: / } }]",
      "      backendRefs: [{ name: web, port: 8080 }]",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Gateway API replaces Ingress for any 2025+ greenfield - more capable, vendor-portable.",
    "One platform-managed Gateway; tenants ship HTTPRoute objects from their own namespaces.",
    "Cilium Gateway is the simplest path; Envoy Gateway if you want vendor-neutrality.",
    "Always TLS-terminate at the Gateway; pair with cert-manager for Let's Encrypt.",
  ]);

  // 5 mesh
  newPage(ctx);
  drawHeading(ctx, "5. Service mesh: Istio Ambient vs Linkerd vs Cilium", 1);
  drawBullets(ctx, [
    "Istio Ambient (sidecar-less): best feature surface, lowest overhead, 1.24+ recommended.",
    "Linkerd: simplest, smallest binary, fewest knobs; pick for low-complexity teams.",
    "Cilium service mesh: same eBPF datapath; less mature L7 vs Istio Ambient (closing fast).",
    "Avoid: classic Istio sidecars (RAM/CPU footprint), Consul mesh (not container-native first).",
    "mTLS: enable strict mode cluster-wide; service-to-service identity from SPIFFE.",
  ]);

  // 6 identity
  newPage(ctx);
  drawHeading(ctx, "6. Identity: SPIFFE / SPIRE workload identity", 1);
  drawCode(
    ctx,
    [
      "apiVersion: spire.spiffe.io/v1alpha1",
      "kind: ClusterSPIFFEID",
      "metadata: { name: tenant-a-default }",
      "spec:",
      "  spiffeIDTemplate: \"spiffe://example.com/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}\"",
      "  podSelector:",
      "    matchLabels: { app.kubernetes.io/part-of: tenant-a }",
      "  workloadSelectorTemplates:",
      "    - \"k8s:ns:{{ .PodMeta.Namespace }}\"",
      "    - \"k8s:sa:{{ .PodSpec.ServiceAccountName }}\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "SPIFFE is the standard; SPIRE is the OSS implementation - integrates with Istio, Vault, OPA.",
    "Workload identity beats long-lived service-account tokens for cluster-to-cloud auth.",
    "Federate SPIRE across clusters for cross-cluster mTLS without manual cert distribution.",
    "Pair with Vault's JWT/OIDC auth method - SVID gates Vault secret access.",
  ]);

  // 7 GitOps
  newPage(ctx);
  drawHeading(ctx, "7. GitOps: Argo CD app-of-apps reference layout", 1);
  drawCode(
    ctx,
    [
      "platform/",
      "  bootstrap/",
      "    root-app.yaml         # the single Application that bootstraps the cluster",
      "  addons/",
      "    cilium.yaml",
      "    cert-manager.yaml",
      "    kyverno.yaml",
      "    external-secrets.yaml",
      "    kube-prometheus-stack.yaml",
      "    loki.yaml",
      "    tempo.yaml",
      "    otel-collector.yaml",
      "    velero.yaml",
      "    opencost.yaml",
      "    argo-rollouts.yaml",
      "    spire.yaml",
      "  policies/                # Kyverno ClusterPolicies",
      "  tenants/                 # one folder per tenant; ApplicationSet generates Apps",
      "    tenant-a/",
      "    tenant-b/",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Single root Application -> addons + policies + ApplicationSet over tenants. Done.",
    "ApplicationSet auto-creates Argo Application per tenant folder - tenants self-onboard via PR.",
    "Sync waves: addons wave -1 (CRDs), wave 0 (operators), wave 1 (workloads).",
    "Always `selfHeal: true` + `prune: true` - drift becomes a controller's problem, not yours.",
  ]);

  // 8 CD
  newPage(ctx);
  drawHeading(ctx, "8. Continuous Delivery: progressive rollouts with Argo Rollouts", 1);
  drawCode(
    ctx,
    [
      "apiVersion: argoproj.io/v1alpha1",
      "kind: Rollout",
      "metadata: { name: web, namespace: tenant-a }",
      "spec:",
      "  replicas: 5",
      "  strategy:",
      "    canary:",
      "      steps:",
      "        - setWeight: 10",
      "        - pause: { duration: 5m }",
      "        - analysis: { templates: [{ templateName: success-rate }] }",
      "        - setWeight: 50",
      "        - pause: { duration: 10m }",
      "        - analysis: { templates: [{ templateName: success-rate }] }",
      "        - setWeight: 100",
      "      trafficRouting:",
      "        plugins:",
      "          gatewayAPI:",
      "            httpRoute: web",
      "            namespace: tenant-a",
      "  selector: { matchLabels: { app: web } }",
      "  template: { metadata: { labels: { app: web } }, spec: { containers: [{ name: web, image: web:1.4.0 }] } }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Canary via Gateway API HTTPRoute weights - no extra Service / Ingress objects.",
    "AnalysisTemplate hits Prometheus for success-rate / latency; auto-aborts on regression.",
    "Always set a `pause` between weights - human-eye check beats every dashboard.",
    "Blue-green for stateful workloads; canary for stateless web/API.",
  ]);

  // 9 secrets
  newPage(ctx);
  drawHeading(ctx, "9. Secrets: External Secrets + Vault", 1);
  drawCode(
    ctx,
    [
      "apiVersion: external-secrets.io/v1beta1",
      "kind: ClusterSecretStore",
      "metadata: { name: vault }",
      "spec:",
      "  provider:",
      "    vault:",
      "      server: https://vault.example.com",
      "      path: kv",
      "      version: v2",
      "      auth:",
      "        kubernetes:",
      "          mountPath: kubernetes",
      "          role: external-secrets",
      "---",
      "apiVersion: external-secrets.io/v1beta1",
      "kind: ExternalSecret",
      "metadata: { name: db, namespace: tenant-a }",
      "spec:",
      "  secretStoreRef: { name: vault, kind: ClusterSecretStore }",
      "  target: { name: db, creationPolicy: Owner }",
      "  data:",
      "    - secretKey: password",
      "      remoteRef: { key: tenants/tenant-a/db, property: password }",
    ].join("\n"),
  );

  // 10 policy
  newPage(ctx);
  drawHeading(ctx, "10. Policy: Kyverno baseline policies", 1);
  drawCode(
    ctx,
    [
      "apiVersion: kyverno.io/v1",
      "kind: ClusterPolicy",
      "metadata: { name: require-resources }",
      "spec:",
      "  validationFailureAction: Enforce",
      "  rules:",
      "    - name: validate-resources",
      "      match: { any: [{ resources: { kinds: [Pod] } }] }",
      "      validate:",
      "        message: \"CPU and memory requests + limits are required.\"",
      "        pattern:",
      "          spec:",
      "            containers:",
      "              - resources:",
      "                  requests: { cpu: \"?*\", memory: \"?*\" }",
      "                  limits:   { cpu: \"?*\", memory: \"?*\" }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Ship the Kyverno `pod-security` policy set on day one; enforce PSS Restricted.",
    "Block `latest` tag, require liveness + readiness probes, require runAsNonRoot.",
    "Auto-generate ResourceQuota and NetworkPolicy when a tenant Namespace appears.",
    "Run policies in audit mode for 14 days BEFORE enforcing - measure blast radius.",
  ]);

  // 11 supply chain
  newPage(ctx);
  drawHeading(ctx, "11. Supply chain: cosign + SBOM + Kyverno verify-images", 1);
  drawCode(
    ctx,
    [
      "# CI step: sign + attest",
      "cosign sign --yes registry.example.com/web@${DIGEST}",
      "syft registry.example.com/web@${DIGEST} -o spdx-json > sbom.json",
      "cosign attest --predicate sbom.json --type spdxjson \\",
      "  --yes registry.example.com/web@${DIGEST}",
      "",
      "# Cluster: Kyverno admission rule",
      "apiVersion: kyverno.io/v2beta1",
      "kind: ClusterPolicy",
      "metadata: { name: verify-images }",
      "spec:",
      "  validationFailureAction: Enforce",
      "  rules:",
      "    - name: verify",
      "      match: { any: [{ resources: { kinds: [Pod] } }] }",
      "      verifyImages:",
      "        - imageReferences: [\"registry.example.com/*\"]",
      "          attestors:",
      "            - entries:",
      "                - keyless:",
      "                    subject: \"https://github.com/acme/.*\"",
      "                    issuer: \"https://token.actions.githubusercontent.com\"",
      "          attestations:",
      "            - predicateType: https://spdx.dev/Document",
      "              attestors: [{ entries: [{ keyless: { subject: \"https://github.com/acme/.*\", issuer: \"https://token.actions.githubusercontent.com\" } }] }]",
    ].join("\n"),
  );

  // 12 observability
  newPage(ctx);
  drawHeading(ctx, "12. Observability: Prometheus + Loki + Tempo + Grafana + OTel", 1);
  drawBullets(ctx, [
    "Metrics: kube-prometheus-stack 65+ (Prometheus 2.55+, Alertmanager, Grafana, 30+ dashboards).",
    "Logs: Loki 3.x in microservices mode + fluent-bit DaemonSet shipping nodes.",
    "Traces: Tempo 2.6+ + OTel Collector for ingest + tail-based sampling.",
    "Single Grafana for metrics + logs + traces + SLOs - one URL for every operator.",
    "Long-term storage: Mimir / Thanos for metrics, S3 backing for Loki + Tempo.",
    "Always per-tenant labels: drop `tenant=` cardinality with stream filters at the agent.",
  ]);
  drawCode(
    ctx,
    [
      "# otel-collector config (excerpt)",
      "receivers:",
      "  otlp: { protocols: { grpc: { endpoint: 0.0.0.0:4317 }, http: { endpoint: 0.0.0.0:4318 } } }",
      "processors:",
      "  batch: { send_batch_size: 1024, timeout: 5s }",
      "  tail_sampling:",
      "    decision_wait: 10s",
      "    policies:",
      "      - { name: errors, type: status_code, status_code: { status_codes: [ERROR] } }",
      "      - { name: latency, type: latency, latency: { threshold_ms: 1500 } }",
      "      - { name: 1pct,   type: probabilistic, probabilistic: { sampling_percentage: 1 } }",
      "exporters:",
      "  otlphttp: { endpoint: http://tempo:4318 }",
      "  prometheus: { endpoint: 0.0.0.0:9464 }",
      "  loki: { endpoint: http://loki-gateway/loki/api/v1/push }",
    ].join("\n"),
  );

  // 13 SLOs
  newPage(ctx);
  drawHeading(ctx, "13. SLOs and error budgets with sloth + Pyrra", 1);
  drawCode(
    ctx,
    [
      "apiVersion: sloth.slok.dev/v1",
      "kind: PrometheusServiceLevel",
      "metadata: { name: web, namespace: tenant-a }",
      "spec:",
      "  service: web",
      "  slos:",
      "    - name: availability",
      "      objective: 99.9",
      "      sli:",
      "        events:",
      "          error_query: sum(rate(http_requests_total{namespace=\"tenant-a\",app=\"web\",code=~\"5..\"}[5m]))",
      "          total_query: sum(rate(http_requests_total{namespace=\"tenant-a\",app=\"web\"}[5m]))",
      "      alerting:",
      "        name: WebAvailability",
      "        page_alert: { labels: { severity: page } }",
      "        ticket_alert: { labels: { severity: ticket } }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "sloth (or Pyrra) generates burn-rate alerts + recording rules from a high-level SLO spec.",
    "Two thresholds: fast-burn (page in 5 min) + slow-burn (ticket within 1 h).",
    "Per-tenant SLOs published to Grafana - drives chargeback + roadmap.",
    "Error-budget exhaustion freezes new deployments - automated via Argo CD sync window.",
  ]);

  // 14 backup
  newPage(ctx);
  drawHeading(ctx, "14. Backup and DR: Velero + cross-region pattern", 1);
  drawBullets(ctx, [
    "Tier 0 - cluster definitions (Crossplane / Terraform): backed by Git, replicated to 2 regions.",
    "Tier 1 - workloads (manifests): Argo CD source repo, mirrored to second region.",
    "Tier 2 - persistent volumes (Velero + CSI snapshots): nightly, ship to S3 cross-region.",
    "Tier 3 - secrets (Vault): native replication or DR snapshot every 6 h.",
    "Restore drill quarterly: restore a tenant namespace to a sandbox cluster, run smoke test.",
  ]);

  // 15 multi-tenancy
  newPage(ctx);
  drawHeading(ctx, "15. Multi-tenancy: namespace-per-tenant + ResourceQuota + NP", 1);
  drawCode(
    ctx,
    [
      "apiVersion: v1",
      "kind: Namespace",
      "metadata:",
      "  name: tenant-a",
      "  labels:",
      "    tenant: tenant-a",
      "    pod-security.kubernetes.io/enforce: restricted",
      "---",
      "apiVersion: v1",
      "kind: ResourceQuota",
      "metadata: { name: quota, namespace: tenant-a }",
      "spec:",
      "  hard:",
      "    requests.cpu: \"16\"",
      "    requests.memory: 64Gi",
      "    pods: \"200\"",
      "    services.loadbalancers: \"2\"",
      "---",
      "apiVersion: networking.k8s.io/v1",
      "kind: NetworkPolicy",
      "metadata: { name: default-deny, namespace: tenant-a }",
      "spec:",
      "  podSelector: {}",
      "  policyTypes: [Ingress, Egress]",
    ].join("\n"),
  );

  // 16 cost
  newPage(ctx);
  drawHeading(ctx, "16. Cost: OpenCost + chargeback report", 1);
  drawBullets(ctx, [
    "OpenCost (CNCF) computes per-namespace + per-label spend; integrates with AWS / GCP / Azure billing.",
    "Per-tenant chargeback report monthly: CPU $, memory $, storage $, egress $.",
    "Set alert: monthly spend variance > 30% versus 90-day average.",
    "Pair with Kubecost (commercial OpenCost variant) only if you need a richer UI.",
    "Show the bill to tenants weekly; behaviors change inside one billing cycle.",
  ]);
  drawCode(
    ctx,
    [
      "# Daily allocation export via OpenCost API",
      "curl -s \"http://opencost:9003/allocation?window=24h&aggregate=namespace,label:tenant\" \\",
      "  | jq '.data[] | { tenant: .properties.labels.tenant, cpu: .cpuCost, mem: .ramCost, storage: .pvCost, total: .totalCost }'",
    ].join("\n"),
  );

  // 17 backstage
  newPage(ctx);
  drawHeading(ctx, "17. Developer portal: Backstage + scaffolder templates", 1);
  drawCode(
    ctx,
    [
      "# scaffold template (excerpt) - new microservice with everything wired",
      "apiVersion: scaffolder.backstage.io/v1beta3",
      "kind: Template",
      "metadata: { name: new-service }",
      "spec:",
      "  parameters:",
      "    - title: name",
      "      properties: { name: { type: string } }",
      "  steps:",
      "    - id: fetch",
      "      action: fetch:template",
      "      input: { url: ./skeleton, values: { name: ${{ parameters.name }} } }",
      "    - id: publish",
      "      action: publish:github",
      "      input:",
      "        repoUrl: github.com?repo=${{ parameters.name }}&owner=acme",
      "    - id: register",
      "      action: catalog:register",
      "      input: { repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }} }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Backstage scaffolder is the front door - tenants spin up a repo + namespace + pipelines from a form.",
    "Skeleton includes Dockerfile + GitHub Actions + Argo CD manifests + Kyverno labels.",
    "Catalog every running workload; Backstage becomes the platform's single source of truth.",
  ]);

  // 18 db
  newPage(ctx);
  drawHeading(ctx, "18. Database operators: CloudNativePG + Strimzi", 1);
  drawCode(
    ctx,
    [
      "apiVersion: postgresql.cnpg.io/v1",
      "kind: Cluster",
      "metadata: { name: web-db, namespace: tenant-a }",
      "spec:",
      "  instances: 3",
      "  storage: { size: 100Gi, storageClass: gp3 }",
      "  postgresql:",
      "    parameters:",
      "      shared_buffers: \"2GB\"",
      "      max_connections: \"400\"",
      "  backup:",
      "    barmanObjectStore:",
      "      destinationPath: s3://backups/web-db",
      "      s3Credentials: { accessKeyId: { name: backup-creds, key: ak }, secretAccessKey: { name: backup-creds, key: sk } }",
      "    retentionPolicy: \"30d\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "CloudNativePG is the Postgres operator we recommend for 2025+ - barman + WAL + replication built in.",
    "Strimzi for Kafka; both operators are CNCF, both ship from RH and IBM mainline.",
    "Avoid running databases via Helm + StatefulSet manually - operators handle failover + backup.",
  ]);

  // 19 object storage
  newPage(ctx);
  drawHeading(ctx, "19. Object storage: MinIO operator + S3 SDK clients", 1);
  drawBullets(ctx, [
    "MinIO operator gives you S3-compatible storage inside the cluster - great for dev + air-gapped.",
    "Tenants get a per-namespace MinIO Tenant CR with bucket policies + service accounts.",
    "For prod: use cloud-native S3 / GCS / Blob; MinIO becomes a gateway for the on-prem use case.",
    "Every workload uses the AWS SDK - point at MinIO endpoint via env vars; zero code change.",
  ]);

  // 20 finops
  newPage(ctx);
  drawHeading(ctx, "20. FinOps controls: rightsize + idle-detection", 1);
  drawBullets(ctx, [
    "VPA in recommendation-only mode - emit `requests` recommendations; apply via PR not auto.",
    "Idle-pod detection: alert pods with <5% CPU and <30% RAM utilization for 7 days.",
    "Spot for batch and dev clusters; on-demand for prod (or 70/30 split via Karpenter).",
    "Auto-scaling thresholds tied to SLOs - HPA never scales past your error-budget capacity.",
  ]);

  // 21 upgrade
  newPage(ctx);
  drawHeading(ctx, "21. Upgrade strategy: cluster + control-plane + addons", 1);
  drawBullets(ctx, [
    "Cluster: blue/green pattern - stand up new cluster, drain tenants over a week, retire old.",
    "Control-plane (in-place): N -> N+1 minor every 4-6 weeks; dry-run with kubectl convert.",
    "Addons: pin chart_version; renovate-bot PRs weekly; merge into staging branch first.",
    "Workloads: tenants own their schema; platform team provides a deprecation calendar.",
  ]);

  // 22 errors
  newPage(ctx);
  drawHeading(ctx, "22. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "Argo CD Application OutOfSync: missing CRD - install Helm chart of operator before workloads.",
    "Kyverno blocks deploy: read the audit policy reports + add the missing label/annotation.",
    "External Secret stuck: Vault role binding missing; check kubernetes/auth/role/external-secrets.",
    "Tempo not receiving traces: OTel Collector endpoint wrong OR mTLS cert mismatch.",
    "Loki 5xx on push: ingester out of memory; bump memory + increase shards.",
    "Argo Rollouts canary stuck: AnalysisTemplate query returns no data - widen window.",
    "OpenCost cost = 0 for cloud: missing IAM permission for the billing API on the SA.",
    "Gateway HTTPRoute 503: backend Service has no endpoints; readiness probe broken.",
    "Cilium kube-proxy-free node not joining: missing kernel module br_netfilter.",
    "Backstage catalog stale: catalog-info.yaml URL changed - re-register the location.",
  ]);

  // 23 reference repo
  newPage(ctx);
  drawHeading(ctx, "23. Reference repo layout", 1);
  drawCode(
    ctx,
    [
      "platform-monorepo/",
      "  README.md",
      "  CODEOWNERS",
      "  clusters/",
      "    prod-eu/",
      "      bootstrap.yaml          # root Argo CD Application",
      "      addons/                 # all 12 concerns",
      "      policies/",
      "    prod-us/",
      "    staging/",
      "  tenants/",
      "    tenant-a/                 # one folder per tenant",
      "      namespace.yaml",
      "      quota.yaml",
      "      networkpolicy.yaml",
      "      applications/           # Argo CD Applications per workload",
      "  scaffolder/                 # Backstage templates",
      "  docs/                       # runbooks, SLO definitions, incident review templates",
      "  ci/                         # GitHub Actions / GitLab CI for the platform itself",
    ].join("\n"),
  );

  // 24 versioning
  newPage(ctx);
  drawHeading(ctx, "24. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks Kubernetes 1.30 / 1.31, Cilium 1.16+, Istio Ambient 1.24+, Argo CD 2.13+, Argo Rollouts 1.8+, External Secrets 0.10+, Kyverno 1.13+, kube-prometheus-stack 65+, Loki 3.x, Tempo 2.6+, OTel Collector 0.112+, Velero 1.15+, OpenCost 2.0+, Backstage 1.32+. Recipes are revalidated quarterly; updates ship via /library within 30 days.",
  );
  drawBullets(ctx, [
    "Sign in to https://www.copypastelearn.com/library to mint a fresh download link.",
    "Support: support@copypastelearn.com (one business day). Security: security@copypastelearn.com.",
  ]);

  // 25 license
  newPage(ctx);
  drawHeading(ctx, "25. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the recipes inside your own infrastructure projects, including projects you build for paying clients. You may not resell, sublicense, or republish the recipes as a standalone product.",
  );
  drawParagraph(
    ctx,
    "Kubernetes, Cilium, Istio, Linkerd, SPIFFE / SPIRE, Argo CD, Argo Rollouts, External Secrets, Vault, Kyverno, cosign, Prometheus, Loki, Tempo, Grafana, OpenTelemetry, Velero, OpenCost, Backstage, CloudNativePG, Strimzi, and MinIO are governed by their own open-source licenses - refer to upstream documentation for compliance details. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
