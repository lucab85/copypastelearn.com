/**
 * PDF generator for "AI Infrastructure on Kubernetes".
 *
 * Cookbook for platform / ML-platform engineers running GPU clusters, model
 * training, and inference on Kubernetes. Covers NVIDIA GPU Operator, MIG,
 * Time-Slicing, vLLM, KServe, KubeRay, KEDA, KAITO, Karpenter, Volcano,
 * Kueue, FSDP / DeepSpeed training, scheduling, networking, storage,
 * observability, multi-tenant tenancy, cost control, and supply chain.
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

export async function generateAiInfrastructureKubernetesPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "AI Infrastructure on Kubernetes",
    subject:
      "Production cookbook for GPU clusters, model training, and inference serving on Kubernetes - GPU Operator, vLLM, KServe, KubeRay, KEDA, Karpenter, Volcano.",
    keywords: [
      "kubernetes",
      "ai",
      "ml",
      "nvidia",
      "gpu-operator",
      "vllm",
      "kserve",
      "kuberay",
      "karpenter",
      "volcano",
      "kueue",
      "kaito",
      "mlops",
    ],
    headerLeft: "AI Infrastructure on Kubernetes",
  });

  drawCover(ctx, {
    title: "AI Infrastructure on Kubernetes",
    subtitle: "GPU clusters, model training, and inference at production scale",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "Reference architecture: node pools, namespaces, tenancy",
    "NVIDIA GPU Operator install + ClusterPolicy",
    "GPU sharing: MIG, Time-Slicing, MPS",
    "Node pools: H100 / A100 / L40S / L4 selectors and taints",
    "Karpenter / Cluster Autoscaler for GPU pools",
    "Scheduling: Volcano gang scheduling and Kueue queues",
    "Storage: NVMe model cache, S3 / GCS, Fluid, JuiceFS",
    "Networking: NCCL, RDMA, IB / RoCE on Kubernetes",
    "vLLM serving with Deployment + HPA",
    "KServe InferenceService and serverless inference",
    "KAITO and OpenShift AI patterns",
    "Distributed training: KubeRay RayJob",
    "PyTorchJob and FSDP multi-node training",
    "Kubeflow Pipelines for end-to-end MLOps",
    "Model registry: MLflow, Hugging Face, OCI artifacts",
    "Autoscaling: HPA on tokens/sec, KEDA on queue depth",
    "Observability: dcgm-exporter, vLLM metrics, Grafana",
    "Cost control: quotas, idle-GPU detection, spot pools",
    "Multi-tenant isolation: namespaces, NetworkPolicy, PSS",
    "Supply chain: signed model images, Kyverno verify-images",
    "Disaster recovery: model artifacts and checkpoints",
    "Common errors and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "AI Infrastructure on Kubernetes is the playbook we hand to platform and ML-platform engineers running GPU clusters in production. It assumes you already operate a Kubernetes cluster and need to add the AI workload layer: GPU drivers, scheduling, training jobs, inference serving, observability, and per-tenant cost control.",
  );
  drawParagraph(
    ctx,
    "Every recipe is tested against Kubernetes 1.29-1.31 with NVIDIA A100 / H100 / L40S / L4 GPUs on EKS, GKE, AKS, OpenShift, and on-prem clusters. The four design pillars are: GPU isolation by Operator and MIG, gang-scheduled training with Volcano + Kueue, observable serving with vLLM + KServe + DCGM, and per-tenant chargeback with quotas.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Reference architecture: node-pool layout, namespace strategy, tenancy model.",
    "NVIDIA GPU Operator installation with `ClusterPolicy` tuned for production.",
    "GPU sharing recipes: MIG, time-slicing, MPS - when to use which.",
    "Karpenter / Cluster Autoscaler templates for cost-aware GPU node pools.",
    "Scheduling: Volcano gang scheduling, Kueue ClusterQueue, priority + preemption.",
    "Serving: vLLM Deployment + HPA, KServe InferenceService, KAITO patterns.",
    "Training: KubeRay RayJob, PyTorchJob + FSDP, Kubeflow Pipelines.",
    "Observability: dcgm-exporter + vLLM /metrics + Grafana dashboards.",
    "Cost control, multi-tenancy isolation, supply-chain hardening, DR.",
    "Lifetime updates while the recipes are maintained, delivered via /library.",
  ]);

  // 2
  newPage(ctx);
  drawHeading(ctx, "2. Reference architecture: node pools, namespaces, tenancy", 1);
  drawParagraph(
    ctx,
    "Separate GPU and CPU node pools, separate training and inference namespaces, separate per-tenant ResourceQuotas. Every GPU pool is tainted so only workloads that tolerate `nvidia.com/gpu` schedule there.",
  );
  drawCode(
    ctx,
    [
      "# Node pool taxonomy",
      "gpu-training-h100   taint: nvidia.com/gpu=true:NoSchedule  spot: false",
      "gpu-training-a100   taint: nvidia.com/gpu=true:NoSchedule  spot: true",
      "gpu-inference-l40s  taint: nvidia.com/gpu=true:NoSchedule  spot: false",
      "gpu-inference-l4    taint: nvidia.com/gpu=true:NoSchedule  spot: true",
      "cpu-system          taint: (none)                          spot: false",
      "",
      "# Namespaces",
      "ai-platform   # operators (gpu-operator, kserve, kuberay, kueue)",
      "ai-training   # training jobs (per-tenant subnamespaces)",
      "ai-inference  # InferenceServices (per-tenant subnamespaces)",
      "ai-shared     # model registry, vector stores, RAG indices",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Taint GPU pools to keep system pods off expensive GPU nodes.",
    "Separate training from inference; their SLOs and bin-packing differ.",
    "Inference fleet wants on-demand + small spot complement; training tolerates spot well.",
    "Every tenant gets a subnamespace with its own ResourceQuota and NetworkPolicy.",
  ]);

  // 3
  newPage(ctx);
  drawHeading(ctx, "3. NVIDIA GPU Operator install + ClusterPolicy", 1);
  drawCode(
    ctx,
    [
      "helm repo add nvidia https://helm.ngc.nvidia.com/nvidia",
      "helm repo update",
      "helm install --create-namespace -n gpu-operator \\",
      "  gpu-operator nvidia/gpu-operator \\",
      "  --version v25.3.0 \\",
      "  --set driver.enabled=true \\",
      "  --set toolkit.enabled=true \\",
      "  --set devicePlugin.enabled=true \\",
      "  --set dcgmExporter.enabled=true \\",
      "  --set mig.strategy=mixed \\",
      "  --set nfd.enabled=true",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "apiVersion: nvidia.com/v1",
      "kind: ClusterPolicy",
      "metadata: { name: gpu-cluster-policy }",
      "spec:",
      "  driver:",
      "    enabled: true",
      "    version: \"550.144.03\"",
      "    rdma: { enabled: true }",
      "  toolkit: { enabled: true }",
      "  devicePlugin:",
      "    enabled: true",
      "    config: { name: time-slicing-config, default: any }",
      "  dcgmExporter:",
      "    enabled: true",
      "    serviceMonitor: { enabled: true }",
      "  mig: { strategy: mixed }",
      "  nodeStatusExporter: { enabled: true }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pin the driver version - the Operator can manage it, but auto-upgrades break NCCL on bad days.",
    "Enable `dcgmExporter.serviceMonitor` so kube-prometheus-stack discovers GPU metrics automatically.",
    "`mig.strategy: mixed` lets you mix MIG-partitioned and full GPUs in the same cluster.",
    "Enable RDMA only if your nodes have an actual IB / RoCE NIC - otherwise drivers fail to load.",
  ]);

  // 4
  newPage(ctx);
  drawHeading(ctx, "4. GPU sharing: MIG, Time-Slicing, MPS", 1);
  drawCode(
    ctx,
    [
      "# Time-Slicing: many small pods share one GPU (best-effort, no isolation)",
      "apiVersion: v1",
      "kind: ConfigMap",
      "metadata: { name: time-slicing-config, namespace: gpu-operator }",
      "data:",
      "  any: |",
      "    version: v1",
      "    sharing:",
      "      timeSlicing:",
      "        resources:",
      "          - name: nvidia.com/gpu",
      "            replicas: 4   # 4 \"virtual\" GPUs per physical one",
      "",
      "# MIG: hard partitioning on A100 / H100 only (true isolation)",
      "kubectl label node h100-01 nvidia.com/mig.config=all-1g.10gb",
      "# results in 7 isolated 1g.10gb instances per H100",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "MIG: pick for multi-tenant inference; hard memory/SM isolation, no noisy-neighbor.",
    "Time-Slicing: pick for dev/training pipelines that under-utilize a GPU; zero isolation.",
    "MPS: pick when multiple processes from the SAME tenant share a GPU (e.g. Triton).",
    "A100 / H100 only for MIG. L4 / L40S / consumer GPUs do not support MIG.",
    "Document the chosen scheme per node pool - mixing in one pool causes scheduling chaos.",
  ]);

  // 5
  newPage(ctx);
  drawHeading(ctx, "5. Node pools: H100 / A100 / L40S / L4 selectors and taints", 1);
  drawCode(
    ctx,
    [
      "spec:",
      "  nodeSelector:",
      "    accelerator: h100",
      "  tolerations:",
      "    - key: nvidia.com/gpu",
      "      operator: Exists",
      "      effect: NoSchedule",
      "  containers:",
      "    - name: train",
      "      resources:",
      "        limits: { nvidia.com/gpu: 8 }",
      "  topologySpreadConstraints:",
      "    - maxSkew: 1",
      "      topologyKey: topology.kubernetes.io/zone",
      "      whenUnsatisfiable: ScheduleAnyway",
      "      labelSelector: { matchLabels: { app: train } }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Label nodes by accelerator (h100, a100-80g, l40s, l4) so workloads pin precisely.",
    "Use `topology.kubernetes.io/zone` spread for inference; pack training to ONE zone for NCCL.",
    "Pin `nvidia.com/gpu: 8` even when you want a whole node - K8s otherwise schedules elsewhere.",
    "DaemonSet (dcgm, fluent-bit) on every GPU node MUST tolerate the gpu taint.",
  ]);

  // 6
  newPage(ctx);
  drawHeading(ctx, "6. Karpenter / Cluster Autoscaler for GPU pools", 1);
  drawCode(
    ctx,
    [
      "apiVersion: karpenter.sh/v1",
      "kind: NodePool",
      "metadata: { name: gpu-h100 }",
      "spec:",
      "  template:",
      "    spec:",
      "      requirements:",
      "        - key: node.kubernetes.io/instance-type",
      "          operator: In",
      "          values: [\"p5.48xlarge\"]",
      "        - key: karpenter.sh/capacity-type",
      "          operator: In",
      "          values: [\"on-demand\"]",
      "      taints:",
      "        - key: nvidia.com/gpu",
      "          value: \"true\"",
      "          effect: NoSchedule",
      "      nodeClassRef:",
      "        group: karpenter.k8s.aws",
      "        kind: EC2NodeClass",
      "        name: gpu-al2023",
      "  limits: { \"nvidia.com/gpu\": 64 }",
      "  disruption:",
      "    consolidationPolicy: WhenEmpty",
      "    consolidateAfter: 5m",
      "    expireAfter: 720h",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Cap the pool with `limits` - one runaway HPA can spin up tens of thousands of EUR per hour.",
    "`consolidationPolicy: WhenEmpty` only - never let Karpenter consolidate running training jobs.",
    "expireAfter 30d forces driver / OS refresh; pair with PDBs so jobs are not torn mid-flight.",
    "Spot for training (`capacity-type: spot`), on-demand for inference. Mix via two NodePools.",
  ]);

  // 7
  newPage(ctx);
  drawHeading(ctx, "7. Scheduling: Volcano gang scheduling and Kueue queues", 1);
  drawCode(
    ctx,
    [
      "apiVersion: batch.volcano.sh/v1alpha1",
      "kind: Job",
      "metadata: { name: ddp-train, namespace: ai-training }",
      "spec:",
      "  schedulerName: volcano",
      "  minAvailable: 4    # gang: all-or-nothing scheduling",
      "  tasks:",
      "    - replicas: 4",
      "      name: worker",
      "      template:",
      "        spec:",
      "          containers:",
      "            - name: pytorch",
      "              image: nvcr.io/nvidia/pytorch:24.10-py3",
      "              resources:",
      "                limits: { nvidia.com/gpu: 8 }",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Kueue ClusterQueue with fair sharing across tenants",
      "apiVersion: kueue.x-k8s.io/v1beta1",
      "kind: ClusterQueue",
      "metadata: { name: gpu-queue }",
      "spec:",
      "  cohort: ai",
      "  preemption:",
      "    withinClusterQueue: LowerPriority",
      "    reclaimWithinCohort: Any",
      "  resourceGroups:",
      "    - coveredResources: [\"nvidia.com/gpu\"]",
      "      flavors:",
      "        - name: h100-on-demand",
      "          resources:",
      "            - name: \"nvidia.com/gpu\"",
      "              nominalQuota: 64",
      "              borrowingLimit: 32",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Volcano gang scheduling prevents partial allocation - 4-replica job either gets 32 GPUs or waits.",
    "Kueue layers fair-share + preemption + borrowing on top of Volcano or the default scheduler.",
    "Set `borrowingLimit` so tenants can use idle GPUs without starving each other.",
    "Pair with PriorityClass: inference > training > batch > best-effort.",
  ]);

  // 8
  newPage(ctx);
  drawHeading(ctx, "8. Storage: NVMe model cache, S3 / GCS, Fluid, JuiceFS", 1);
  drawCode(
    ctx,
    [
      "apiVersion: data.fluid.io/v1alpha1",
      "kind: AlluxioRuntime",
      "metadata: { name: models }",
      "spec:",
      "  replicas: 2",
      "  tieredstore:",
      "    levels:",
      "      - mediumtype: SSD",
      "        path: /mnt/nvme/alluxio",
      "        quota: 1Ti",
      "        high: \"0.95\"",
      "        low: \"0.7\"",
      "---",
      "apiVersion: data.fluid.io/v1alpha1",
      "kind: Dataset",
      "metadata: { name: models }",
      "spec:",
      "  mounts:",
      "    - mountPoint: s3://my-bucket/models",
      "      name: models",
      "      options: { fs.s3a.endpoint: \"s3.eu-west-1.amazonaws.com\" }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Stream models from S3 / GCS to local NVMe via Fluid - pods see a normal PVC, hot data stays local.",
    "10 GB model loads in 4-5 s from NVMe vs 90+ s from S3 - cuts pod startup brutally.",
    "JuiceFS or CSI-S3 are alternatives; Fluid wins for caching, JuiceFS for POSIX semantics.",
    "Always co-locate the cache with the workload; cross-zone fetches negate the speedup.",
  ]);

  // 9
  newPage(ctx);
  drawHeading(ctx, "9. Networking: NCCL, RDMA, IB / RoCE on Kubernetes", 1);
  drawCode(
    ctx,
    [
      "# inject NCCL env vars + IB devices into the pod",
      "env:",
      "  - { name: NCCL_DEBUG,     value: \"WARN\" }",
      "  - { name: NCCL_IB_DISABLE, value: \"0\" }",
      "  - { name: NCCL_SOCKET_IFNAME, value: \"eth0\" }",
      "  - { name: NCCL_IB_HCA,    value: \"mlx5_0,mlx5_1,mlx5_2,mlx5_3\" }",
      "resources:",
      "  limits:",
      "    nvidia.com/gpu: 8",
      "    rdma/hca_shared_devices_a: 1   # exposed by k8s-rdma-shared-dev-plugin",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "8x H100 with NVLink: intra-node NCCL is fine on the default Linux net.",
    "Multi-node: REQUIRES IB or 200/400G RoCE; without it gradients dominate step time.",
    "Use `k8s-rdma-shared-dev-plugin` or NVIDIA Network Operator to expose `rdma/*` resources.",
    "NCCL_DEBUG=WARN in prod, INFO when debugging - INFO is very chatty under load.",
    "Validate with `nccl-tests` (allreduce_perf) before running real training - 30 minutes of work, hours saved.",
  ]);

  // 10
  newPage(ctx);
  drawHeading(ctx, "10. vLLM serving with Deployment + HPA", 1);
  drawCode(
    ctx,
    [
      "apiVersion: apps/v1",
      "kind: Deployment",
      "metadata: { name: granite-7b, namespace: ai-inference }",
      "spec:",
      "  replicas: 2",
      "  selector: { matchLabels: { app: granite-7b } }",
      "  template:",
      "    metadata:",
      "      labels: { app: granite-7b }",
      "      annotations: { prometheus.io/scrape: \"true\", prometheus.io/port: \"8000\" }",
      "    spec:",
      "      nodeSelector: { accelerator: l40s }",
      "      tolerations: [{ key: nvidia.com/gpu, operator: Exists, effect: NoSchedule }]",
      "      containers:",
      "        - name: vllm",
      "          image: vllm/vllm-openai:v0.6.4",
      "          args:",
      "            - --model=ibm-granite/granite-7b-instruct",
      "            - --tensor-parallel-size=1",
      "            - --max-model-len=8192",
      "            - --gpu-memory-utilization=0.92",
      "          ports: [{ containerPort: 8000, name: http }]",
      "          resources:",
      "            limits: { nvidia.com/gpu: 1 }",
      "          readinessProbe:",
      "            httpGet: { path: /health, port: 8000 }",
      "            initialDelaySeconds: 120",
      "            periodSeconds: 5",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "apiVersion: autoscaling/v2",
      "kind: HorizontalPodAutoscaler",
      "metadata: { name: granite-7b, namespace: ai-inference }",
      "spec:",
      "  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: granite-7b }",
      "  minReplicas: 2",
      "  maxReplicas: 16",
      "  metrics:",
      "    - type: Pods",
      "      pods:",
      "        metric: { name: vllm_avg_generation_throughput_tokens_per_second }",
      "        target: { type: AverageValue, averageValue: \"2000\" }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Readiness `initialDelaySeconds: 120+` - vLLM downloads + loads a model on first start.",
    "HPA on tokens/sec or queue depth, NOT CPU - GPU workloads are not CPU-bound.",
    "Pre-pull model images to nodes via `kube-image-prepuller` or DaemonSet to cut first-pod latency.",
    "Use `terminationGracePeriodSeconds: 120` so in-flight generations complete before SIGKILL.",
  ]);

  // 11
  newPage(ctx);
  drawHeading(ctx, "11. KServe InferenceService and serverless inference", 1);
  drawCode(
    ctx,
    [
      "apiVersion: serving.kserve.io/v1beta1",
      "kind: InferenceService",
      "metadata: { name: granite-7b, namespace: ai-inference }",
      "spec:",
      "  predictor:",
      "    minReplicas: 1",
      "    maxReplicas: 8",
      "    scaleTarget: 2000",
      "    scaleMetric: \"qps\"",
      "    model:",
      "      modelFormat: { name: vllm }",
      "      runtime: vllm-runtime",
      "      storageUri: s3://models/granite-7b-instruct/",
      "      resources:",
      "        limits: { nvidia.com/gpu: 1 }",
      "  transformer:",
      "    containers:",
      "      - name: prompt-guard",
      "        image: registry.example.com/prompt-guard:1.0",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "KServe gives you Knative scale-to-zero AND traffic splitting AND a transformer slot.",
    "scale-to-zero is great for low-QPS endpoints; the first request pays the cold-start.",
    "Use a transformer for prompt safety, PII scrubbing, or A/B-routing before reaching the model.",
    "Pin runtime version (vllm-runtime:0.6.4); auto-upgrades have broken APIs in 0.5 -> 0.6.",
  ]);

  // 12
  newPage(ctx);
  drawHeading(ctx, "12. KAITO and OpenShift AI patterns", 1);
  drawParagraph(
    ctx,
    "KAITO (Kubernetes AI Toolchain Operator) turns Hugging Face model IDs into running InferenceServices. OpenShift AI bundles JupyterHub, KServe, Kueue, and a model registry behind a single Operator.",
  );
  drawCode(
    ctx,
    [
      "apiVersion: kaito.sh/v1alpha1",
      "kind: Workspace",
      "metadata: { name: granite-7b }",
      "resource:",
      "  instanceType: \"Standard_NC24ads_A100_v4\"",
      "  count: 1",
      "  labelSelector:",
      "    matchLabels: { apps: granite-7b }",
      "inference:",
      "  preset:",
      "    name: \"granite-7b-instruct\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "KAITO is the fastest path from `huggingface://repo` to a Kubernetes Service.",
    "OpenShift AI is the right pick for enterprise-regulated environments (RBAC + audit + identity).",
    "Don't mix vanilla KServe and OpenShift AI's KServe in the same cluster - reconciler conflicts.",
    "Use OpenShift AI's model registry to track lineage; export to MLflow for tooling parity.",
  ]);

  // 13
  newPage(ctx);
  drawHeading(ctx, "13. Distributed training: KubeRay RayJob", 1);
  drawCode(
    ctx,
    [
      "apiVersion: ray.io/v1",
      "kind: RayJob",
      "metadata: { name: fsdp-train, namespace: ai-training }",
      "spec:",
      "  entrypoint: \"python train.py --epochs 7\"",
      "  rayClusterSpec:",
      "    rayVersion: \"2.40.0\"",
      "    headGroupSpec:",
      "      rayStartParams: { dashboard-host: \"0.0.0.0\" }",
      "      template:",
      "        spec:",
      "          containers:",
      "            - name: ray-head",
      "              image: rayproject/ray-ml:2.40.0-gpu",
      "              resources: { limits: { cpu: 8, memory: 32Gi } }",
      "    workerGroupSpecs:",
      "      - replicas: 4",
      "        groupName: gpu-workers",
      "        rayStartParams: {}",
      "        template:",
      "          spec:",
      "            nodeSelector: { accelerator: h100 }",
      "            tolerations:",
      "              - { key: nvidia.com/gpu, operator: Exists, effect: NoSchedule }",
      "            containers:",
      "              - name: ray-worker",
      "                image: rayproject/ray-ml:2.40.0-gpu",
      "                resources: { limits: { nvidia.com/gpu: 8 } }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "RayJob tears down the cluster after the job completes - cheap, ephemeral training.",
    "RayService is for serving; RayCluster is for interactive Jupyter notebooks.",
    "Co-schedule head + workers via Volcano gang scheduling to avoid head-only-running waste.",
    "Pin `rayproject/ray-ml:<tag>-gpu` - the non-gpu image silently runs CPU-only training.",
  ]);

  // 14
  newPage(ctx);
  drawHeading(ctx, "14. PyTorchJob and FSDP multi-node training", 1);
  drawCode(
    ctx,
    [
      "apiVersion: kubeflow.org/v1",
      "kind: PyTorchJob",
      "metadata: { name: fsdp-llama3, namespace: ai-training }",
      "spec:",
      "  runPolicy:",
      "    backoffLimit: 0",
      "    cleanPodPolicy: All",
      "  pytorchReplicaSpecs:",
      "    Master:",
      "      replicas: 1",
      "      template:",
      "        spec:",
      "          containers:",
      "            - name: pytorch",
      "              image: nvcr.io/nvidia/pytorch:24.10-py3",
      "              command: [\"torchrun\"]",
      "              args:",
      "                - --nproc_per_node=8",
      "                - --nnodes=4",
      "                - train_fsdp.py",
      "              resources: { limits: { nvidia.com/gpu: 8 } }",
      "    Worker:",
      "      replicas: 3",
      "      template:",
      "        spec:",
      "          containers:",
      "            - name: pytorch",
      "              image: nvcr.io/nvidia/pytorch:24.10-py3",
      "              command: [\"torchrun\"]",
      "              args:",
      "                - --nproc_per_node=8",
      "                - --nnodes=4",
      "                - train_fsdp.py",
      "              resources: { limits: { nvidia.com/gpu: 8 } }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "PyTorchJob handles MASTER_ADDR / MASTER_PORT / RANK env injection automatically.",
    "FSDP needs equal GPU count per replica - asymmetric topologies break the all-gather.",
    "Use `cleanPodPolicy: All` so failed pods do not pile up and consume quota.",
    "Mount NVMe checkpoint volume; FSDP saves 2-50 GB per checkpoint per epoch.",
  ]);

  // 15
  newPage(ctx);
  drawHeading(ctx, "15. Kubeflow Pipelines for end-to-end MLOps", 1);
  drawCode(
    ctx,
    [
      "# pipeline.py - kfp v2",
      "from kfp import dsl",
      "",
      "@dsl.component(packages_to_install=['datasets'])",
      "def fetch_data(out_dir: dsl.OutputPath()):",
      "    from datasets import load_dataset",
      "    load_dataset('squad').save_to_disk(out_dir)",
      "",
      "@dsl.component(base_image='nvcr.io/nvidia/pytorch:24.10-py3')",
      "def train(data_dir: dsl.InputPath(), model_dir: dsl.OutputPath()):",
      "    import torch  # train and save to model_dir",
      "    ...",
      "",
      "@dsl.pipeline(name='qa-finetune')",
      "def pipe():",
      "    d = fetch_data()",
      "    t = train(data_dir=d.outputs['out_dir'])",
      "    t.set_gpu_limit(8)",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Kubeflow Pipelines v2 is the upstream; Vertex AI Pipelines uses the same SDK.",
    "Decompose into one component per shell command; intermediate artifacts are typed I/O.",
    "Cache successful steps - if data does not change, retrain steps reuse the cache.",
    "Tie pipeline runs to git commit + dataset hash so every model is reproducible.",
  ]);

  // 16
  newPage(ctx);
  drawHeading(ctx, "16. Model registry: MLflow, Hugging Face, OCI artifacts", 1);
  drawCode(
    ctx,
    [
      "# log a model to MLflow at the end of training",
      "import mlflow",
      "mlflow.set_tracking_uri('http://mlflow.ai-shared.svc:5000')",
      "with mlflow.start_run(run_name='granite-7b-v1.4'):",
      "    mlflow.log_metric('bleu', 27.4)",
      "    mlflow.log_metric('bertscore_f1', 0.881)",
      "    mlflow.transformers.log_model(",
      "        transformers_model=trainer.model,",
      "        artifact_path='model',",
      "        registered_model_name='granite-7b-instruct')",
      "",
      "# push as OCI artifact (model-as-container)",
      "oras push registry.example.com/models/granite-7b-instruct:v1.4 \\",
      "    --artifact-type application/vnd.ai.model \\",
      "    ./model/",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Registry choice: MLflow for OSS, HF for collaboration, OCI artifacts for cluster-native delivery.",
    "OCI artifacts let you reuse image registry RBAC, mirroring, and Kyverno verification.",
    "Tag every model with git commit + dataset hash + eval metric - searchability matters at scale.",
    "Never store models in a vanilla blob bucket without a registry layer - lineage gets lost.",
  ]);

  // 17
  newPage(ctx);
  drawHeading(ctx, "17. Autoscaling: HPA on tokens/sec, KEDA on queue depth", 1);
  drawCode(
    ctx,
    [
      "apiVersion: keda.sh/v1alpha1",
      "kind: ScaledObject",
      "metadata: { name: batch-inference, namespace: ai-inference }",
      "spec:",
      "  scaleTargetRef: { name: batch-worker }",
      "  minReplicaCount: 0",
      "  maxReplicaCount: 20",
      "  triggers:",
      "    - type: aws-sqs-queue",
      "      metadata:",
      "        queueURL: https://sqs.eu-west-1.amazonaws.com/.../infer-jobs",
      "        queueLength: \"10\"",
      "        awsRegion: eu-west-1",
      "      authenticationRef: { name: aws-irsa-creds }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Synchronous inference: HPA on tokens/sec (custom metric from vLLM /metrics).",
    "Asynchronous / batch: KEDA on SQS / Kafka / PubSub depth - scale to zero off-hours.",
    "Add `stabilizationWindowSeconds: 600` on scale-down - GPU pods are slow to bring back.",
    "Cap maxReplicas to your Karpenter pool limit, or you build a credit-card incident.",
  ]);

  // 18
  newPage(ctx);
  drawHeading(ctx, "18. Observability: dcgm-exporter, vLLM metrics, Grafana", 1);
  drawCode(
    ctx,
    [
      "apiVersion: monitoring.coreos.com/v1",
      "kind: ServiceMonitor",
      "metadata: { name: vllm, namespace: ai-inference }",
      "spec:",
      "  selector: { matchLabels: { app: granite-7b } }",
      "  endpoints:",
      "    - port: http",
      "      path: /metrics",
      "      interval: 30s",
      "---",
      "apiVersion: monitoring.coreos.com/v1",
      "kind: PrometheusRule",
      "metadata: { name: ai-slo, namespace: ai-inference }",
      "spec:",
      "  groups:",
      "    - name: ai.slo",
      "      rules:",
      "        - alert: VllmHighFirstTokenLatency",
      "          expr: histogram_quantile(0.95,",
      "            rate(vllm_time_to_first_token_seconds_bucket[5m])) > 1.5",
      "          for: 10m",
      "          labels: { severity: page }",
      "        - alert: GpuMemoryNearFull",
      "          expr: DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_TOTAL > 0.95",
      "          for: 15m",
      "          labels: { severity: ticket }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Standard panels: tokens/sec, p95 TTFT, GPU SM util, GPU FB util, queue depth, errors.",
    "Per-model labels mandatory - average across models hides regressions on the cheap models.",
    "DCGM `DCGM_FI_DEV_GPU_TEMP > 85` for 15m = thermal throttling; investigate.",
    "Alert on TTFT and tokens/sec, not on CPU - that is how you SLO an inference service.",
  ]);

  // 19
  newPage(ctx);
  drawHeading(ctx, "19. Cost control: quotas, idle-GPU detection, spot pools", 1);
  drawCode(
    ctx,
    [
      "apiVersion: v1",
      "kind: ResourceQuota",
      "metadata: { name: gpu-quota, namespace: tenant-a }",
      "spec:",
      "  hard:",
      "    requests.nvidia.com/gpu: \"16\"",
      "    limits.nvidia.com/gpu:   \"16\"",
      "    requests.cpu:    \"64\"",
      "    requests.memory: 256Gi",
      "    pods: \"200\"",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Idle-GPU alert (SM util ~0 for 15m)",
      "alert: GpuIdleWhileAllocated",
      "expr: |",
      "  avg_over_time(DCGM_FI_DEV_GPU_UTIL[15m]) < 5",
      "  and on(pod) kube_pod_container_resource_requests{resource=\"nvidia_com_gpu\"} > 0",
      "for: 30m",
      "labels: { severity: ticket }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Quota on `requests.nvidia.com/gpu` per tenant - the single most effective cost control.",
    "Alert on allocated but idle GPUs - one stuck training job = thousands EUR / day.",
    "Spot GPU pools for fault-tolerant training (FSDP checkpoints every 500 steps).",
    "Weekly chargeback report from Prometheus - tenants behave differently when they see the bill.",
  ]);

  // 20
  newPage(ctx);
  drawHeading(ctx, "20. Multi-tenant isolation: namespaces, NetworkPolicy, PSS", 1);
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
      "    pod-security.kubernetes.io/warn: restricted",
      "---",
      "apiVersion: networking.k8s.io/v1",
      "kind: NetworkPolicy",
      "metadata: { name: default-deny, namespace: tenant-a }",
      "spec:",
      "  podSelector: {}",
      "  policyTypes: [Ingress, Egress]",
      "---",
      "apiVersion: networking.k8s.io/v1",
      "kind: NetworkPolicy",
      "metadata: { name: allow-shared-registry, namespace: tenant-a }",
      "spec:",
      "  podSelector: {}",
      "  policyTypes: [Egress]",
      "  egress:",
      "    - to:",
      "        - namespaceSelector: { matchLabels: { name: ai-shared } }",
      "      ports: [{ protocol: TCP, port: 5000 }]",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Restricted Pod Security Standard is the production default; no privileged GPU pods needed in 2026.",
    "Default-deny network on every tenant namespace; allow only the shared services they need.",
    "Per-tenant ServiceAccount with minimal RBAC; no `cluster-admin` for ML workloads ever.",
    "Use Kyverno generate rules to spin up quota + NP + RBAC when a new tenant namespace appears.",
  ]);

  // 21
  newPage(ctx);
  drawHeading(ctx, "21. Supply chain: signed model images, Kyverno verify-images", 1);
  drawCode(
    ctx,
    [
      "# sign a model image",
      "cosign sign --yes registry.example.com/models/granite-7b-instruct:v1.4",
      "",
      "# Kyverno policy: only signed models from approved registry can run",
      "apiVersion: kyverno.io/v2beta1",
      "kind: ClusterPolicy",
      "metadata: { name: verify-model-images }",
      "spec:",
      "  validationFailureAction: Enforce",
      "  rules:",
      "    - name: check-model-signature",
      "      match:",
      "        any:",
      "          - resources:",
      "              kinds: [Pod]",
      "              namespaces: [\"ai-inference\", \"ai-training\"]",
      "      verifyImages:",
      "        - imageReferences: [\"registry.example.com/models/*\"]",
      "          attestors:",
      "            - entries:",
      "                - keyless:",
      "                    subject: \"https://github.com/acme/.*\"",
      "                    issuer: \"https://token.actions.githubusercontent.com\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Sign models AND base inference images - either being tampered breaks inference integrity.",
    "Kyverno verify-images runs at admission; unsigned model image cannot reach the GPU.",
    "Generate SBOMs for model images with syft; scan with grype for transitively pulled deps.",
    "Mirror upstream model registries; never pull from Hugging Face directly into prod clusters.",
  ]);

  // 22
  newPage(ctx);
  drawHeading(ctx, "22. Disaster recovery: model artifacts and checkpoints", 1);
  drawBullets(ctx, [
    "Tier 1 - model registry (MLflow / OCI): replicated to a second region; nightly backup.",
    "Tier 2 - training checkpoints: every 500 steps to NVMe + async ship to S3 cross-region.",
    "Tier 3 - prompt + RAG corpora: versioned in object storage with object-lock for 13 months.",
    "Restore drill quarterly: pick a model at random, restore from the DR region, run eval.",
    "Document RPO (24 h for models, 1 hour for checkpoints) and RTO (4 h) in the runbook.",
  ]);

  // 23
  newPage(ctx);
  drawHeading(ctx, "23. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "Pod stuck Pending, `Insufficient nvidia.com/gpu`: scale the Karpenter NodePool or check `kubectl get nodes -L accelerator`.",
    "Driver mismatch (`UnknownError`): GPU Operator did not roll the node; cordon + drain + reboot.",
    "vLLM OOM on startup: lower `--gpu-memory-utilization` to 0.85 or shrink `--max-model-len`.",
    "NCCL multi-node hang: `NCCL_DEBUG=INFO`; check IB devices and NCCL_IB_HCA env var.",
    "MIG instances not visible: `nvidia-smi mig -lgip` shows partitions; re-roll device-plugin pod.",
    "`device or resource busy` on pod delete: a process holds the GPU; `nvidia-smi --query-compute-apps`.",
    "Image pull on every pod: cache models on NVMe via Fluid/JuiceFS; use kube-image-prepuller.",
    "Karpenter spins up but pod still Pending: missing toleration or wrong nodeSelector label.",
    "vLLM cold start 90 s: pre-warm replica via PreStop hook + readinessProbe with high initialDelaySeconds.",
    "Costs exploded overnight: missing maxReplicas on HPA + missing NodePool `limits` cap.",
  ]);

  // 24
  newPage(ctx);
  drawHeading(ctx, "24. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks Kubernetes 1.29-1.31, NVIDIA GPU Operator v25.x, KServe 0.13+, vLLM 0.6+, KubeRay 1.2+, Kueue 0.9+. Recipes are revalidated whenever any of the four ships a minor; updates ship via /library within 30 days.",
  );
  drawBullets(ctx, [
    "Pin the GPU Operator chart version; auto-upgrades change driver versions silently.",
    "Read upstream release notes; Kueue and KubeRay both have breaking API changes per minor.",
    "Sign in to https://www.copypastelearn.com/library to mint a fresh download link.",
    "Support: support@copypastelearn.com (one business day). Security: security@copypastelearn.com.",
  ]);

  // 25
  newPage(ctx);
  drawHeading(ctx, "25. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the recipes included in this product inside your own infrastructure projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the recipes as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "Kubernetes, NVIDIA GPU Operator, KServe, KubeRay, Kueue, Volcano, vLLM, Karpenter, KEDA, Kyverno, MLflow, and Kubeflow are governed by their own open-source licenses - refer to upstream documentation for compliance details. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
