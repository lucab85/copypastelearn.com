/**
 * Talos Linux on Your Mac (DRAFT).
 *
 * Six lessons. Generated from the verified course (screenshare-recorder, lessons/talos): the code snippets are the
 * files typed on camera and the commands of each lesson, copied as they are. Nothing here is published: the course and
 * its lessons are DRAFT, `announced` is false, there is no video. A package import (`pnpm course:import`) adds the
 * videos, transcripts, durations, the final assessment and the Hands-On Lab text to the same lessons (same slugs).
 *
 * Idempotent, same style as the goose and MCP course seeds:
 *   - the course upsert has `update: {}`: a re-run never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only (never `status`, `videoPlaybackId` or `durationSeconds`).
 */

import type { PrismaClient } from "@prisma/client";

export const TALOS_COURSE_SLUG = "talos-linux-on-your-mac";

export const talosLessons = [
  {
    title: "A Talos cluster in Docker",
    slug: "a-talos-cluster-in-docker",
    description: "Check the Linux kernel under Docker, create a two-node Talos cluster with talosctl, find the configuration it writes for talosctl and kubectl, and see that each node is a container running Talos, with no shell inside. Episode: Thilo Fromm, \"Why the host OS still matters\". The narration is a synthetic voice made from the author's own voice.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "docker info --format '{{.KernelVersion}}'\ntalosctl version --client --short\ntalosctl cluster create docker --name talos-lab --workers 1 --host-ip 127.0.0.1\ntalosctl config contexts\nkubectl config get-contexts\nkubectl get nodes -o custom-columns=NAME:.metadata.name,VERSION:.status.nodeInfo.kubeletVersion,\\\nOS:.status.nodeInfo.osImage,KERNEL:.status.nodeInfo.kernelVersion,\\\nRUNTIME:.status.nodeInfo.containerRuntimeVersion\ndocker ps --filter label=talos.cluster.name=talos-lab --format 'table {{.Names}}\\t{{.Ports}}'\ndocker exec talos-lab-worker-1 sh",
      },
    ],
    resources: [
      {
        title: "Talos Linux",
        url: "https://www.talos.dev/",
      },
      {
        title: "Talos: create a local cluster in Docker",
        url: "https://www.talos.dev/latest/talos-guides/install/local-platforms/docker/",
      },
      {
        title: "Talos on GitHub",
        url: "https://github.com/siderolabs/talos",
      },
      {
        title: "Udienza: Thilo Fromm, Why the host OS still matters",
        url: "https://www.udienza.com/episodes/thilo-fromm",
      },
    ],
  },
  {
    title: "The API instead of a shell",
    slug: "the-api-instead-of-a-shell",
    description: "There is no SSH on a Talos node. Read cluster members, services, kubelet logs, kernel messages, processes and files through the Talos API instead.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "talosctl -n 10.5.0.2 get members\ntalosctl -n 10.5.0.2 services\ntalosctl -n 10.5.0.2 processes | sed -n 's/.* unconfined *//p' | cut -d' ' -f1 | sort -u\ntalosctl -n 10.5.0.3 logs kubelet --tail 5 | cut -d' ' -f2- | jq -r .msg | cut -c 1-100\ntalosctl -n 10.5.0.3 ls /etc/kubernetes\ntalosctl -n 10.5.0.3 read /etc/os-release\ntalosctl -n 10.5.0.3 netstat --listening --tcp --programs\ntalosctl -n 10.5.0.3 dmesg | grep -o 'Linux version [^ ]*'",
      },
    ],
    resources: [
      {
        title: "talosctl reference",
        url: "https://www.talos.dev/latest/learn-more/talosctl/",
      },
      {
        title: "Talos Linux",
        url: "https://www.talos.dev/",
      },
    ],
  },
  {
    title: "Machine configuration and patches",
    slug: "machine-configuration-and-patches",
    description: "Generate the secrets and machine configuration of a cluster, see which files must stay private, read its typed documents, write a patch that labels a node, and check it with a dry run before applying it without a reboot.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "label-patch.yaml",
        language: "yaml",
        code: "apiVersion: v1alpha1\nkind: KubeNodeConfig\nlabels:\n  pool: search",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "talosctl gen secrets\ntalosctl gen config talos-lab https://10.5.0.2:6443 --with-secrets secrets.yaml\nstat -f '%Sp %N' *\nchmod 600 talosconfig controlplane.yaml worker.yaml && stat -f '%Sp %N' *\ngrep '^kind:' controlplane.yaml | sed 's/kind: //' | column -c 110\ngrep -E '^ +(enforce|warn): ' controlplane.yaml\ngrep -A 2 'kind: KubeNodeConfig' worker.yaml\ntalosctl -n 10.5.0.3 patch machineconfig --patch @label-patch.yaml --dry-run\ntalosctl -n 10.5.0.3 patch machineconfig --patch @label-patch.yaml\nkubectl get nodes -L pool",
      },
    ],
    resources: [
      {
        title: "Talos: configuration patching",
        url: "https://www.talos.dev/latest/talos-guides/configuration/patching/",
      },
      {
        title: "talosctl reference",
        url: "https://www.talos.dev/latest/learn-more/talosctl/",
      },
    ],
  },
  {
    title: "Bring your own CNI: Cilium",
    slug: "bring-your-own-cni-cilium",
    description: "Create a cluster without a network plugin and without kube-proxy, install Cilium with Helm, and watch the nodes become Ready. Then make a Cilium network policy refuse a connection. Episode: Raymond de Jong, \"Private networks for VMs on Kubernetes\".",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "cilium-patch.yaml",
        language: "yaml",
        code: "apiVersion: v1alpha1\nkind: KubeFlannelCNIConfig\n$patch: delete\n---\napiVersion: v1alpha1\nkind: KubeProxyConfig\nenabled: false",
      },
      {
        label: "cilium-values.yaml",
        language: "yaml",
        code: "ipam:\n  mode: kubernetes\nkubeProxyReplacement: true\nk8sServiceHost: localhost\nk8sServicePort: 7445\ncgroup:\n  autoMount:\n    enabled: false\n  hostRoot: /sys/fs/cgroup\nsecurityContext:\n  capabilities:\n    ciliumAgent: [CHOWN, KILL, NET_ADMIN, NET_RAW, IPC_LOCK, SYS_ADMIN, SYS_RESOURCE, DAC_OVERRIDE, FOWNER, SETGID, SETUID]\n    cleanCiliumState: [NET_ADMIN, SYS_ADMIN, SYS_RESOURCE]",
      },
      {
        label: "web.yaml",
        language: "yaml",
        code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: web\n  labels: {app: web}\nspec:\n  securityContext:\n    runAsNonRoot: true\n    runAsUser: 101\n    seccompProfile: {type: RuntimeDefault}\n  containers:\n    - name: nginx\n      image: nginxinc/nginx-unprivileged:1.29\n      ports: [{containerPort: 8080}]\n      securityContext:\n        allowPrivilegeEscalation: false\n        capabilities: {drop: [ALL]}",
      },
      {
        label: "client.yaml",
        language: "yaml",
        code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: client\nspec:\n  securityContext:\n    runAsNonRoot: true\n    runAsUser: 1000\n    seccompProfile: {type: RuntimeDefault}\n  containers:\n    - name: busybox\n      image: busybox:1.37\n      command: [sleep, \"3600\"]\n      securityContext:\n        allowPrivilegeEscalation: false\n        capabilities: {drop: [ALL]}",
      },
      {
        label: "same-namespace-only.yaml",
        language: "yaml",
        code: "apiVersion: cilium.io/v2\nkind: CiliumNetworkPolicy\nmetadata:\n  name: same-namespace-only\n  namespace: search\nspec:\n  endpointSelector: {}\n  ingress:\n    - fromEndpoints:\n        - matchLabels:\n            k8s:io.kubernetes.pod.namespace: search",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "talosctl cluster create docker --name talos-lab --workers 1 --host-ip 127.0.0.1 \\\n  --config-patch-controlplanes @cilium-patch.yaml\nkubectl get nodes\nhelm repo add cilium https://helm.cilium.io\nhelm install cilium cilium/cilium --version 1.20.5 \\\n  --namespace kube-system --values cilium-values.yaml\nkubectl wait --for=condition=Ready nodes --all --timeout=180s\nkubectl -n kube-system rollout status deployment/coredns\nkubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep -E '^(Cilium:|KubeProxy)'\nkubectl create namespace search && kubectl create namespace billing\nkubectl apply -n search -f web.yaml && kubectl expose pod web -n search --port 80 --target-port 8080\nkubectl apply -n search -f client.yaml && kubectl apply -n billing -f client.yaml\nfor ns in search billing; do kubectl wait -n $ns --for=condition=Ready pod --all; done\nkubectl exec -n search client -- wget -qO- -T 3 web.search | grep title\nkubectl exec -n billing client -- wget -qO- -T 3 web.search | grep title\nkubectl apply -f same-namespace-only.yaml\nkubectl exec -n search client -- wget -qO- -T 3 web.search | grep title\nkubectl exec -n billing client -- wget -qO- -T 3 web.search | grep title",
      },
    ],
    resources: [
      {
        title: "Talos: deploying Cilium",
        url: "https://www.talos.dev/latest/talos-guides/network/deploying-cilium/",
      },
      {
        title: "Cilium documentation",
        url: "https://docs.cilium.io/en/stable/",
      },
      {
        title: "Udienza: Raymond de Jong, Private networks for VMs on Kubernetes",
        url: "https://www.udienza.com/episodes/raymond-de-jong",
      },
    ],
  },
  {
    title: "Upgrade Kubernetes, back up etcd",
    slug: "upgrade-kubernetes-back-up-etcd",
    description: "Upgrade the Kubernetes version of a running Talos cluster with a dry run first, list the etcd members, and save an etcd snapshot to your Mac. Then see why an operating system upgrade needs a real machine. Episode: Steve Francis, \"Talos in the AI era\".",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "kubectl get nodes\nENDPOINT=https://$(docker port talos-lab-controlplane-1 6443/tcp) && echo $ENDPOINT\ntalosctl -n 10.5.0.2 upgrade-k8s --to 1.37.1 --endpoint $ENDPOINT --dry-run | head -16\ntalosctl -n 10.5.0.2 upgrade-k8s --to 1.37.1 --endpoint $ENDPOINT | grep -v creationTimestamp\nkubectl get nodes\ntalosctl -n 10.5.0.2 etcd members\ntalosctl -n 10.5.0.2 etcd status | cut -c 1-62\ntalosctl -n 10.5.0.2 etcd snapshot etcd-backup.db\nstat -f '%Sp %z %N' etcd-backup.db\ntalosctl -n 10.5.0.3 upgrade",
      },
    ],
    resources: [
      {
        title: "Talos: upgrading Kubernetes",
        url: "https://www.talos.dev/latest/kubernetes-guides/upgrading-kubernetes/",
      },
      {
        title: "Talos: etcd maintenance",
        url: "https://www.talos.dev/latest/advanced/etcd-maintenance/",
      },
      {
        title: "Talos: upgrading Talos",
        url: "https://www.talos.dev/latest/talos-guides/upgrading-talos/",
      },
      {
        title: "Udienza: Steve Francis and Anant Yardi, Talos in the AI era",
        url: "https://www.udienza.com/episodes/francis-yardi",
      },
    ],
  },
  {
    title: "From your Mac to real machines, then clean up",
    slug: "from-your-mac-to-real-machines-then-clean-up",
    description: "See the ways to run and provision Talos beyond Docker and where the install disk and image are set, then destroy the cluster and remove its entries from your client files, so nothing is left in Docker. Episodes: Pepijn Oomen, \"Reviving Cluster API for Talos Linux\" and Steve Francis, \"Talos in the AI era\".",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "talosctl cluster create --help | grep -A 4 'Available Commands'\ntalosctl gen config --help | grep -E 'install-(disk|image)'\ntalosctl gen config talos-lab https://10.5.0.2:6443 -t worker -o - --with-docs=false \\\n  | grep -A 7 'kind: UnattendedInstallConfig'\ntime talosctl cluster destroy --name talos-lab\ndocker ps -a --filter label=talos.cluster.name=talos-lab && \\\n  docker network ls --filter label=talos.cluster.name=talos-lab\ntalosctl config contexts\nrm ~/.talos/config\nkubectl config delete-context admin@talos-lab && kubectl config delete-cluster talos-lab\nkubectl config delete-user admin@talos-lab\nkubectl config get-contexts\nls",
      },
    ],
    resources: [
      {
        title: "Sidero Labs",
        url: "https://www.siderolabs.com/",
      },
      {
        title: "Talos Image Factory",
        url: "https://factory.talos.dev/",
      },
      {
        title: "Udienza: Pepijn Oomen, Reviving Cluster API for Talos Linux",
        url: "https://www.udienza.com/episodes/pepijn-oomen",
      },
      {
        title: "Udienza: Steve Francis and Anant Yardi, Talos in the AI era",
        url: "https://www.udienza.com/episodes/francis-yardi",
      },
    ],
  },
];

