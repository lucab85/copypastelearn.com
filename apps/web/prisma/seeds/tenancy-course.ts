/**
 * Multi-Tenant Kubernetes with Capsule and vCluster (DRAFT).
 *
 * Six lessons. Generated from the verified course (screenshare-recorder, lessons/tenancy): the code snippets are the
 * files typed on camera and the commands of each lesson, copied as they are. Nothing here is published: the course and
 * its lessons are DRAFT, `announced` is false, there is no video. A package import (`pnpm course:import`) adds the
 * videos, transcripts, durations, the final assessment and the Hands-On Lab text to the same lessons (same slugs).
 *
 * Idempotent, same style as the goose and MCP course seeds:
 *   - the course upsert has `update: {}`: a re-run never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only (never `status`, `videoPlaybackId` or `durationSeconds`).
 */

import type { PrismaClient } from "@prisma/client";

export const TENANCY_COURSE_SLUG = "multi-tenant-kubernetes-capsule-vcluster";

export const tenancyLessons = [
  {
    title: "Tenants and owners with Capsule",
    slug: "tenants-and-owners-with-capsule",
    description: "Build a three-node kind cluster with the PodNodeSelector admission plugin, install cert-manager and Capsule, create a tenant for each of two teams, and act as a team owner: the namespaces you create join your tenant, the other team's namespace is refused, and a user outside the Capsule group cannot create namespaces at all. The narration is a synthetic voice made from the author's own voice.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "cluster.yaml",
        language: "yaml",
        code: "kind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nname: tenancy\nnodes:\n  - role: control-plane\n    kubeadmConfigPatches:\n      - |\n        kind: ClusterConfiguration\n        apiServer:\n          extraArgs:\n            - name: enable-admission-plugins\n              value: NodeRestriction,PodNodeSelector\n  - role: worker\n    labels:\n      pool: search\n  - role: worker\n    labels:\n      pool: billing",
      },
      {
        label: "tenants.yaml",
        language: "yaml",
        code: "apiVersion: capsule.clastix.io/v1beta2\nkind: Tenant\nmetadata:\n  name: search\nspec:\n  owners:\n    - kind: User\n      name: alice\n  nodeSelector:\n    pool: search\n---\napiVersion: capsule.clastix.io/v1beta2\nkind: Tenant\nmetadata:\n  name: billing\nspec:\n  owners:\n    - kind: User\n      name: bob\n  nodeSelector:\n    pool: billing",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "docker info --format '{{.NCPU}} CPUs' && kind version\nkind create cluster --config cluster.yaml\nkubectl wait --for=condition=Ready nodes --all --timeout=120s\nkubectl get nodes -L pool\nkubectl get pod -n kube-system kube-apiserver-tenancy-control-plane -o yaml | grep admission\nhelm install cert-manager oci://quay.io/jetstack/charts/cert-manager --version v1.21.3 \\\n  -n cert-manager --create-namespace --set crds.enabled=true --wait\nhelm repo add projectcapsule https://projectcapsule.github.io/charts\nhelm install capsule projectcapsule/capsule --version 0.15.2 \\\n  -n capsule-system --create-namespace --wait\nkubectl get capsuleconfiguration default -o jsonpath='{.spec.users}{\"\\n\"}'\nkubectl apply -f tenants.yaml\nkubectl get tenants\nkubectl create namespace search-dev --as alice --as-group projectcapsule.dev\nkubectl create namespace billing-dev --as bob --as-group projectcapsule.dev\nkubectl get namespaces -l capsule.clastix.io/tenant -L capsule.clastix.io/tenant\nkubectl get namespace search-dev -o jsonpath='{.metadata.annotations}{\"\\n\"}'\nkubectl create deployment web --image nginx:1.29 -n billing-dev --as alice --as-group projectcapsule.dev\nkubectl create namespace carol-dev --as carol\nkubectl get tenants",
      },
    ],
    resources: [
      {
        title: "Capsule documentation",
        url: "https://projectcapsule.dev/docs/",
      },
      {
        title: "Capsule on GitHub",
        url: "https://github.com/projectcapsule/capsule",
      },
      {
        title: "cert-manager documentation",
        url: "https://cert-manager.io/docs/",
      },
      {
        title: "Kubernetes: PodNodeSelector admission plugin",
        url: "https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/",
      },
      {
        title: "Udienza: Dario Tranchitella, Capsule and Kamaji at Clastix",
        url: "https://www.udienza.com/episodes/dario-tranchitella",
      },
    ],
  },
  {
    title: "What an owner can and cannot do",
    slug: "what-an-owner-can-and-cannot-do",
    description: "See the permissions Capsule gives an owner with kubectl auth can-i, sign a client certificate for her through the CertificateSigningRequest API and build her own kubeconfig. Then let her list her namespaces and nodes through capsule-proxy.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "alice-csr.yaml",
        language: "yaml",
        code: "apiVersion: certificates.k8s.io/v1\nkind: CertificateSigningRequest\nmetadata:\n  name: alice\nspec:\n  request: ${CSR}\n  signerName: kubernetes.io/kube-apiserver-client\n  expirationSeconds: 86400\n  usages: [client auth]",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get tenants\nkubectl auth can-i create deployments -n search-dev --as alice --as-group projectcapsule.dev\nkubectl auth can-i create deployments -n billing-dev --as alice --as-group projectcapsule.dev\nkubectl get rolebindings -n search-dev -o custom-columns=ROLE:.roleRef.name,SUBJECTS:.subjects[*].name\nopenssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out alice.key\nopenssl req -new -key alice.key -subj \"/CN=alice/O=projectcapsule.dev\" -out alice.csr\nstat -f '%Sp %N' alice.key alice.csr\nexport CSR=$(base64 < alice.csr | tr -d '\\n')\nenvsubst < alice-csr.yaml | kubectl apply -f -\nkubectl get csr alice\nkubectl certificate approve alice\nkubectl get csr alice\nkubectl get csr alice -o jsonpath='{.status.certificate}' | base64 -d > alice.crt\nopenssl x509 -in alice.crt -noout -subject -issuer\nkubectl get configmap kube-root-ca.crt -o jsonpath='{.data.ca\\.crt}' > ca.crt\nSERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')\nkubectl config set-cluster tenancy --server $SERVER --certificate-authority ca.crt \\\n  --embed-certs --kubeconfig alice.kubeconfig\nkubectl config set-credentials alice --client-certificate alice.crt --client-key alice.key \\\n  --embed-certs --kubeconfig alice.kubeconfig\nkubectl config set-context alice --cluster tenancy --user alice --kubeconfig alice.kubeconfig\nkubectl config use-context alice --kubeconfig alice.kubeconfig\nalice() { KUBECONFIG=\"$PWD/alice.kubeconfig\" \"$@\"; }\nalice kubectl auth whoami\nalice kubectl get namespaces\nhelm install capsule-proxy projectcapsule/capsule-proxy --version 0.15.3 -n capsule-system --wait\nkubectl port-forward -n capsule-system svc/capsule-proxy 9001:9001 > /dev/null &\nkubectl get secret capsule-proxy -n capsule-system -o jsonpath='{.data.ca\\.crt}' \\\n  | base64 -d > proxy-ca.crt\nkubectl config set-cluster proxy --server https://127.0.0.1:9001 \\\n  --certificate-authority proxy-ca.crt --tls-server-name capsule-proxy \\\n  --embed-certs --kubeconfig alice.kubeconfig\nkubectl config set-context alice-proxy --cluster proxy --user alice --kubeconfig alice.kubeconfig\nalice kubectl --context alice-proxy get namespaces\nalice kubectl --context alice-proxy get nodes\nkill %1",
      },
    ],
    resources: [
      {
        title: "Kubernetes: certificate signing requests",
        url: "https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/",
      },
      {
        title: "Kubernetes: using RBAC authorization",
        url: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/",
      },
      {
        title: "capsule-proxy on GitHub",
        url: "https://github.com/projectcapsule/capsule-proxy",
      },
      {
        title: "Capsule documentation",
        url: "https://projectcapsule.dev/docs/",
      },
    ],
  },
  {
    title: "Guardrails for a tenant",
    slug: "guardrails-for-a-tenant",
    description: "Limit what a tenant can use: a maximum number of namespaces, a quota shared by all of them, an allowed storage class, and default limits and a network policy copied into every namespace. Then watch each limit refuse something: a fourth namespace, a premium volume, the eleventh pod, and a request from another tenant.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "guardrails.yaml",
        language: "yaml",
        code: "apiVersion: capsule.clastix.io/v1beta2\nkind: Tenant\nmetadata:\n  name: search\n  labels:\n    guardrails: standard\nspec:\n  owners:\n    - kind: User\n      name: alice\n  nodeSelector:\n    pool: search\n  namespaceOptions:\n    quota: 3\n  storageClasses:\n    allowed:\n      - standard\n  rules:\n    - quota:\n        - name: compute\n          hard:\n            requests.cpu: \"1\"\n            requests.memory: 1Gi\n            pods: \"10\"",
      },
      {
        label: "copies.yaml",
        language: "yaml",
        code: "apiVersion: capsule.clastix.io/v1beta2\nkind: GlobalTenantResource\nmetadata: {name: guardrails}\nspec:\n  tenantSelector: {matchLabels: {guardrails: standard}}\n  resyncPeriod: 60s\n  resources:\n    - rawItems:\n        - apiVersion: v1\n          kind: LimitRange\n          metadata: {name: defaults}\n          spec:\n            limits:\n              - type: Container\n                defaultRequest: {cpu: 100m, memory: 128Mi}\n                default: {cpu: 250m, memory: 256Mi}\n        - apiVersion: networking.k8s.io/v1\n          kind: NetworkPolicy\n          metadata: {name: same-tenant-only}\n          spec:\n            podSelector: {}\n            policyTypes: [Ingress]\n            ingress:\n              - from:\n                  - namespaceSelector: {matchLabels: {capsule.clastix.io/tenant: search}}",
      },
      {
        label: "premium-pvc.yaml",
        language: "yaml",
        code: "apiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: fast-data\nspec:\n  storageClassName: premium\n  accessModes: [ReadWriteOnce]\n  resources:\n    requests:\n      storage: 1Gi",
      },
      {
        label: "web.yaml",
        language: "yaml",
        code: "apiVersion: apps/v1\nkind: Deployment\nmetadata: {name: web}\nspec:\n  replicas: 2\n  selector:\n    matchLabels: {app: web}\n  template:\n    metadata:\n      labels: {app: web}\n    spec:\n      containers:\n        - name: nginx\n          image: nginx:1.29\n          resources:\n            requests: {cpu: 50m, memory: 32Mi}\n            limits: {cpu: 100m, memory: 64Mi}\n---\napiVersion: v1\nkind: Service\nmetadata: {name: web}\nspec:\n  selector: {app: web}\n  ports:\n    - port: 80",
      },
      {
        label: "probe.yaml",
        language: "yaml",
        code: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: probe\nspec:\n  selector:\n    matchLabels: {app: probe}\n  template:\n    metadata:\n      labels: {app: probe}\n    spec:\n      terminationGracePeriodSeconds: 2\n      containers:\n        - name: busybox\n          image: busybox:1.37\n          command: [sleep, infinity]\n          resources:\n            requests: {cpu: 10m, memory: 8Mi}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get tenants\nkubectl apply -f guardrails.yaml -f copies.yaml\nkubectl get limitrange,networkpolicy -n search-dev -o name\nalice() { KUBECONFIG=\"$PWD/alice.kubeconfig\" \"$@\"; }\nalice kubectl create namespace search-test\nkubectl get tenant search\nalice kubectl create namespace search-prod\nkubectl get tenant search\nalice kubectl create namespace search-qa\nalice kubectl apply -f premium-pvc.yaml -n search-dev\nalice kubectl apply -f web.yaml -n search-dev\nalice kubectl apply -f probe.yaml -n search-test\nkubectl apply -f probe.yaml -n billing-dev --as bob --as-group projectcapsule.dev\nalice kubectl rollout status deployment/web -n search-dev\nalice kubectl exec -n search-test deploy/probe -- wget -qO- -T 3 http://web.search-dev | grep title\nkubectl exec -n billing-dev deploy/probe --as bob --as-group projectcapsule.dev -- \\\n  wget -qO- -T 3 http://web.search-dev\nalice kubectl scale deployment web -n search-dev --replicas 11\nalice kubectl get deployment web -n search-dev\nkubectl get grq search-compute -o jsonpath='{.status.total.used.pods}/{.status.total.hard.pods}{\"\\n\"}'\nkubectl get events -n search-dev | grep -m1 GlobalResourceQuota\nalice kubectl scale deployment web -n search-dev --replicas 2\nkubectl get pods -A -l 'app in (web,probe)' -o custom-columns=NS:.metadata.namespace,NODE:.spec.nodeName",
      },
    ],
    resources: [
      {
        title: "Kubernetes: resource quotas",
        url: "https://kubernetes.io/docs/concepts/policy/resource-quotas/",
      },
      {
        title: "Kubernetes: limit ranges",
        url: "https://kubernetes.io/docs/concepts/policy/limit-range/",
      },
      {
        title: "Kubernetes: network policies",
        url: "https://kubernetes.io/docs/concepts/services-networking/network-policies/",
      },
      {
        title: "Capsule documentation",
        url: "https://projectcapsule.dev/docs/",
      },
    ],
  },
  {
    title: "A virtual cluster for a team that needs more",
    slug: "a-virtual-cluster-for-a-team-that-needs-more",
    description: "Some teams need a CRD or cluster-admin rights, which a namespace cannot give. Give tenant owners the rights vCluster needs, let the owner create a virtual cluster in her own namespace, and work in it as an administrator: a CRD, an object of that type, and a Deployment.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "crd.yaml",
        language: "yaml",
        code: "apiVersion: apiextensions.k8s.io/v1\nkind: CustomResourceDefinition\nmetadata:\n  name: indexes.search.example.com\nspec:\n  group: search.example.com\n  scope: Namespaced\n  names: {plural: indexes, singular: index, kind: Index}\n  versions:\n    - name: v1\n      served: true\n      storage: true\n      schema:\n        openAPIV3Schema:\n          type: object\n          properties:\n            spec:\n              type: object\n              properties:\n                shards: {type: integer}",
      },
      {
        label: "vcluster-owner.yaml",
        language: "yaml",
        code: "apiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRole\nmetadata:\n  name: vcluster-owner\nrules:\n  - apiGroups: [\"\"]\n    resources: [endpoints]\n    verbs: [create, delete, patch, update]\n  - apiGroups: [\"\"]\n    resources: [pods/ephemeralcontainers, pods/resize, pods/status]\n    verbs: [patch, update]\n  - apiGroups: [discovery.k8s.io]\n    resources: [endpointslices]\n    verbs: [create, delete, patch, update]",
      },
      {
        label: "owner-patch.yaml",
        language: "yaml",
        code: "spec:\n  additionalRoleBindings:\n    - clusterRoleName: vcluster-owner\n      subjects:\n        - kind: User\n          name: alice",
      },
      {
        label: "vcluster.yaml",
        language: "yaml",
        code: "controlPlane:\n  statefulSet:\n    image:\n      repository: loft-sh/vcluster-oss\nrbac:\n  enableVolumeSnapshotRules:\n    enabled: false",
      },
      {
        label: "index.yaml",
        language: "yaml",
        code: "apiVersion: search.example.com/v1\nkind: Index\nmetadata:\n  name: products\n  namespace: indexing\nspec:\n  shards: 3",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "alice() { KUBECONFIG=\"$PWD/alice.kubeconfig\" \"$@\"; }\nalice kubectl apply -f crd.yaml\nkubectl apply -f vcluster-owner.yaml\nkubectl patch tenant search --type merge --patch-file owner-patch.yaml\nkubectl get rolebindings -n search-test -o custom-columns=ROLE:.roleRef.name,SUBJECTS:.subjects[*].name\nalice vcluster create search-vc -n search-test -f vcluster.yaml --connect=false\nalice kubectl rollout status statefulset/search-vc -n search-test\nalice vcluster list -n search-test\nvkubectl() { alice vcluster connect search-vc -n search-test --silent -- kubectl \"$@\"; }\nvkubectl auth whoami\nvkubectl get nodes\nvkubectl apply -f crd.yaml\nvkubectl create namespace indexing\nvkubectl apply -f index.yaml\nvkubectl get index products -n indexing -o jsonpath='{.spec}{\"\\n\"}'\nvkubectl create deployment web --image nginx:1.29 --replicas 2 -n indexing\nvkubectl expose deployment web --port 80 -n indexing\nvkubectl rollout status deployment/web -n indexing\nvkubectl get pods -n indexing",
      },
    ],
    resources: [
      {
        title: "vCluster documentation",
        url: "https://www.vcluster.com/docs",
      },
      {
        title: "vCluster on GitHub",
        url: "https://github.com/loft-sh/vcluster",
      },
      {
        title: "Udienza: Piotr Zaniewski, vCluster: GPUs on demand",
        url: "https://www.udienza.com/episodes/piotr-zaniewski",
      },
    ],
  },
  {
    title: "What the host cluster sees",
    slug: "what-the-host-cluster-sees",
    description: "Look at the virtual cluster from the host: one StatefulSet, its pods under translated names, the tenant's node selector, quota and network policy still applied to them, and no trace of its CRD. Then pause it and resume it.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "alice() { KUBECONFIG=\"$PWD/alice.kubeconfig\" \"$@\"; }\nvkubectl() { alice vcluster connect search-vc -n search-test --silent -- kubectl \"$@\"; }\nvkubectl get pods -A\nalice kubectl get statefulsets,pods -n search-test\nalice kubectl get pods -n search-test \\\n  -o custom-columns=POD:.metadata.name,NODE:.spec.nodeName,SELECTOR:.spec.nodeSelector\nkubectl get crd indexes.search.example.com -o name\nkubectl get namespace indexing\nalice kubectl get pvc -n search-test -o custom-columns=CLAIM:.metadata.name,CLASS:.spec.storageClassName\nkubectl get grq search-compute -o jsonpath='{.status.total.used.pods}/{.status.total.hard.pods}{\"\\n\"}'\nalice kubectl exec -n search-test deploy/probe -- \\\n  wget -qO- -T 3 http://web-x-indexing-x-search-vc | grep title\nkubectl exec -n billing-dev deploy/probe --as bob --as-group projectcapsule.dev -- \\\n  wget -qO- -T 3 http://web-x-indexing-x-search-vc.search-test\nalice vcluster pause search-vc -n search-test\nalice vcluster list -n search-test\nalice kubectl get pods -n search-test\nkubectl get grq search-compute -o jsonpath='{.status.total.used.pods}/{.status.total.hard.pods}{\"\\n\"}'\nalice vcluster resume search-vc -n search-test\nvkubectl get indexes,deployments -n indexing\nalice kubectl get pods -n search-test",
      },
    ],
    resources: [
      {
        title: "vCluster documentation",
        url: "https://www.vcluster.com/docs",
      },
      {
        title: "vCluster on GitHub",
        url: "https://github.com/loft-sh/vcluster",
      },
      {
        title: "Kubernetes: network policies",
        url: "https://kubernetes.io/docs/concepts/services-networking/network-policies/",
      },
    ],
  },
  {
    title: "Namespaces or a virtual cluster: choose, then clean up",
    slug: "namespaces-or-a-virtual-cluster-choose-then-clean-up",
    description: "Measure the same nginx in a tenant namespace and in the virtual cluster with kubectl top, compare what each level costs on your Mac, and read the table that tells you which level a team needs. Then delete the virtual cluster and the whole cluster.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "metrics-server-values.yaml",
        language: "yaml",
        code: "args:\n  - --kubelet-insecure-tls",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server\nhelm install metrics-server metrics-server/metrics-server --version 3.14.0 \\\n  -n kube-system --values metrics-server-values.yaml --wait\nkubectl top pods -n search-dev\nkubectl top pods -n search-test\nkubectl top pods -n capsule-system\nkubectl top pods -n cert-manager\ncat decision.md\nalice() { KUBECONFIG=\"$PWD/alice.kubeconfig\" \"$@\"; }\nalice vcluster delete search-vc -n search-test\nalice vcluster list -n search-test\nkind delete cluster --name tenancy\ndocker ps --filter label=io.x-k8s.kind.cluster=tenancy --format '{{.Names}}'\nls",
      },
    ],
    resources: [
      {
        title: "metrics-server on GitHub",
        url: "https://github.com/kubernetes-sigs/metrics-server",
      },
      {
        title: "vCluster documentation",
        url: "https://www.vcluster.com/docs",
      },
      {
        title: "Capsule documentation",
        url: "https://projectcapsule.dev/docs/",
      },
      {
        title: "Udienza: Bob Killen and Daniel Krook, How the CNCF judges",
        url: "https://www.udienza.com/episodes/bob-killen-daniel-krook",
      },
    ],
  },
];

