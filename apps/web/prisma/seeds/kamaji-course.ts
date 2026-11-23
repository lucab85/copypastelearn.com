/**
 * Kubernetes Control Planes as a Service with Kamaji (DRAFT).
 *
 * Six lessons. Generated from the verified course (screenshare-recorder, lessons/kamaji): the code snippets are the
 * files typed on camera and the commands of each lesson, copied as they are. Nothing here is published: the course and
 * its lessons are DRAFT, `announced` is false, there is no video. A package import (`pnpm course:import`) adds the
 * videos, transcripts, durations, the final assessment and the Hands-On Lab text to the same lessons (same slugs).
 *
 * Idempotent, same style as the goose and MCP course seeds:
 *   - the course upsert has `update: {}`: a re-run never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only (never `status`, `videoPlaybackId` or `durationSeconds`).
 */

import type { PrismaClient } from "@prisma/client";

export const KAMAJI_COURSE_SLUG = "kamaji-hosted-control-planes";

export const kamajiLessons = [
  {
    title: "A management cluster for control planes",
    slug: "a-management-cluster-for-control-planes",
    description: "Create the management cluster with kind, then install cert-manager, a datastore and Kamaji, and see the resources Kamaji adds to Kubernetes. The narration is a synthetic voice made from the author's own voice.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "cluster.yaml",
        language: "yaml",
        code: "kind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nname: kamaji-mgmt\nnodes:\n  - role: control-plane\n    extraPortMappings:\n      # tenant API servers, published on the Mac only (127.0.0.1)\n      - containerPort: 31443\n        hostPort: 31443\n        listenAddress: 127.0.0.1\n      - containerPort: 31444\n        hostPort: 31444\n        listenAddress: 127.0.0.1",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "docker info --format '{{.NCPU}} CPUs, {{.MemTotal}} bytes of memory'\nkind version && kubectl version --client && helm version --short\nkind create cluster --config cluster.yaml --image kindest/node:v1.37.0\ndocker ps --filter label=io.x-k8s.kind.cluster=kamaji-mgmt --format 'table {{.Names}}\\t{{.Ports}}'\nhelm install cert-manager oci://quay.io/jetstack/charts/cert-manager --version v1.21.3 \\\n  --namespace cert-manager --create-namespace --set crds.enabled=true --wait\ngit -c advice.detachedHead=false clone -q --depth 1 --branch 26.11.4-edge \\\n  https://github.com/clastix/kamaji.git\ngrep -h \"production ready\\|subscription basis\" kamaji/docs/content/reference/versioning.md\nREL=https://api.github.com/repos/clastix/kamaji/releases/tags/26.11.4-edge\ncurl -s $REL | jq -r .body | grep evaluation\nhelm repo add clastix https://clastix.github.io/charts\nhelm dependency build kamaji/charts/kamaji\nhelm install kamaji kamaji/charts/kamaji --namespace kamaji-system --create-namespace \\\n  --set image.tag=26.11.4-edge --wait --timeout 10m\nkubectl get crds -o name | grep kamaji\nkubectl get datastores\nkubectl get pods -n kamaji-system",
      },
    ],
    resources: [
      {
        title: "Kamaji documentation",
        url: "https://kamaji.clastix.io/",
      },
      {
        title: "Kamaji on GitHub",
        url: "https://github.com/clastix/kamaji",
      },
      {
        title: "Kamaji: getting started on kind",
        url: "https://kamaji.clastix.io/getting-started/kamaji-kind/",
      },
      {
        title: "Kamaji: releases and versions",
        url: "https://kamaji.clastix.io/reference/versioning/",
      },
      {
        title: "Udienza: Dario Tranchitella, Capsule and Kamaji at Clastix",
        url: "https://www.udienza.com/episodes/dario-tranchitella",
      },
    ],
  },
  {
    title: "Your first tenant control plane",
    slug: "your-first-tenant-control-plane",
    description: "Describe a tenant cluster in one file, apply it, and find its API server, controller manager and scheduler running as pods. Connect to it with its own kubeconfig, and see why a workload waits for a node.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "search.yaml",
        language: "yaml",
        code: "apiVersion: kamaji.clastix.io/v1alpha1\nkind: TenantControlPlane\nmetadata:\n  name: search\n  namespace: tenants\nspec:\n  controlPlane:\n    deployment:\n      replicas: 2\n    service:\n      serviceType: NodePort\n  kubernetes:\n    version: \"v1.36.4\"\n    kubelet:\n      configurationJSONPatches:\n        - {op: add, path: /cgroupDriver, value: systemd}\n  networkProfile:\n    address: NODE_IP\n    port: 31443\n    certSANs: [127.0.0.1]\n  addons:\n    coreDNS: {}\n    kubeProxy: {}\n    konnectivity:\n      server: {port: 31132}\n      agent: {mode: DaemonSet}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get datastores\nkubectl create namespace tenants\nNODE_IP=$(kubectl get node kamaji-mgmt-control-plane \\\n  -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}')\necho $NODE_IP\nsed \"s/NODE_IP/$NODE_IP/\" search.yaml | kubectl apply -f -\nkubectl wait tcp/search -n tenants --timeout=180s \\\n  --for=jsonpath='{.status.kubernetesResources.version.status}'=Ready\nkubectl get tcp -n tenants\nkubectl get deployments,pods,services -n tenants\nkubectl get deploy search -n tenants -o jsonpath='{.spec.template.spec.containers[*].name}'; echo\nkubectl get secret search-admin-kubeconfig -n tenants \\\n  -o jsonpath='{.data.admin\\.conf}' | base64 -d > search.kubeconfig\nchmod 600 search.kubeconfig && stat -f '%Sp %N' search.kubeconfig\nkubectl --kubeconfig search.kubeconfig config view -o jsonpath='{.clusters[0].cluster.server}'; echo\nkubectl --kubeconfig search.kubeconfig config set-cluster search --server https://127.0.0.1:31443\nkubectl --kubeconfig search.kubeconfig version\nkubectl --kubeconfig search.kubeconfig get nodes\nkubectl --kubeconfig search.kubeconfig get pods -n kube-system",
      },
    ],
    resources: [
      {
        title: "Kamaji: the tenant control plane",
        url: "https://kamaji.clastix.io/concepts/tenant-control-plane/",
      },
      {
        title: "Kamaji documentation",
        url: "https://kamaji.clastix.io/",
      },
    ],
  },
  {
    title: "Join a worker node",
    slug: "join-a-worker-node",
    description: "Create a join token on the tenant cluster, join a worker node to it, and watch the waiting workload start on a node that the management cluster does not even see.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "worker.sh",
        language: "bash",
        code: "#!/bin/bash\n# A worker for a tenant cluster: a kindest/node container on the kind network, with the flags\n# kind uses for its own nodes, joined with a token made against the tenant API.\n# Usage: worker.sh <name> <tenant kubeconfig>\nset -euo pipefail\nNAME=$1 KCFG=$2 IMAGE=kindest/node:v1.36.4\ndocker run -d --name \"$NAME\" --hostname \"$NAME\" --network kind --privileged \\\n  --security-opt seccomp=unconfined --security-opt apparmor=unconfined \\\n  --tmpfs /tmp --tmpfs /run --volume /var --volume /lib/modules:/lib/modules:ro \\\n  --cgroupns=private --label course=kamaji \"$IMAGE\"\nuntil docker exec \"$NAME\" systemctl is-active --quiet containerd; do sleep 1; done\n# Inside the worker, 127.0.0.1 is the worker itself: use the management node's IP.\nMGMT=$(docker inspect -f '{{.NetworkSettings.Networks.kind.IPAddress}}' kamaji-mgmt-control-plane)\nsed \"s#https://127.0.0.1:#https://$MGMT:#\" \"$KCFG\" |\n  docker exec -i \"$NAME\" sh -c 'umask 077; cat > /root/admin.conf'\nJOIN=$(docker exec \"$NAME\" kubeadm token create --print-join-command --kubeconfig /root/admin.conf)\ndocker exec \"$NAME\" rm /root/admin.conf\n# A container cannot load the kernel's \"configs\" module that this check reads;\n# kind skips the same check for its own nodes. grep drops log lines that carry a time.\ndocker exec \"$NAME\" sh -c \"$JOIN --ignore-preflight-errors=SystemVerification\" 2>&1 |\n  grep -v '^[IWE][0-9]'",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl --kubeconfig search.kubeconfig get nodes\nchmod +x worker.sh\n./worker.sh search-worker search.kubeconfig\nkubectl --kubeconfig search.kubeconfig get nodes\nkubectl --kubeconfig search.kubeconfig logs -n kube-system ds/kube-proxy\ndocker exec search-worker sysctl -n net.netfilter.nf_conntrack_max\nCALICO=https://raw.githubusercontent.com/projectcalico/calico/v3.33.1/manifests/calico.yaml\nkubectl --kubeconfig search.kubeconfig apply -f $CALICO | tail -4\nkubectl --kubeconfig search.kubeconfig wait --for=condition=Ready node/search-worker --timeout=180s\nkubectl --kubeconfig search.kubeconfig get pods -n kube-system\nkubectl --kubeconfig search.kubeconfig create deployment web --image=nginx:1.30.7\nkubectl --kubeconfig search.kubeconfig create service nodeport web --tcp=80:80 --node-port=30080\nkubectl --kubeconfig search.kubeconfig rollout status deployment/web\nkubectl --kubeconfig search.kubeconfig logs deployment/web | head -3\nkubectl --kubeconfig search.kubeconfig exec deployment/web -- nginx -v\ndocker exec search-worker curl -s -o /dev/null -w '%{http_code}\\n' localhost:30080\nkubectl get nodes",
      },
    ],
    resources: [
      {
        title: "Kamaji: tenant worker nodes",
        url: "https://kamaji.clastix.io/concepts/tenant-worker-nodes/",
      },
      {
        title: "Kamaji: Konnectivity",
        url: "https://kamaji.clastix.io/concepts/konnectivity/",
      },
      {
        title: "kubeadm join",
        url: "https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-join/",
      },
      {
        title: "Calico",
        url: "https://docs.tigera.io/calico/latest/about",
      },
    ],
  },
  {
    title: "Many control planes, one datastore",
    slug: "many-control-planes-one-datastore",
    description: "Add a second tenant control plane on the same datastore, and measure the memory each control plane uses, compared with the management cluster's own control plane. Then install Headlamp, the Kubernetes web UI, and see the tenant control planes and, through its kubeconfig, a tenant cluster's own workloads in the browser.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "billing.yaml",
        language: "yaml",
        code: "apiVersion: kamaji.clastix.io/v1alpha1\nkind: TenantControlPlane\nmetadata:\n  name: billing\n  namespace: tenants\nspec:\n  controlPlane:\n    deployment:\n      replicas: 2\n    service:\n      serviceType: NodePort\n  kubernetes:\n    version: \"v1.36.4\"\n    kubelet:\n      configurationJSONPatches:\n        - {op: add, path: /cgroupDriver, value: systemd}\n  networkProfile:\n    address: NODE_IP\n    port: 31444\n    certSANs: [127.0.0.1]\n  addons:\n    coreDNS: {}\n    kubeProxy: {}\n    konnectivity:\n      server: {port: 31133}\n      agent: {mode: DaemonSet}",
      },
      {
        label: "headlamp-values.yaml",
        language: "yaml",
        code: "# Headlamp, the Kubernetes web UI, in the management cluster\nresources:\n  requests:\n    cpu: 10m\n    memory: 32Mi\n  limits:\n    memory: 128Mi\n# Also the tenant cluster search: its admin kubeconfig, mounted from a Secret\nconfig:\n  extraArgs:\n    - -kubeconfig=/tenants/search\nvolumes:\n  - name: tenants\n    secret:\n      secretName: tenant-kubeconfigs\nvolumeMounts:\n  - name: tenants\n    mountPath: /tenants\n    readOnly: true",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get tcp -n tenants\nNODE_IP=$(kubectl get node kamaji-mgmt-control-plane \\\n  -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}')\nsed \"s/NODE_IP/$NODE_IP/\" billing.yaml | kubectl apply -f -\nkubectl wait tcp/billing -n tenants --timeout=180s \\\n  --for=jsonpath='{.status.kubernetesResources.version.status}'=Ready\nkubectl get tcp -n tenants\nkubectl get datastore default -o jsonpath='{.status.usedBy}' | jq .\nkubectl get pods -n tenants\nhelm install metrics-server metrics-server --repo https://kubernetes-sigs.github.io/metrics-server \\\n  --version 3.14.0 --namespace kube-system --set 'args={--kubelet-insecure-tls}' --wait\nkubectl top pods -n tenants --containers\nkubectl top pods -n tenants\nkubectl top pods -n kamaji-system\nkubectl top pods -n kube-system -l tier=control-plane\nhelm repo add headlamp https://kubernetes-sigs.github.io/headlamp/\nkubectl create namespace headlamp\nkubectl get secret search-admin-kubeconfig -n tenants -o jsonpath='{.data.admin\\.svc}' \\\n  | base64 -d | sed 's/kubernetes-admin@search/search/' \\\n  | kubectl create secret generic tenant-kubeconfigs -n headlamp --from-file=search=/dev/stdin\nhelm install headlamp headlamp/headlamp --version 0.46.0 \\\n  --namespace headlamp --values headlamp-values.yaml --wait\nkubectl port-forward -n headlamp svc/headlamp 8094:80 &\ncurl -s -o /dev/null -w '%{http_code}\\n' localhost:8094\nkubectl create token headlamp -n headlamp | pbcopy",
      },
    ],
    resources: [
      {
        title: "Headlamp",
        url: "https://headlamp.dev/",
      },
      {
        title: "Kamaji documentation",
        url: "https://kamaji.clastix.io/",
      },
      {
        title: "Udienza: Dario Tranchitella, Capsule and Kamaji at Clastix",
        url: "https://www.udienza.com/episodes/dario-tranchitella",
      },
    ],
  },
  {
    title: "Upgrade a tenant control plane",
    slug: "upgrade-a-tenant-control-plane",
    description: "Change the Kubernetes version of a tenant control plane, check its API and its app once a second during the rolling update, and see the worker stay on its version, in kubectl and in Headlamp.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "probe.sh",
        language: "bash",
        code: "#!/bin/bash\n# Once a second: the version the tenant API answers with, and the HTTP status of the app\n# on the worker. Usage: probe.sh <tenant kubeconfig> <seconds>\nfor i in $(seq \"$2\"); do\n  api=$(kubectl --kubeconfig \"$1\" version -o json --request-timeout=1s 2>/dev/null |\n    jq -r '.serverVersion.gitVersion // empty')\n  app=$(docker exec search-worker curl -s -m 1 -o /dev/null -w '%{http_code}' localhost:30080)\n  echo \"$i  api: ${api:-no answer}  app: $app\"\n  sleep 1\ndone",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get tcp -n tenants\nchmod +x probe.sh && ./probe.sh search.kubeconfig 3\nkubectl patch tcp search -n tenants --type merge -p '{\"spec\":{\"kubernetes\":{\"version\":\"v1.37.0\"}}}'\n./probe.sh search.kubeconfig 30\nkubectl get tcp -n tenants\nkubectl get deploy search -n tenants\nkubectl get deploy search -n tenants -o jsonpath='{..image}' | tr ' ' '\\n'\nkubectl --kubeconfig search.kubeconfig get ds kube-proxy -n kube-system -o jsonpath='{..image}'; echo\nkubectl --kubeconfig search.kubeconfig get nodes\nkubectl --kubeconfig search.kubeconfig version",
      },
    ],
    resources: [
      {
        title: "Kamaji: releases and versions",
        url: "https://kamaji.clastix.io/reference/versioning/",
      },
      {
        title: "Kamaji: the tenant control plane",
        url: "https://kamaji.clastix.io/concepts/tenant-control-plane/",
      },
    ],
  },
  {
    title: "When the control plane fails, then clean up",
    slug: "when-the-control-plane-fails-then-clean-up",
    description: "Delete both control plane pods of a tenant and watch them come back while the workloads keep running, then remove every tenant cluster, the worker and the management cluster.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get pods -n tenants\nkubectl delete pods -n tenants -l kamaji.clastix.io/name=search --wait=false\n./probe.sh search.kubeconfig 25\nkubectl get pods -n tenants\nkubectl delete tcp --all -n tenants\nkubectl wait --for=delete pods --all -n tenants --timeout=120s\nkubectl get pods,services,secrets -n tenants\nkubectl get datastore default -o jsonpath='{.status.usedBy}'; echo\ndocker rm -fv search-worker\nkind delete cluster --name kamaji-mgmt\ndocker ps -a --filter label=course=kamaji && kind get clusters\nrm search.kubeconfig && ls",
      },
    ],
    resources: [
      {
        title: "Kamaji: Konnectivity",
        url: "https://kamaji.clastix.io/concepts/konnectivity/",
      },
      {
        title: "Kamaji on GitHub",
        url: "https://github.com/clastix/kamaji",
      },
      {
        title: "Udienza: Dario Tranchitella, Capsule and Kamaji at Clastix",
        url: "https://www.udienza.com/episodes/dario-tranchitella",
      },
    ],
  },
];

