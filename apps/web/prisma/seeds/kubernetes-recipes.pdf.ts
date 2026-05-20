/**
 * PDF generator for the "Kubernetes Recipes" product.
 *
 * Multi-section production-grade cookbook derived from patterns mined from
 * kubernetesrecipes.github.io: namespaces, workload patterns, resource
 * management, probes, deployment strategies, autoscaling, configuration,
 * Ingress + Gateway API, cert-manager, RBAC, Pod Security Standards,
 * NetworkPolicy, Helm, Kustomize, GitOps, observability, logging, tracing,
 * debugging, cluster ops, and supply-chain security. Re-runnable from the
 * commerce seed; bytes are uploaded to Vercel Blob as the current
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

export async function generateKubernetesRecipesPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Kubernetes Recipes",
    subject:
      "Production-grade Kubernetes recipes: workloads, autoscaling, security, GitOps, observability, and debugging.",
    keywords: [
      "kubernetes",
      "k8s",
      "sre",
      "devops",
      "gitops",
      "argo-cd",
      "flux",
      "helm",
      "kustomize",
      "cert-manager",
      "prometheus",
      "observability",
    ],
    headerLeft: "Kubernetes Recipes",
  });

  // --- Cover ---
  drawCover(ctx, {
    title: "Kubernetes Recipes",
    subtitle: "Production-grade patterns for SRE teams running real clusters",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  // --- TOC ---
  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "Cluster layout and namespace strategy",
    "Workload patterns: Deployment, StatefulSet, DaemonSet, Job, CronJob",
    "Resource requests, limits, and QoS",
    "Health probes: liveness, readiness, startup",
    "Deployment strategies: Rolling, Blue-Green, Canary",
    "Autoscaling: HPA, VPA, Cluster Autoscaler, KEDA",
    "Configuration: ConfigMap, Secret, External Secrets, Vault",
    "Ingress and Gateway API",
    "TLS with cert-manager and Let's Encrypt",
    "RBAC: least-privilege ServiceAccounts and Roles",
    "Pod Security Standards and SecurityContext",
    "NetworkPolicy: default-deny with selective allow",
    "Helm: charts, values, hooks, dependencies",
    "Kustomize: base, overlays, components",
    "GitOps: Argo CD and Flux",
    "Observability: Prometheus, Grafana, Alertmanager",
    "Logging: structured JSON, Fluent Bit, Loki",
    "Tracing: OpenTelemetry, Jaeger, Tempo",
    "Debugging: CrashLoop, OOMKilled, ImagePullBackOff, DNS, Pending",
    "Cluster operations: etcd backup, drain, upgrades",
    "Supply chain: image scanning, signing, admission control",
    "Common errors and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  // --- 1. About ---
  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "Kubernetes Recipes is the production cookbook we hand to SRE engineers on their first day. It assumes you can already run kubectl and want to operate clusters at scale: multi-team namespaces, hardened pod security, GitOps delivery, full observability, and a debugging muscle memory that works at 03:00 on a Sunday.",
  );
  drawParagraph(
    ctx,
    "Every recipe has been validated against Kubernetes 1.29, 1.30, and 1.31 on managed (EKS, GKE, AKS, DOKS) and self-hosted clusters. The four design pillars are security by default, predictable rollouts, blast-radius isolation, and observability before the incident, not after.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Cluster layout templates: namespaces, ResourceQuota, LimitRange, RBAC, labels, GitOps repo structure.",
    "Workload patterns with decision matrix: Deployment vs StatefulSet vs DaemonSet vs Job vs CronJob.",
    "Hardened pod templates: requests + limits, probes, restricted Pod Security Standard, NetworkPolicy default-deny.",
    "Rollout playbooks: Rolling, Blue-Green via service selector switch, Canary with Argo Rollouts / Flagger.",
    "Autoscaling stack: metrics-server, HPA on CPU and custom metrics, Cluster Autoscaler, KEDA for queue-driven scaling.",
    "Helm and Kustomize patterns plus Argo CD Application and Flux Kustomization templates.",
    "Observability stack: kube-prometheus-stack, ServiceMonitor, PrometheusRule, Grafana, Alertmanager routing.",
    "Debugging runbook: the 7 most common failure modes with exact kubectl commands and fixes.",
    "Supply-chain hardening: Trivy scans, cosign signatures, Kyverno verify-images policies.",
    "Lifetime updates while the book is maintained, delivered via /library.",
  ]);

  // --- 2. Cluster layout ---
  newPage(ctx);
  drawHeading(ctx, "2. Cluster layout and namespace strategy", 1);
  drawParagraph(
    ctx,
    "One namespace per team or workload tier. Every namespace gets a ResourceQuota, a LimitRange, a default-deny NetworkPolicy, and scoped RBAC. Label everything so cost reporting, alert routing, and cross-namespace policies can be selector-driven.",
  );
  drawCode(
    ctx,
    [
      "apiVersion: v1",
      "kind: Namespace",
      "metadata:",
      "  name: production",
      "  labels:",
      "    environment: production",
      "    team: platform",
      "    cost-center: \"42\"",
      "    pod-security.kubernetes.io/enforce: restricted",
      "    pod-security.kubernetes.io/warn: restricted",
      "---",
      "apiVersion: v1",
      "kind: ResourceQuota",
      "metadata:",
      "  name: quota",
      "  namespace: production",
      "spec:",
      "  hard:",
      "    requests.cpu: \"100\"",
      "    requests.memory: 200Gi",
      "    limits.cpu: \"200\"",
      "    limits.memory: 400Gi",
      "    pods: \"200\"",
      "    services.loadbalancers: \"5\"",
      "    persistentvolumeclaims: \"50\"",
      "---",
      "apiVersion: v1",
      "kind: LimitRange",
      "metadata:",
      "  name: defaults",
      "  namespace: production",
      "spec:",
      "  limits:",
      "    - type: Container",
      "      default:        { cpu: 500m, memory: 512Mi }",
      "      defaultRequest: { cpu: 100m, memory: 128Mi }",
    ].join("\n"),
  );
  drawHeading(ctx, "GitOps repository structure", 3);
  drawCode(
    ctx,
    [
      "k8s-configs/",
      "  clusters/",
      "    prod-eu-west-1/",
      "      apps/",
      "      infra/",
      "    staging-eu-west-1/",
      "  apps/",
      "    api/",
      "      base/",
      "      overlays/",
      "        prod/",
      "        staging/",
      "  infra/",
      "    cert-manager/",
      "    ingress-nginx/",
      "    kube-prometheus-stack/",
      "    argo-cd/",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Never operate in 'default'; treat it as off-limits in production.",
    "Every namespace ships with quota + limit-range + default-deny NetworkPolicy + RBAC on first commit.",
    "Label namespaces by environment, team, and cost-center; downstream tooling reads those labels.",
    "Cluster-wide infra (cert-manager, ingress, monitoring) lives in its own folder, deployed before any app.",
  ]);

  // --- 3. Workload patterns ---
  newPage(ctx);
  drawHeading(ctx, "3. Workload patterns: Deployment, StatefulSet, DaemonSet, Job, CronJob", 1);
  drawParagraph(
    ctx,
    "Pick the workload type from state, ordering, and scheduling requirements - not familiarity. Deployments are for stateless apps. StatefulSets for anything with persistent identity (databases, brokers). DaemonSets for per-node agents. Job and CronJob for batch.",
  );
  drawHeading(ctx, "StatefulSet with persistent volumes", 3);
  drawCode(
    ctx,
    [
      "apiVersion: apps/v1",
      "kind: StatefulSet",
      "metadata:",
      "  name: postgres",
      "  namespace: production",
      "spec:",
      "  serviceName: postgres",
      "  replicas: 3",
      "  podManagementPolicy: OrderedReady",
      "  selector: { matchLabels: { app: postgres } }",
      "  template:",
      "    metadata: { labels: { app: postgres } }",
      "    spec:",
      "      containers:",
      "        - name: postgres",
      "          image: postgres:16",
      "          ports: [{ containerPort: 5432, name: pg }]",
      "          volumeMounts:",
      "            - { name: data, mountPath: /var/lib/postgresql/data }",
      "  volumeClaimTemplates:",
      "    - metadata: { name: data }",
      "      spec:",
      "        accessModes: [ReadWriteOnce]",
      "        storageClassName: fast-ssd",
      "        resources: { requests: { storage: 100Gi } }",
    ].join("\n"),
  );
  drawHeading(ctx, "Decision matrix", 3);
  drawBullets(ctx, [
    "Deployment: stateless apps, rolling updates, scale freely; needs readiness probes.",
    "StatefulSet: stable network identity, ordered start/stop, persistent storage per replica.",
    "DaemonSet: one pod per node (logging agent, CNI, node exporter); never use for app workloads.",
    "Job: one-shot batch work with completions and parallelism; backoffLimit caps retries.",
    "CronJob: scheduled work; set concurrencyPolicy: Forbid for non-idempotent jobs.",
  ]);

  // --- 4. Resource management ---
  newPage(ctx);
  drawHeading(ctx, "4. Resource requests, limits, and QoS", 1);
  drawParagraph(
    ctx,
    "Requests drive scheduling and node packing; limits drive enforcement and eviction order. The ratio between them defines QoS: Guaranteed (equal), Burstable (requests < limits), BestEffort (none). Under node pressure, BestEffort dies first, Guaranteed dies last.",
  );
  drawCode(
    ctx,
    [
      "resources:",
      "  requests:",
      "    cpu: 250m       # 0.25 cores, used for scheduling",
      "    memory: 256Mi   # binary units, used for scheduling",
      "  limits:",
      "    cpu: 500m       # CPU throttle ceiling",
      "    memory: 512Mi   # OOMKill above this",
      "",
      "# Guaranteed QoS (requests == limits)",
      "resources:",
      "  requests: { cpu: 500m, memory: 512Mi }",
      "  limits:   { cpu: 500m, memory: 512Mi }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always set BOTH requests and limits. BestEffort has no place in production.",
    "Set requests = limits for low-jitter, latency-sensitive workloads (databases, brokers).",
    "Set requests < limits for bursty workloads where occasional throttling is acceptable.",
    "CPU is millicores: 100m = 0.1 core. Memory is binary: Mi / Gi, never MB / GB.",
    "Measure first with `kubectl top pods` and Vertical Pod Autoscaler recommendations; do not guess.",
  ]);

  // --- 5. Probes ---
  newPage(ctx);
  drawHeading(ctx, "5. Health probes: liveness, readiness, startup", 1);
  drawParagraph(
    ctx,
    "Readiness gates traffic. Liveness restarts a stuck process. Startup gives slow-starting apps a wide window before liveness fires. The classic mistake is making liveness identical to readiness - a downstream outage then triggers cascading restarts.",
  );
  drawCode(
    ctx,
    [
      "startupProbe:",
      "  httpGet: { path: /healthz, port: 8080 }",
      "  failureThreshold: 30      # 30 * periodSeconds = 5 min max",
      "  periodSeconds: 10",
      "",
      "readinessProbe:",
      "  httpGet: { path: /ready, port: 8080 }",
      "  initialDelaySeconds: 0    # startup covers warmup",
      "  periodSeconds: 5",
      "  failureThreshold: 3",
      "",
      "livenessProbe:",
      "  httpGet: { path: /live, port: 8080 }",
      "  initialDelaySeconds: 0",
      "  periodSeconds: 10",
      "  failureThreshold: 3",
      "  timeoutSeconds: 2",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Liveness MUST NOT check downstream dependencies - it only asks 'is this process stuck?'.",
    "Readiness SHOULD check critical downstreams; pod is pulled from the Service when not ready.",
    "Use startupProbe for slow boots (JVMs, Rails) instead of bumping initialDelaySeconds on liveness.",
    "Probe timeoutSeconds: keep small (1-2s); a slow probe can mask the actual failure.",
    "TCP-only probes report half-open sockets as healthy - prefer HTTP wherever possible.",
  ]);

  // --- 6. Deployment strategies ---
  newPage(ctx);
  drawHeading(ctx, "6. Deployment strategies: Rolling, Blue-Green, Canary", 1);
  drawHeading(ctx, "RollingUpdate (default)", 3);
  drawCode(
    ctx,
    [
      "spec:",
      "  strategy:",
      "    type: RollingUpdate",
      "    rollingUpdate:",
      "      maxSurge: 25%",
      "      maxUnavailable: 0     # zero-downtime, slower",
      "  minReadySeconds: 10        # wait after ready before next replacement",
      "  progressDeadlineSeconds: 600",
    ].join("\n"),
  );
  drawHeading(ctx, "Blue-Green by switching the Service selector", 3);
  drawCode(
    ctx,
    [
      "# Two Deployments side-by-side: api-blue (live), api-green (new)",
      "apiVersion: v1",
      "kind: Service",
      "metadata: { name: api }",
      "spec:",
      "  selector: { app: api, version: blue }  # current",
      "  ports: [{ port: 80, targetPort: 8080 }]",
      "",
      "# Cutover - one atomic patch:",
      "# kubectl patch svc api -p '{\"spec\":{\"selector\":{\"version\":\"green\"}}}'",
      "# Roll back - patch back to blue.",
    ].join("\n"),
  );
  drawHeading(ctx, "Canary with Argo Rollouts", 3);
  drawCode(
    ctx,
    [
      "apiVersion: argoproj.io/v1alpha1",
      "kind: Rollout",
      "metadata: { name: api }",
      "spec:",
      "  replicas: 10",
      "  strategy:",
      "    canary:",
      "      steps:",
      "        - setWeight: 10",
      "        - pause: { duration: 5m }",
      "        - setWeight: 25",
      "        - pause: { duration: 5m }",
      "        - setWeight: 50",
      "        - pause: { duration: 10m }",
      "        - setWeight: 100",
      "      analysis:",
      "        templates: [{ templateName: success-rate }]",
      "        startingStep: 1",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "RollingUpdate maxUnavailable: 0 for zero-downtime; maxSurge: 25% for speed.",
    "Blue-Green: instant cutover and rollback, but needs 2x capacity during the switch.",
    "Canary: 10 -> 25 -> 50 -> 100 percent with pauses long enough for your error budget to react.",
    "Always pair canary with automated analysis (success rate, latency); manual eyeballs are not a strategy.",
  ]);

  // --- 7. Autoscaling ---
  newPage(ctx);
  drawHeading(ctx, "7. Autoscaling: HPA, VPA, Cluster Autoscaler, KEDA", 1);
  drawCode(
    ctx,
    [
      "apiVersion: autoscaling/v2",
      "kind: HorizontalPodAutoscaler",
      "metadata: { name: api }",
      "spec:",
      "  scaleTargetRef:",
      "    apiVersion: apps/v1",
      "    kind: Deployment",
      "    name: api",
      "  minReplicas: 3",
      "  maxReplicas: 30",
      "  metrics:",
      "    - type: Resource",
      "      resource:",
      "        name: cpu",
      "        target: { type: Utilization, averageUtilization: 70 }",
      "    - type: Pods",
      "      pods:",
      "        metric: { name: http_requests_per_second }",
      "        target: { type: AverageValue, averageValue: \"1k\" }",
      "  behavior:",
      "    scaleDown:",
      "      stabilizationWindowSeconds: 300",
      "      policies: [{ type: Percent, value: 50, periodSeconds: 60 }]",
    ].join("\n"),
  );
  drawHeading(ctx, "KEDA ScaledObject for queue-driven scaling", 3);
  drawCode(
    ctx,
    [
      "apiVersion: keda.sh/v1alpha1",
      "kind: ScaledObject",
      "metadata: { name: worker }",
      "spec:",
      "  scaleTargetRef: { name: worker }",
      "  minReplicaCount: 0",
      "  maxReplicaCount: 50",
      "  triggers:",
      "    - type: aws-sqs-queue",
      "      metadata:",
      "        queueURL: https://sqs.eu-west-1.amazonaws.com/.../jobs",
      "        queueLength: \"30\"",
      "        awsRegion: eu-west-1",
      "      authenticationRef: { name: aws-irsa-creds }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Setup order: requests -> metrics-server -> HPA -> Cluster Autoscaler -> KEDA.",
    "HPA needs requests on the deployment; without them it cannot compute utilization.",
    "stabilizationWindowSeconds prevents flapping; 5 minutes scale-down is a safe default.",
    "VPA in Recommender mode helps you size requests; do not run Auto mode alongside HPA on CPU.",
    "KEDA scales to zero - perfect for event-driven workers; pair with PriorityClass on critical apps.",
  ]);

  // --- 8. Configuration ---
  newPage(ctx);
  drawHeading(ctx, "8. Configuration: ConfigMap, Secret, External Secrets, Vault", 1);
  drawCode(
    ctx,
    [
      "apiVersion: v1",
      "kind: ConfigMap",
      "metadata: { name: app-config }",
      "immutable: true",
      "data:",
      "  LOG_LEVEL: info",
      "  MAX_CONNECTIONS: \"100\"",
      "---",
      "apiVersion: v1",
      "kind: Secret",
      "metadata: { name: app-secrets }",
      "type: Opaque",
      "stringData:",
      "  DATABASE_URL: postgresql://app:placeholder@db:5432/app",
    ].join("\n"),
  );
  drawHeading(ctx, "External Secrets Operator pulling from AWS Secrets Manager", 3);
  drawCode(
    ctx,
    [
      "apiVersion: external-secrets.io/v1beta1",
      "kind: ExternalSecret",
      "metadata: { name: app-db }",
      "spec:",
      "  refreshInterval: 1h",
      "  secretStoreRef:",
      "    name: aws-secrets",
      "    kind: ClusterSecretStore",
      "  target:",
      "    name: app-db",
      "    creationPolicy: Owner",
      "  data:",
      "    - secretKey: DATABASE_URL",
      "      remoteRef:",
      "        key: prod/app/database",
      "        property: url",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Never commit a real Secret; commit ExternalSecret manifests instead.",
    "Mark ConfigMaps `immutable: true` once stable - the API server stops watching them, saving etcd load.",
    "Mount Secrets as files when the app supports it; environment variables leak via `kubectl describe`.",
    "Rotate via External Secrets refreshInterval or Vault Agent Injector; do not hand-edit Secrets in prod.",
  ]);

  // --- 9. Ingress / Gateway API ---
  newPage(ctx);
  drawHeading(ctx, "9. Ingress and Gateway API", 1);
  drawCode(
    ctx,
    [
      "# Classic Ingress (NGINX)",
      "apiVersion: networking.k8s.io/v1",
      "kind: Ingress",
      "metadata:",
      "  name: api",
      "  annotations:",
      "    cert-manager.io/cluster-issuer: letsencrypt-prod",
      "    nginx.ingress.kubernetes.io/limit-rps: \"100\"",
      "spec:",
      "  ingressClassName: nginx",
      "  tls:",
      "    - hosts: [api.example.com]",
      "      secretName: api-tls",
      "  rules:",
      "    - host: api.example.com",
      "      http:",
      "        paths:",
      "          - path: /",
      "            pathType: Prefix",
      "            backend:",
      "              service: { name: api, port: { number: 80 } }",
    ].join("\n"),
  );
  drawHeading(ctx, "Gateway API HTTPRoute", 3);
  drawCode(
    ctx,
    [
      "apiVersion: gateway.networking.k8s.io/v1",
      "kind: HTTPRoute",
      "metadata: { name: api }",
      "spec:",
      "  parentRefs: [{ name: external-gateway, namespace: gateway-system }]",
      "  hostnames: [api.example.com]",
      "  rules:",
      "    - matches: [{ path: { type: PathPrefix, value: /v1 } }]",
      "      backendRefs:",
      "        - name: api-v1",
      "          port: 80",
      "          weight: 90",
      "        - name: api-v2",
      "          port: 80",
      "          weight: 10  # canary",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Use Gateway API for new clusters; Ingress is fine for legacy environments but is feature-frozen.",
    "Always terminate TLS at the gateway and re-encrypt with mTLS via service mesh if compliance demands it.",
    "Annotations like rate-limit and connection-limit live on the Ingress; keep them in version control.",
    "Canary by weighted backendRefs on HTTPRoute - much cleaner than Ingress annotation hacks.",
  ]);

  // --- 10. cert-manager ---
  newPage(ctx);
  drawHeading(ctx, "10. TLS with cert-manager and Let's Encrypt", 1);
  drawCode(
    ctx,
    [
      "apiVersion: cert-manager.io/v1",
      "kind: ClusterIssuer",
      "metadata: { name: letsencrypt-prod }",
      "spec:",
      "  acme:",
      "    server: https://acme-v02.api.letsencrypt.org/directory",
      "    email: ops@example.com",
      "    privateKeySecretRef: { name: letsencrypt-prod }",
      "    solvers:",
      "      - http01:",
      "          ingress: { ingressClassName: nginx }",
      "      - dns01:",
      "          route53:",
      "            region: eu-west-1",
      "        selector:",
      "          dnsZones: [\"example.com\"]",
      "---",
      "apiVersion: cert-manager.io/v1",
      "kind: Certificate",
      "metadata: { name: wildcard-example-com }",
      "spec:",
      "  secretName: wildcard-example-com-tls",
      "  issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }",
      "  commonName: \"*.example.com\"",
      "  dnsNames: [\"example.com\", \"*.example.com\"]",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Start every new environment against letsencrypt-staging until issuance succeeds; the prod rate limit is unforgiving.",
    "HTTP-01 requires port 80 on a public IP; DNS-01 is the only path for wildcards.",
    "cert-manager renews 30 days before expiry; alert on `certificate_expiration_timestamp_seconds < 7d`.",
    "Store the Issuer's ACME account key with `privateKeySecretRef`; back it up.",
  ]);

  // --- 11. RBAC ---
  newPage(ctx);
  drawHeading(ctx, "11. RBAC: least-privilege ServiceAccounts and Roles", 1);
  drawCode(
    ctx,
    [
      "apiVersion: v1",
      "kind: ServiceAccount",
      "metadata:",
      "  name: api",
      "  namespace: production",
      "automountServiceAccountToken: false   # opt-in only",
      "---",
      "apiVersion: rbac.authorization.k8s.io/v1",
      "kind: Role",
      "metadata: { name: api-reader, namespace: production }",
      "rules:",
      "  - apiGroups: [\"\"]",
      "    resources: [\"configmaps\", \"secrets\"]",
      "    resourceNames: [\"app-config\", \"app-db\"]",
      "    verbs: [\"get\", \"list\", \"watch\"]",
      "---",
      "apiVersion: rbac.authorization.k8s.io/v1",
      "kind: RoleBinding",
      "metadata: { name: api-reader, namespace: production }",
      "subjects:",
      "  - kind: ServiceAccount",
      "    name: api",
      "    namespace: production",
      "roleRef:",
      "  kind: Role",
      "  name: api-reader",
      "  apiGroup: rbac.authorization.k8s.io",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Start from zero permissions; add verbs and resourceNames until the app works, then stop.",
    "Test every binding with `kubectl auth can-i get pods --as=system:serviceaccount:ns:sa`.",
    "Namespace-scoped Roles for app workloads; ClusterRole only for cluster-wide controllers.",
    "Set `automountServiceAccountToken: false` on every ServiceAccount unless the pod actually needs the API.",
    "Audit RoleBindings monthly with `kubectl get rolebinding,clusterrolebinding -A -o wide`.",
  ]);

  // --- 12. Pod Security ---
  newPage(ctx);
  drawHeading(ctx, "12. Pod Security Standards and SecurityContext", 1);
  drawParagraph(
    ctx,
    "Pod Security Standards (PSS) ship three profiles - privileged, baseline, restricted - applied via namespace labels in three modes (enforce, audit, warn). Restricted is the production default; baseline is the bare minimum.",
  );
  drawCode(
    ctx,
    [
      "# Namespace label - enforce restricted, warn on violations",
      "apiVersion: v1",
      "kind: Namespace",
      "metadata:",
      "  name: production",
      "  labels:",
      "    pod-security.kubernetes.io/enforce: restricted",
      "    pod-security.kubernetes.io/enforce-version: latest",
      "    pod-security.kubernetes.io/warn: restricted",
      "    pod-security.kubernetes.io/audit: restricted",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Restricted-compliant Pod template",
      "spec:",
      "  automountServiceAccountToken: false",
      "  securityContext:",
      "    runAsNonRoot: true",
      "    runAsUser: 10001",
      "    runAsGroup: 10001",
      "    fsGroup: 10001",
      "    seccompProfile: { type: RuntimeDefault }",
      "  containers:",
      "    - name: app",
      "      image: registry.example.com/app:1.4.0",
      "      securityContext:",
      "        allowPrivilegeEscalation: false",
      "        readOnlyRootFilesystem: true",
      "        runAsNonRoot: true",
      "        capabilities: { drop: [\"ALL\"] }",
      "      volumeMounts:",
      "        - { name: tmp, mountPath: /tmp }",
      "  volumes:",
      "    - { name: tmp, emptyDir: {} }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Roll out PSS as `warn` first, monitor admission webhook events for one week, then flip to `enforce`.",
    "readOnlyRootFilesystem: true is the single highest-impact hardening flag; pair with emptyDir for /tmp.",
    "capabilities.drop: [ALL] then add back NET_BIND_SERVICE only if the app must bind a privileged port.",
    "seccompProfile.type: RuntimeDefault filters out a huge slice of kernel attack surface for free.",
  ]);

  // --- 13. NetworkPolicy ---
  newPage(ctx);
  drawHeading(ctx, "13. NetworkPolicy: default-deny with selective allow", 1);
  drawCode(
    ctx,
    [
      "apiVersion: networking.k8s.io/v1",
      "kind: NetworkPolicy",
      "metadata: { name: default-deny, namespace: production }",
      "spec:",
      "  podSelector: {}",
      "  policyTypes: [Ingress, Egress]",
      "---",
      "apiVersion: networking.k8s.io/v1",
      "kind: NetworkPolicy",
      "metadata: { name: allow-dns, namespace: production }",
      "spec:",
      "  podSelector: {}",
      "  policyTypes: [Egress]",
      "  egress:",
      "    - to:",
      "        - namespaceSelector:",
      "            matchLabels:",
      "              kubernetes.io/metadata.name: kube-system",
      "      ports:",
      "        - { protocol: UDP, port: 53 }",
      "        - { protocol: TCP, port: 53 }",
      "---",
      "apiVersion: networking.k8s.io/v1",
      "kind: NetworkPolicy",
      "metadata: { name: api-to-db, namespace: production }",
      "spec:",
      "  podSelector: { matchLabels: { app: postgres } }",
      "  policyTypes: [Ingress]",
      "  ingress:",
      "    - from:",
      "        - podSelector: { matchLabels: { app: api } }",
      "      ports:",
      "        - { protocol: TCP, port: 5432 }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Apply default-deny FIRST in a new namespace, then add the allow rules; do it the other way around and you race.",
    "After default-deny pods cannot resolve DNS - the allow-dns rule is mandatory, not optional.",
    "Use namespaceSelector + podSelector for cross-namespace allows; never wildcard-allow a whole namespace.",
    "Test with `kubectl run netshoot --rm -it --image=nicolaka/netshoot -- /bin/bash` from inside the namespace.",
  ]);

  // --- 14. Helm ---
  newPage(ctx);
  drawHeading(ctx, "14. Helm: charts, values, hooks, dependencies", 1);
  drawCode(
    ctx,
    [
      "# Chart.yaml",
      "apiVersion: v2",
      "name: myapp",
      "version: 1.4.0",
      "appVersion: \"2.0.1\"",
      "dependencies:",
      "  - name: postgresql",
      "    version: \"15.5.x\"",
      "    repository: https://charts.bitnami.com/bitnami",
      "    condition: postgresql.enabled",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# templates/migration-job.yaml - pre-upgrade hook",
      "apiVersion: batch/v1",
      "kind: Job",
      "metadata:",
      "  name: {{ include \"myapp.fullname\" . }}-migrate",
      "  annotations:",
      "    helm.sh/hook: pre-upgrade,pre-install",
      "    helm.sh/hook-weight: \"-5\"",
      "    helm.sh/hook-delete-policy: hook-succeeded,before-hook-creation",
      "spec:",
      "  template:",
      "    spec:",
      "      restartPolicy: Never",
      "      containers:",
      "        - name: migrate",
      "          image: \"{{ .Values.image.repository }}:{{ .Chart.AppVersion }}\"",
      "          command: [\"./manage.py\", \"migrate\"]",
    ].join("\n"),
  );
  drawHeading(ctx, "Useful Sprig idioms", 3);
  drawCode(
    ctx,
    [
      "# Conditional include",
      "{{- if .Values.ingress.enabled }}",
      "...",
      "{{- end }}",
      "",
      "# Default values",
      "{{ .Values.replicaCount | default 3 }}",
      "",
      "# Required values fail-fast",
      "{{ required \"image.repository is required\" .Values.image.repository }}",
      "",
      "# Convert to YAML safely",
      "{{ toYaml .Values.nodeSelector | nindent 8 }}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pin chart dependencies by patch version (15.5.x). Major version pins are reckless.",
    "Use `helm template` in CI to render and lint - never push untested values to prod.",
    "Hooks: pre-install / pre-upgrade for migrations, post-install for smoke tests; always set delete-policy.",
    "Keep templates dumb and values declarative; complex Sprig logic belongs in code, not in YAML.",
  ]);

  // --- 15. Kustomize ---
  newPage(ctx);
  drawHeading(ctx, "15. Kustomize: base, overlays, components", 1);
  drawCode(
    ctx,
    [
      "# base/kustomization.yaml",
      "apiVersion: kustomize.config.k8s.io/v1beta1",
      "kind: Kustomization",
      "resources:",
      "  - deployment.yaml",
      "  - service.yaml",
      "  - configmap.yaml",
      "commonLabels:",
      "  app.kubernetes.io/name: api",
      "  app.kubernetes.io/managed-by: kustomize",
      "",
      "# overlays/production/kustomization.yaml",
      "apiVersion: kustomize.config.k8s.io/v1beta1",
      "kind: Kustomization",
      "namespace: production",
      "resources:",
      "  - ../../base",
      "components:",
      "  - ../../components/hpa",
      "  - ../../components/networkpolicy",
      "images:",
      "  - name: api",
      "    newName: registry.example.com/api",
      "    newTag: 1.4.0",
      "patches:",
      "  - target: { kind: Deployment, name: api }",
      "    patch: |-",
      "      - op: replace",
      "        path: /spec/replicas",
      "        value: 6",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "base/ holds the minimum runnable manifest; overlays/ patches per environment.",
    "Components are reusable bundles (HPA, NetworkPolicy, PodDisruptionBudget) you mix into overlays.",
    "Pin images via the `images:` block; never rely on `latest` tags in any environment.",
    "Validate with `kustomize build overlays/production | kubeconform -strict -summary`.",
  ]);

  // --- 16. GitOps ---
  newPage(ctx);
  drawHeading(ctx, "16. GitOps: Argo CD and Flux", 1);
  drawHeading(ctx, "Argo CD Application", 3);
  drawCode(
    ctx,
    [
      "apiVersion: argoproj.io/v1alpha1",
      "kind: Application",
      "metadata:",
      "  name: api-production",
      "  namespace: argocd",
      "spec:",
      "  project: default",
      "  source:",
      "    repoURL: git@github.com:acme/k8s-configs.git",
      "    targetRevision: HEAD",
      "    path: apps/api/overlays/production",
      "  destination:",
      "    server: https://kubernetes.default.svc",
      "    namespace: production",
      "  syncPolicy:",
      "    automated: { prune: true, selfHeal: true }",
      "    syncOptions:",
      "      - CreateNamespace=true",
      "      - ApplyOutOfSyncOnly=true",
      "    retry:",
      "      limit: 5",
      "      backoff: { duration: 5s, factor: 2, maxDuration: 3m }",
    ].join("\n"),
  );
  drawHeading(ctx, "Flux Kustomization + HelmRelease", 3);
  drawCode(
    ctx,
    [
      "apiVersion: kustomize.toolkit.fluxcd.io/v1",
      "kind: Kustomization",
      "metadata: { name: apps-prod, namespace: flux-system }",
      "spec:",
      "  interval: 5m",
      "  path: ./clusters/prod-eu-west-1",
      "  prune: true",
      "  sourceRef: { kind: GitRepository, name: configs }",
      "---",
      "apiVersion: helm.toolkit.fluxcd.io/v2",
      "kind: HelmRelease",
      "metadata: { name: ingress-nginx, namespace: ingress-nginx }",
      "spec:",
      "  interval: 10m",
      "  chart:",
      "    spec:",
      "      chart: ingress-nginx",
      "      version: \"4.x.x\"",
      "      sourceRef:",
      "        kind: HelmRepository",
      "        name: ingress-nginx",
      "        namespace: flux-system",
      "  values:",
      "    controller:",
      "      replicaCount: 3",
      "      service: { externalTrafficPolicy: Local }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Git is the only source of truth; `kubectl apply` in prod is a paging-worthy incident.",
    "Enable prune + selfHeal so drift is reconciled automatically.",
    "Use Argo CD ApplicationSet to fan out to many clusters from one definition.",
    "Track image updates with Flux Image Automation or Argo CD Image Updater - signed by a CI job, never humans.",
  ]);

  // --- 17. Observability ---
  newPage(ctx);
  drawHeading(ctx, "17. Observability: Prometheus, Grafana, Alertmanager", 1);
  drawCode(
    ctx,
    [
      "apiVersion: monitoring.coreos.com/v1",
      "kind: ServiceMonitor",
      "metadata:",
      "  name: api",
      "  namespace: production",
      "  labels: { release: kube-prometheus-stack }",
      "spec:",
      "  selector: { matchLabels: { app: api } }",
      "  endpoints:",
      "    - port: metrics",
      "      interval: 30s",
      "      path: /metrics",
      "---",
      "apiVersion: monitoring.coreos.com/v1",
      "kind: PrometheusRule",
      "metadata:",
      "  name: api-slo",
      "  namespace: production",
      "  labels: { release: kube-prometheus-stack }",
      "spec:",
      "  groups:",
      "    - name: api.slo",
      "      rules:",
      "        - alert: ApiHighErrorRate",
      "          expr: |",
      "            sum(rate(http_requests_total{job=\"api\",status=~\"5..\"}[5m]))",
      "            /",
      "            sum(rate(http_requests_total{job=\"api\"}[5m])) > 0.01",
      "          for: 10m",
      "          labels: { severity: page }",
      "          annotations:",
      "            summary: \"API error rate above 1% for 10m\"",
    ].join("\n"),
  );
  drawHeading(ctx, "Alertmanager routing skeleton", 3);
  drawCode(
    ctx,
    [
      "route:",
      "  receiver: default",
      "  group_by: [alertname, cluster, namespace]",
      "  group_wait: 30s",
      "  group_interval: 5m",
      "  repeat_interval: 4h",
      "  routes:",
      "    - matchers: [severity=\"page\"]",
      "      receiver: pagerduty",
      "      continue: true",
      "    - matchers: [severity=\"ticket\"]",
      "      receiver: jira",
      "receivers:",
      "  - name: pagerduty",
      "    pagerduty_configs:",
      "      - service_key: <integration-key>",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Install kube-prometheus-stack; the ServiceMonitor `release` label must match the Helm release name.",
    "Alert on symptoms (latency, error rate, saturation), not causes (CPU > 80%) - SLO-driven alerting.",
    "Tier alerts: page (wake humans), ticket (next business day), info (dashboards only).",
    "Build runbook URLs into the alert annotations - on-call engineers should never have to grep wikis at 03:00.",
  ]);

  // --- 18. Logging ---
  newPage(ctx);
  drawHeading(ctx, "18. Logging: structured JSON, Fluent Bit, Loki", 1);
  drawCode(
    ctx,
    [
      "{",
      "  \"timestamp\": \"2026-05-20T10:30:00Z\",",
      "  \"level\": \"INFO\",",
      "  \"service\": \"api\",",
      "  \"trace_id\": \"4bf92f3577b34da6a3ce929d0e0e4736\",",
      "  \"request_id\": \"req-abc-123\",",
      "  \"method\": \"POST\",",
      "  \"path\": \"/v1/orders\",",
      "  \"status\": 201,",
      "  \"duration_ms\": 47,",
      "  \"user_id\": \"u-42\",",
      "  \"message\": \"order created\"",
      "}",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Useful kubectl logging one-liners",
      "kubectl logs -n production -l app=api --tail=200 -f",
      "kubectl logs -n production -l app=api --since=15m --prefix",
      "kubectl logs -n production deploy/api -c sidecar --previous",
      "stern -n production api --tail 50          # multi-pod tail",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Log to stdout/stderr only; the kubelet captures, your aggregator collects.",
    "Use structured JSON; flat text is two orders of magnitude harder to query in Loki / Elastic.",
    "Always include trace_id, request_id, and a stable service name to correlate with traces.",
    "Set DEBUG level via env var driven by the ConfigMap; flip it without rebuilding the image.",
  ]);

  // --- 19. Tracing ---
  newPage(ctx);
  drawHeading(ctx, "19. Tracing: OpenTelemetry, Jaeger, Tempo", 1);
  drawCode(
    ctx,
    [
      "apiVersion: opentelemetry.io/v1beta1",
      "kind: OpenTelemetryCollector",
      "metadata: { name: otel, namespace: observability }",
      "spec:",
      "  mode: daemonset",
      "  config:",
      "    receivers:",
      "      otlp:",
      "        protocols:",
      "          grpc: { endpoint: 0.0.0.0:4317 }",
      "          http: { endpoint: 0.0.0.0:4318 }",
      "    processors:",
      "      batch: {}",
      "      memory_limiter:",
      "        check_interval: 5s",
      "        limit_percentage: 75",
      "    exporters:",
      "      otlp/tempo:",
      "        endpoint: tempo.observability.svc:4317",
      "        tls: { insecure: true }",
      "    service:",
      "      pipelines:",
      "        traces:",
      "          receivers: [otlp]",
      "          processors: [memory_limiter, batch]",
      "          exporters: [otlp/tempo]",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Use the OpenTelemetry Collector as the only telemetry pipeline - apps speak OTLP, the collector fans out.",
    "DaemonSet collector on every node reduces network hops; sidecar collector for mTLS-sensitive workloads.",
    "Always batch + memory-limit; an unbounded collector will OOM the node.",
    "Propagate W3C traceparent headers through every hop (Ingress, service mesh, message queue).",
  ]);

  // --- 20. Debugging ---
  newPage(ctx);
  drawHeading(ctx, "20. Debugging: CrashLoop, OOMKilled, ImagePullBackOff, DNS, Pending", 1);
  drawCode(
    ctx,
    [
      "# 1) CrashLoopBackOff",
      "kubectl describe pod <pod> | sed -n '/Last State/,/Restart/p'",
      "kubectl logs <pod> --previous",
      "# exit 137 -> OOMKilled; exit 1 -> app error; exit 143 -> SIGTERM (graceful shutdown)",
      "",
      "# 2) OOMKilled",
      "kubectl top pod <pod> --containers",
      "kubectl set resources deploy/<name> --limits=memory=1Gi --requests=memory=512Mi",
      "",
      "# 3) ImagePullBackOff",
      "kubectl describe pod <pod> | grep -i 'failed to pull'",
      "kubectl create secret docker-registry regcred \\",
      "  --docker-server=registry.example.com \\",
      "  --docker-username=ci --docker-password=$TOKEN",
      "kubectl patch sa default -p '{\"imagePullSecrets\":[{\"name\":\"regcred\"}]}'",
      "",
      "# 4) DNS resolution",
      "kubectl run dnsutils --rm -it --image=registry.k8s.io/e2e-test-images/jessie-dnsutils:1.7 \\",
      "  -- nslookup kubernetes.default",
      "kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100",
      "",
      "# 5) Pending pod",
      "kubectl describe pod <pod> | sed -n '/Events:/,$p'",
      "kubectl top nodes",
      "",
      "# 6) Ephemeral container for live debug",
      "kubectl debug -it <pod> --image=nicolaka/netshoot --target=<container>",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always reach for `kubectl describe` BEFORE `kubectl logs` - events tell you what is happening.",
    "Exit 137 means the kernel killed the container; almost always a memory limit issue.",
    "kubectl debug attaches an ephemeral container; perfect for distroless images with no shell.",
    "Save the runbook: `describe -> logs --previous -> top -> events -> debug` is the order, every time.",
  ]);

  // --- 21. Cluster ops ---
  newPage(ctx);
  drawHeading(ctx, "21. Cluster operations: etcd backup, drain, upgrades", 1);
  drawCode(
    ctx,
    [
      "# etcd snapshot",
      "ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%F-%H%M).db \\",
      "  --endpoints=https://127.0.0.1:2379 \\",
      "  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\",
      "  --cert=/etc/kubernetes/pki/etcd/server.crt \\",
      "  --key=/etc/kubernetes/pki/etcd/server.key",
      "",
      "# Verify",
      "ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-$(date +%F-%H%M).db -w table",
      "",
      "# Node maintenance",
      "kubectl cordon node-1",
      "kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data \\",
      "  --grace-period=30 --timeout=5m",
      "# ... patch / reboot ...",
      "kubectl uncordon node-1",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Snapshot etcd at least every 6 hours; rsync the snapshots offsite to a different region.",
    "Practice restores quarterly. An untested backup is a wish, not a backup.",
    "Drain with grace-period matching your app's terminationGracePeriodSeconds; otherwise pods get SIGKILL.",
    "Upgrade control plane first, then worker nodes one rack at a time. Never upgrade both in parallel.",
    "Use PodDisruptionBudgets so drains never take more than N replicas offline.",
  ]);

  // --- 22. Supply chain ---
  newPage(ctx);
  drawHeading(ctx, "22. Supply chain: image scanning, signing, admission control", 1);
  drawCode(
    ctx,
    [
      "# 1) Scan in CI",
      "trivy image --severity HIGH,CRITICAL --exit-code 1 \\",
      "  registry.example.com/api:1.4.0",
      "",
      "# 2) Generate SBOM",
      "syft registry.example.com/api:1.4.0 -o spdx-json > sbom.json",
      "",
      "# 3) Sign image with cosign (keyless via OIDC)",
      "cosign sign --yes registry.example.com/api:1.4.0",
      "cosign verify --certificate-identity-regexp \\",
      "  'https://github.com/acme/.*' \\",
      "  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\",
      "  registry.example.com/api:1.4.0",
    ].join("\n"),
  );
  drawHeading(ctx, "Kyverno: only run signed images from approved registries", 3);
  drawCode(
    ctx,
    [
      "apiVersion: kyverno.io/v2beta1",
      "kind: ClusterPolicy",
      "metadata: { name: verify-images }",
      "spec:",
      "  validationFailureAction: Enforce",
      "  background: false",
      "  webhookTimeoutSeconds: 30",
      "  rules:",
      "    - name: check-signature",
      "      match:",
      "        any:",
      "          - resources: { kinds: [Pod] }",
      "      verifyImages:",
      "        - imageReferences: [\"registry.example.com/*\"]",
      "          attestors:",
      "            - entries:",
      "                - keyless:",
      "                    subject: \"https://github.com/acme/*\"",
      "                    issuer: \"https://token.actions.githubusercontent.com\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Block HIGH and CRITICAL CVEs in CI; let MEDIUM through with a ticket.",
    "Sign every image with cosign keyless - no long-lived keys, identity bound to your CI workflow.",
    "Kyverno or OPA Gatekeeper enforces admission policies; pick one and stick with it.",
    "Mirror upstream images into a private registry; never schedule pods that pull from Docker Hub directly.",
  ]);

  // --- 23. Common errors ---
  newPage(ctx);
  drawHeading(ctx, "23. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "CrashLoopBackOff: kubectl logs <pod> --previous; bump memory or fix the app exit code.",
    "OOMKilled (exit 137): kubectl set resources deploy/<name> --limits=memory=1Gi.",
    "ImagePullBackOff: kubectl patch sa default -p '{\"imagePullSecrets\":[{\"name\":\"regcred\"}]}'.",
    "Pending pod, FailedScheduling: kubectl describe pod; either bump quota, add a node, or fix nodeSelector/affinity.",
    "Init:Error: kubectl logs <pod> -c <init-container>; usually a missing ConfigMap or Secret.",
    "DNS resolution failures: kubectl rollout restart deploy/coredns -n kube-system after checking allow-dns policy.",
    "Service has no endpoints: selector and pod labels don't match; kubectl get endpoints <svc>.",
    "Ingress 404: ingressClassName, host, or pathType mismatch; kubectl describe ingress.",
    "Certificate not issued: kubectl describe certificate; check ClusterIssuer status and DNS challenge records.",
    "etcd is the bottleneck: monitor `etcd_disk_wal_fsync_duration_seconds` p99; over 1 s means rebuild on faster disks.",
  ]);

  // --- 24. Versioning ---
  newPage(ctx);
  drawHeading(ctx, "24. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Kubernetes ships a minor release every four months and supports each for about a year. The book tracks the current and previous minor; recipes that depend on alpha/beta APIs are flagged. Manifests follow semantic versioning per chart.",
  );
  drawHeading(ctx, "Upgrade cadence", 3);
  drawBullets(ctx, [
    "Plan upgrades two months before the previous minor leaves support.",
    "Read the release notes for removed APIs; run `kubectl deprecations` against your cluster before upgrading.",
    "Upgrade managed clusters one minor at a time; never skip a minor on EKS / GKE / AKS.",
    "Snapshot etcd, drain a canary node, then roll the control plane.",
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
    "Bug reports: include cluster version, distribution (EKS / GKE / AKS / kubeadm), the failing manifest, and `kubectl get events --sort-by=.lastTimestamp`.",
  ]);

  // --- 25. License ---
  newPage(ctx);
  drawHeading(ctx, "25. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the recipes included in this product inside your own infrastructure projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the recipes and templates as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "Kubernetes itself is licensed under the Apache License 2.0; third-party components (cert-manager, kube-prometheus-stack, Argo CD, Flux, Kyverno, OpenTelemetry) carry their own open-source licenses - refer to upstream documentation for compliance details. The full Terms of Service and Refund Policy that govern this purchase are available at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