export async function seedTenancyCourse(prisma: PrismaClient) {
  const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
  const course = await prisma.course.upsert({
    where: { slug: TENANCY_COURSE_SLUG },
    update: {},
    create: {
      title: "Multi-Tenant Kubernetes with Capsule and vCluster",
      slug: TENANCY_COURSE_SLUG,
      description:
        "One Kubernetes cluster per team is expensive, and one cluster for everyone is risky. This course builds the two levels in between on your Mac with kind: tenants made of namespaces with Capsule, and virtual clusters with vCluster, running inside a tenant. Along the way, you hear what the people behind these projects said in conversations recorded for udienza.com. The episodes: Capsule and Kamaji at Clastix with Dario Tranchitella, vCluster: GPUs on demand with Piotr Zaniewski, and How the CNCF judges with Bob Killen and Daniel Krook.\n\nYou type every command yourself, watch each guardrail refuse something, see what a virtual cluster looks like from the host, and finish with a table that tells you which level a team needs.\n\nThe narration is a synthetic voice made from the author's own voice.",
      difficulty: "INTERMEDIATE",
      track: "AI_HOMELAB",
      status: "DRAFT",
      announced: false,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      thumbnailUrl: "/images/courses/multi-tenant-kubernetes-capsule-vcluster.svg",
      outcomes: [
        "Group namespaces into tenants with Capsule, and give each team owners who create their own namespaces",
        "Give an owner her own client certificate, check what she can do, and let her list only her own namespaces and nodes",
        "Set tenant-wide limits: number of namespaces, a quota for all namespaces together, default limits, network policies and storage classes",
        "Give a team a virtual cluster with vCluster when it needs CRDs or cluster-admin rights",
        "Read what a virtual cluster leaves in the host cluster, and how the tenant's limits still apply to it",
        "Choose between a tenant namespace and a virtual cluster for a team",
      ],
      prerequisites: [
        "A Mac with Apple silicon and 16 GB of memory or more",
        "Colima, kind, kubectl and Helm, set up as in the course \"Kubernetes on Your Mac\", and the vcluster CLI 0.38.0 (telemetry off: `vcluster telemetry disable`)",
        "openssl and envsubst (`brew install openssl gettext`)",
        "Basic Kubernetes: namespaces, Deployments, Services, RBAC roles and kubeconfig contexts",
      ],
      estimatedDuration: 32,
    },
  });

  for (const lessonData of tenancyLessons) {
    await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
      update: { ...lessonData },
      create: { ...lessonData, courseId: course.id, status: "DRAFT" },
    });
  }

  console.log(`  ✓ Course "${course.title}" (DRAFT) with ${tenancyLessons.length} lessons`);
}