export async function seedKamajiCourse(prisma: PrismaClient) {
  const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
  const course = await prisma.course.upsert({
    where: { slug: KAMAJI_COURSE_SLUG },
    update: {},
    create: {
      title: "Kubernetes Control Planes as a Service with Kamaji",
      slug: KAMAJI_COURSE_SLUG,
      description:
        "When a platform team hands out whole clusters, every control plane usually needs its own machines. Kamaji runs them as pods in a management cluster instead, with their state in a shared datastore, while each tenant's worker nodes join from outside. This course builds that on your Mac with kind, from the first tenant control plane to an upgrade and a failure. It starts from a conversation recorded for udienza.com with Dario Tranchitella, CTO of Clastix, the company behind Kamaji.\n\nYou type every command yourself and see what a control plane costs when it is a pod.\n\nThe narration is a synthetic voice made from the author's own voice.",
      difficulty: "ADVANCED",
      track: "AI_HOMELAB",
      status: "DRAFT",
      announced: false,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      thumbnailUrl: "/images/courses/kamaji-hosted-control-planes.svg",
      outcomes: [
        "Prepare a management cluster with cert-manager, a datastore and Kamaji",
        "Create a tenant control plane and connect to it with its own kubeconfig",
        "Join a worker node to a tenant control plane and run a workload on it",
        "Run several tenant control planes on one datastore, measure what each one uses, and see them in Headlamp, the Kubernetes web UI",
        "Upgrade a tenant control plane while its API keeps answering",
        "See how a tenant cluster behaves when its control plane pods fail, and remove everything the course created",
      ],
      prerequisites: [
        "A Mac with Apple silicon and 16 GB of memory or more",
        "Colima, kind, kubectl and Helm, set up as in the course \"Kubernetes on Your Mac\"",
        "Kubernetes administration: control plane components, kubeadm, certificates and kubeconfig files",
      ],
      estimatedDuration: 32,
    },
  });

  for (const lessonData of kamajiLessons) {
    await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
      update: { ...lessonData },
      create: { ...lessonData, courseId: course.id, status: "DRAFT" },
    });
  }

  console.log(`  ✓ Course "${course.title}" (DRAFT) with ${kamajiLessons.length} lessons`);
}