export async function seedTalosCourse(prisma: PrismaClient) {
  const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
  const course = await prisma.course.upsert({
    where: { slug: TALOS_COURSE_SLUG },
    update: {},
    create: {
      title: "Talos Linux on Your Mac",
      slug: TALOS_COURSE_SLUG,
      description:
        "Talos Linux is built to run Kubernetes and nothing else. There is no shell, no SSH and no package manager: you manage every node through an API with talosctl. This course runs Talos as containers on your Mac, so you can learn that API, the machine configuration, the network plugin and upgrades without any hardware. Each module starts from a conversation recorded for udienza.com at TalosCon in Amsterdam and at Open Source Summit Europe.\n\nYou type every command yourself and finish knowing how to take what you practiced to real machines.\n\nThe narration is a synthetic voice made from the author's own voice.",
      difficulty: "INTERMEDIATE",
      track: "AI_HOMELAB",
      status: "DRAFT",
      announced: false,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      thumbnailUrl: "/images/courses/talos-linux-on-your-mac.svg",
      outcomes: [
        "Create a Talos Linux cluster in Docker with talosctl, and connect to it with talosctl and kubectl",
        "Read services, logs and files on a node through the Talos API, without a shell",
        "Generate machine configuration, change it with patches, and check each change with a dry run before applying it",
        "Replace the default network plugin with Cilium, and enforce a network policy",
        "Upgrade Kubernetes on a Talos cluster and take an etcd snapshot",
        "Know the ways to provision Talos on real machines, and remove everything the course created",
      ],
      prerequisites: [
        "A Mac with Apple silicon and 16 GB of memory or more",
        "Colima, kubectl and Helm, set up as in the course \"Kubernetes on Your Mac\"",
        "A Colima profile whose Linux kernel is 6.15 or newer, which Talos 1.14 needs to run in containers; the first lesson shows how to install Ubuntu's newer kernel in it",
        "Basic Kubernetes: nodes, pods, Deployments and kubeconfig contexts",
      ],
      estimatedDuration: 31,
    },
  });

  for (const lessonData of talosLessons) {
    await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
      update: { ...lessonData },
      create: { ...lessonData, courseId: course.id, status: "DRAFT" },
    });
  }

  console.log(`  ✓ Course "${course.title}" (DRAFT) with ${talosLessons.length} lessons`);
}
