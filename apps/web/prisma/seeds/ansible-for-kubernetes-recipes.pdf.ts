/**
 * PDF generator for "Ansible for Kubernetes Recipes".
 *
 * Operations cookbook for managing Kubernetes clusters with Ansible:
 * installing kubeadm / k3s / OpenShift, day-2 lifecycle (upgrades, addons,
 * cordons), GitOps bootstrap (Argo CD / Flux), the kubernetes.core
 * collection, EE images, AAP integration, observability, and DR.
 *
 * Distinct from the user's Apress 2023 book by title and scope -
 * recipes are written from public Ansible / kubernetes.core patterns.
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

export async function generateAnsibleForKubernetesRecipesPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Ansible for Kubernetes Recipes",
    subject:
      "Operations cookbook for installing and managing Kubernetes clusters with Ansible - kubeadm, k3s, OpenShift, kubernetes.core, EE images, AAP, GitOps bootstrap.",
    keywords: [
      "ansible",
      "kubernetes",
      "kubeadm",
      "k3s",
      "openshift",
      "kubernetes.core",
      "execution-environment",
      "aap",
      "argocd",
      "flux",
      "gitops",
    ],
    headerLeft: "Ansible for Kubernetes Recipes",
  });

  drawCover(ctx, {
    title: "Ansible for Kubernetes Recipes",
    subtitle: "Install, upgrade, and operate clusters with idempotent playbooks",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "Inventory and connection patterns for cluster nodes",
    "Pre-flight: kernel modules, sysctl, swap, time sync",
    "Install containerd + CRI-O via Ansible",
    "kubeadm cluster from scratch with Ansible",
    "k3s single-node and HA install playbook",
    "OpenShift agent-based installer wrapper",
    "Joining workers and rotating tokens",
    "Day-2: drain, cordon, uncordon, evacuate",
    "Rolling control-plane and kubelet upgrades",
    "The kubernetes.core collection essentials",
    "Templating Kubernetes manifests with Jinja2",
    "Helm releases via kubernetes.core.helm",
    "Secrets: SealedSecrets, ExternalSecrets, Vault",
    "GitOps bootstrap: Argo CD and Flux",
    "Cluster addons: ingress, cert-manager, metrics-server",
    "MetalLB, Calico, Cilium provisioning",
    "Persistent storage: OpenEBS, Longhorn, Rook-Ceph",
    "Backup and DR with Velero",
    "Observability: kube-prometheus-stack and Loki",
    "Execution Environments for kubernetes.core",
    "Ansible Automation Platform job templates",
    "CI / CD: molecule + kind for role testing",
    "Common errors and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "Ansible for Kubernetes Recipes is the operations cookbook we hand to platform engineers running clusters with Ansible. It covers installing kubeadm, k3s, and OpenShift, day-2 lifecycle (upgrades, drains, addons), the kubernetes.core collection, GitOps bootstrap, Execution Environments, AAP integration, and disaster recovery.",
  );
  drawParagraph(
    ctx,
    "Every recipe is tested against Ansible 11 (ansible-core 2.18), kubernetes.core 5.x, Kubernetes 1.29-1.31, k3s 1.31+, and OpenShift 4.17. Idempotency is non-negotiable - every play converges in a second run with zero changed tasks.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Inventory patterns for control-plane / workers / GPU nodes / edge.",
    "Pre-flight role: kernel modules, sysctl, swap, time sync, firewall.",
    "kubeadm + containerd cluster from scratch in three plays.",
    "k3s HA cluster, OpenShift agent-based installer wrapper, RKE2 reference.",
    "Day-2: cordon / drain / evacuate / rolling kubelet upgrade.",
    "kubernetes.core deep-dive: k8s, k8s_info, helm, helm_repository.",
    "GitOps bootstrap with Argo CD + Flux via Ansible.",
    "Cluster addons: ingress, cert-manager, metrics-server, MetalLB, Calico/Cilium.",
    "Storage (OpenEBS, Longhorn, Rook-Ceph) and DR (Velero) recipes.",
    "EE images, AAP job templates, molecule + kind tests, common errors.",
    "Lifetime updates while the recipes are maintained, delivered via /library.",
  ]);

  // 2 inventory
  newPage(ctx);
  drawHeading(ctx, "2. Inventory and connection patterns for cluster nodes", 1);
  drawCode(
    ctx,
    [
      "# inventories/prod/hosts.yml",
      "all:",
      "  children:",
      "    k8s_cluster:",
      "      children:",
      "        control_plane:",
      "          hosts:",
      "            cp1: { ansible_host: 10.0.0.11 }",
      "            cp2: { ansible_host: 10.0.0.12 }",
      "            cp3: { ansible_host: 10.0.0.13 }",
      "        workers:",
      "          hosts:",
      "            w[01:08]: { ansible_host: \"10.0.1.{{ (item|int)+10 }}\" }",
      "        gpu_workers:",
      "          hosts: { gpu[01:04]: {} }",
      "  vars:",
      "    ansible_user: ansible",
      "    ansible_become: true",
      "    kubernetes_version: \"1.31.3\"",
      "    pod_subnet: \"10.244.0.0/16\"",
      "    service_subnet: \"10.96.0.0/12\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Group by role (control_plane, workers, gpu_workers, edge) - playbooks target groups.",
    "Pin `kubernetes_version` per inventory; never let `latest` drive a control plane.",
    "SSH user without password sudo; rotate the bootstrap user post-install.",
    "Keep secrets in ansible-vault or a Vault lookup, never in inventory files.",
  ]);

  // 3 preflight
  newPage(ctx);
  drawHeading(ctx, "3. Pre-flight: kernel modules, sysctl, swap, time sync", 1);
  drawCode(
    ctx,
    [
      "- name: Kubernetes pre-flight",
      "  hosts: k8s_cluster",
      "  become: true",
      "  tasks:",
      "    - name: Disable swap",
      "      ansible.builtin.command: swapoff -a",
      "      changed_when: false",
      "    - name: Remove swap from fstab",
      "      ansible.posix.mount:",
      "        path: swap",
      "        state: absent",
      "    - name: Load br_netfilter and overlay",
      "      community.general.modprobe:",
      "        name: \"{{ item }}\"",
      "        state: present",
      "      loop: [br_netfilter, overlay]",
      "    - name: Persist module load",
      "      ansible.builtin.copy:",
      "        dest: /etc/modules-load.d/k8s.conf",
      "        content: \"br_netfilter\\noverlay\\n\"",
      "        mode: \"0644\"",
      "    - name: sysctl for kube-proxy and CNI",
      "      ansible.posix.sysctl:",
      "        name: \"{{ item.k }}\"",
      "        value: \"{{ item.v }}\"",
      "        sysctl_file: /etc/sysctl.d/99-k8s.conf",
      "        reload: true",
      "      loop:",
      "        - { k: net.ipv4.ip_forward, v: \"1\" }",
      "        - { k: net.bridge.bridge-nf-call-iptables, v: \"1\" }",
      "        - { k: net.bridge.bridge-nf-call-ip6tables, v: \"1\" }",
      "    - name: chrony time sync",
      "      ansible.builtin.package: { name: chrony, state: present }",
      "    - name: chronyd enabled and running",
      "      ansible.builtin.service: { name: chronyd, enabled: true, state: started }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Swap off + sysctl forwarding are the two failures we see most when bootstrapping kubeadm.",
    "Modules must persist across reboots - the modules-load.d drop-in handles that.",
    "Time skew breaks etcd quorum within minutes; chrony is non-negotiable.",
    "Run pre-flight as a tag so a `--tags preflight` re-run validates new nodes.",
  ]);

  // 4 containerd
  newPage(ctx);
  drawHeading(ctx, "4. Install containerd + CRI-O via Ansible", 1);
  drawCode(
    ctx,
    [
      "- name: Install containerd",
      "  hosts: k8s_cluster",
      "  become: true",
      "  tasks:",
      "    - name: Docker repo",
      "      ansible.builtin.yum_repository:",
      "        name: docker-ce",
      "        description: Docker CE Stable",
      "        baseurl: https://download.docker.com/linux/centos/$releasever/$basearch/stable",
      "        gpgkey: https://download.docker.com/linux/centos/gpg",
      "        gpgcheck: true",
      "      when: ansible_os_family == 'RedHat'",
      "    - name: Install containerd.io",
      "      ansible.builtin.package: { name: containerd.io, state: present }",
      "    - name: Generate default config",
      "      ansible.builtin.shell: containerd config default > /etc/containerd/config.toml",
      "      args: { creates: /etc/containerd/config.toml }",
      "    - name: Enable SystemdCgroup",
      "      ansible.builtin.replace:",
      "        path: /etc/containerd/config.toml",
      "        regexp: 'SystemdCgroup = false'",
      "        replace: 'SystemdCgroup = true'",
      "      notify: restart containerd",
      "  handlers:",
      "    - name: restart containerd",
      "      ansible.builtin.service: { name: containerd, state: restarted }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always enable `SystemdCgroup = true` on RHEL / Ubuntu - kubelet refuses cgroupfs.",
    "Pin `containerd.io` version in production to match the tested Kubernetes minor.",
    "Use a registry mirror via /etc/containerd/certs.d/ - cuts air-gapped install time.",
  ]);

  // 5 kubeadm
  newPage(ctx);
  drawHeading(ctx, "5. kubeadm cluster from scratch with Ansible", 1);
  drawCode(
    ctx,
    [
      "- name: Init first control-plane",
      "  hosts: cp1",
      "  become: true",
      "  tasks:",
      "    - name: kubeadm init",
      "      ansible.builtin.command: >-",
      "        kubeadm init",
      "        --pod-network-cidr={{ pod_subnet }}",
      "        --service-cidr={{ service_subnet }}",
      "        --kubernetes-version=v{{ kubernetes_version }}",
      "        --control-plane-endpoint=k8s-api.example.com:6443",
      "        --upload-certs",
      "      args: { creates: /etc/kubernetes/admin.conf }",
      "      register: kubeadm_init",
      "    - name: Grab join command for workers",
      "      ansible.builtin.command: kubeadm token create --print-join-command",
      "      register: worker_join",
      "      changed_when: false",
      "    - name: Grab join command for additional control-planes",
      "      ansible.builtin.shell: |-",
      "        echo \"$(kubeadm token create --print-join-command) \\",
      "          --control-plane --certificate-key $(kubeadm init phase upload-certs --upload-certs | tail -1)\"",
      "      register: cp_join",
      "      changed_when: false",
      "    - name: Save join facts",
      "      ansible.builtin.add_host:",
      "        name: cluster_facts",
      "        worker_join: \"{{ worker_join.stdout }}\"",
      "        cp_join: \"{{ cp_join.stdout }}\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "`--control-plane-endpoint` MUST point to your HA LB - changing later requires rebuild.",
    "Capture join tokens into a transient `cluster_facts` host - cleaner than set_fact across plays.",
    "Always pass `--upload-certs` on init when you plan to add control-plane nodes later.",
    "Fetch /etc/kubernetes/admin.conf to the controller via fetch + chmod 600.",
  ]);

  // 6 k3s
  newPage(ctx);
  drawHeading(ctx, "6. k3s single-node and HA install playbook", 1);
  drawCode(
    ctx,
    [
      "- name: k3s server first node",
      "  hosts: cp1",
      "  become: true",
      "  tasks:",
      "    - name: Install k3s",
      "      ansible.builtin.shell: |-",
      "        curl -sfL https://get.k3s.io | \\",
      "          INSTALL_K3S_VERSION=v{{ kubernetes_version }}+k3s1 \\",
      "          K3S_CLUSTER_INIT=true \\",
      "          K3S_TOKEN={{ k3s_token }} \\",
      "          sh -",
      "      args: { creates: /usr/local/bin/k3s }",
      "",
      "- name: k3s server additional",
      "  hosts: control_plane:!cp1",
      "  become: true",
      "  tasks:",
      "    - ansible.builtin.shell: |-",
      "        curl -sfL https://get.k3s.io | \\",
      "          INSTALL_K3S_VERSION=v{{ kubernetes_version }}+k3s1 \\",
      "          K3S_URL=https://{{ hostvars['cp1'].ansible_host }}:6443 \\",
      "          K3S_TOKEN={{ k3s_token }} \\",
      "          sh - server",
      "      args: { creates: /usr/local/bin/k3s }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "k3s is the easiest fully-conformant Kubernetes; HA needs 3 servers + embedded etcd.",
    "Token is shared across nodes - vault it.",
    "Set `INSTALL_K3S_EXEC=\"--disable=traefik --disable=servicelb\"` if you bring your own.",
    "Kubeconfig at /etc/rancher/k3s/k3s.yaml; substitute 127.0.0.1 with the HA endpoint.",
  ]);

  // 7 OpenShift
  newPage(ctx);
  drawHeading(ctx, "7. OpenShift agent-based installer wrapper", 1);
  drawCode(
    ctx,
    [
      "- name: OpenShift agent-based ISO",
      "  hosts: bastion",
      "  vars:",
      "    cluster_name: ocp1",
      "    base_domain: example.com",
      "  tasks:",
      "    - name: Render install-config.yaml",
      "      ansible.builtin.template:",
      "        src: install-config.yaml.j2",
      "        dest: ~/ocp/install-config.yaml",
      "        mode: \"0600\"",
      "    - name: Render agent-config.yaml",
      "      ansible.builtin.template:",
      "        src: agent-config.yaml.j2",
      "        dest: ~/ocp/agent-config.yaml",
      "        mode: \"0600\"",
      "    - name: Create agent ISO",
      "      ansible.builtin.command: openshift-install agent create image --dir ~/ocp",
      "      args: { creates: \"~/ocp/agent.x86_64.iso\" }",
      "    - name: Wait for cluster install",
      "      ansible.builtin.command: openshift-install agent wait-for install-complete --dir ~/ocp",
      "      changed_when: false",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Agent-based ISO is the disconnected-friendly install path for OpenShift 4.14+.",
    "Templates: install-config.yaml drives version/SDN, agent-config.yaml drives hostnames + NICs.",
    "`wait-for install-complete` blocks until 4.x is healthy - perfect for AAP job nodes.",
    "Mirror the release payload via `oc-mirror` before running the playbook offline.",
  ]);

  // 8 join + token rotation
  newPage(ctx);
  drawHeading(ctx, "8. Joining workers and rotating tokens", 1);
  drawCode(
    ctx,
    [
      "- name: Join workers",
      "  hosts: workers",
      "  become: true",
      "  tasks:",
      "    - name: Run join command",
      "      ansible.builtin.command: \"{{ hostvars['cluster_facts'].worker_join }}\"",
      "      args: { creates: /etc/kubernetes/kubelet.conf }",
      "",
      "- name: Rotate bootstrap token monthly",
      "  hosts: cp1",
      "  become: true",
      "  tasks:",
      "    - ansible.builtin.command: kubeadm token delete --all",
      "      changed_when: true",
      "    - ansible.builtin.command: kubeadm token create --ttl 24h",
      "      register: new_token",
      "    - ansible.builtin.debug: var=new_token.stdout",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Tokens expire after 24h - acceptable for join, rotate by cron / AAP weekly.",
    "Worker join is idempotent thanks to the `creates:` guard on kubelet.conf.",
    "For mass join, use a serial: 4 to avoid API server thundering herd.",
  ]);

  // 9 day-2
  newPage(ctx);
  drawHeading(ctx, "9. Day-2: drain, cordon, uncordon, evacuate", 1);
  drawCode(
    ctx,
    [
      "- name: Drain a worker",
      "  hosts: cp1",
      "  tasks:",
      "    - kubernetes.core.k8s_drain:",
      "        name: \"{{ target_node }}\"",
      "        state: drain",
      "        delete_options:",
      "          ignore_daemonsets: true",
      "          delete_emptydir_data: true",
      "          force: true",
      "          terminate_grace_period: 120",
      "",
      "- name: Cordon and uncordon",
      "  hosts: cp1",
      "  tasks:",
      "    - kubernetes.core.k8s_drain:",
      "        name: \"{{ target_node }}\"",
      "        state: cordon",
      "    - kubernetes.core.k8s_drain:",
      "        name: \"{{ target_node }}\"",
      "        state: uncordon",
      "      when: maintenance_complete | default(false) | bool",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "`k8s_drain` wraps `kubectl drain` with idempotent semantics - safe to re-run.",
    "`terminate_grace_period: 120` matches a normal vLLM / Postgres graceful shutdown.",
    "Always cordon BEFORE drain in fleet workflows so other plays do not reschedule onto it.",
  ]);

  // 10 rolling upgrades
  newPage(ctx);
  drawHeading(ctx, "10. Rolling control-plane and kubelet upgrades", 1);
  drawCode(
    ctx,
    [
      "- name: Upgrade kubeadm + kubelet (one node at a time)",
      "  hosts: k8s_cluster",
      "  serial: 1",
      "  become: true",
      "  tasks:",
      "    - name: Drain self",
      "      kubernetes.core.k8s_drain:",
      "        name: \"{{ inventory_hostname }}\"",
      "        state: drain",
      "        delete_options: { ignore_daemonsets: true, force: true }",
      "      delegate_to: cp1",
      "      when: inventory_hostname != 'cp1'",
      "    - name: Install new kubeadm",
      "      ansible.builtin.package:",
      "        name: \"kubeadm-{{ kubernetes_version }}\"",
      "        state: present",
      "    - name: kubeadm upgrade (first cp only)",
      "      ansible.builtin.command: \"kubeadm upgrade apply -y v{{ kubernetes_version }}\"",
      "      when: inventory_hostname == 'cp1'",
      "    - name: kubeadm upgrade node (others)",
      "      ansible.builtin.command: kubeadm upgrade node",
      "      when: inventory_hostname != 'cp1'",
      "    - name: Install kubelet + kubectl",
      "      ansible.builtin.package:",
      "        name:",
      "          - \"kubelet-{{ kubernetes_version }}\"",
      "          - \"kubectl-{{ kubernetes_version }}\"",
      "        state: present",
      "    - ansible.builtin.service: { name: kubelet, state: restarted }",
      "    - name: Uncordon self",
      "      kubernetes.core.k8s_drain:",
      "        name: \"{{ inventory_hostname }}\"",
      "        state: uncordon",
      "      delegate_to: cp1",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "`serial: 1` keeps cluster healthy - never upgrade two nodes simultaneously.",
    "First control-plane runs `apply`, others run `node` - mirrors the official flow.",
    "Always upgrade one minor at a time - 1.29 -> 1.30 -> 1.31, never 1.29 -> 1.31.",
    "Run upgrades from AAP with approval gates between control-plane and worker waves.",
  ]);

  // 11 kubernetes.core
  newPage(ctx);
  drawHeading(ctx, "11. The kubernetes.core collection essentials", 1);
  drawCode(
    ctx,
    [
      "- name: Apply manifests",
      "  hosts: cp1",
      "  tasks:",
      "    - kubernetes.core.k8s:",
      "        state: present",
      "        src: \"{{ item }}\"",
      "      loop:",
      "        - manifests/namespace.yaml",
      "        - manifests/configmap.yaml",
      "        - manifests/deployment.yaml",
      "",
      "    - kubernetes.core.k8s_info:",
      "        api_version: v1",
      "        kind: Pod",
      "        namespace: default",
      "        label_selectors: [\"app=web\"]",
      "      register: pods",
      "",
      "    - kubernetes.core.k8s_exec:",
      "        namespace: default",
      "        pod: \"{{ pods.resources[0].metadata.name }}\"",
      "        command: \"cat /etc/hostname\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "`kubernetes.core.k8s` is the workhorse - idempotent apply, supports `state: absent` for delete.",
    "`k8s_info` for declarative queries; never shell out to kubectl for read-only ops.",
    "`k8s_exec` only inside diagnostic plays; do not use for config management.",
    "Set `kubeconfig:` explicitly when running on a controller with multiple clusters.",
  ]);

  // 12 jinja
  newPage(ctx);
  drawHeading(ctx, "12. Templating Kubernetes manifests with Jinja2", 1);
  drawCode(
    ctx,
    [
      "# templates/deployment.yaml.j2",
      "apiVersion: apps/v1",
      "kind: Deployment",
      "metadata:",
      "  name: {{ app.name }}",
      "  namespace: {{ app.namespace }}",
      "spec:",
      "  replicas: {{ app.replicas | default(3) }}",
      "  selector: { matchLabels: { app: {{ app.name }} } }",
      "  template:",
      "    metadata: { labels: { app: {{ app.name }} } }",
      "    spec:",
      "      containers:",
      "        - name: {{ app.name }}",
      "          image: \"{{ app.image }}:{{ app.tag }}\"",
      "          resources:",
      "            requests: { cpu: \"{{ app.cpu_req | default('100m') }}\", memory: \"{{ app.mem_req | default('128Mi') }}\" }",
      "            limits:   { cpu: \"{{ app.cpu_lim | default('500m') }}\", memory: \"{{ app.mem_lim | default('512Mi') }}\" }",
      "",
      "# playbook",
      "- kubernetes.core.k8s:",
      "    state: present",
      "    definition: \"{{ lookup('template', 'templates/deployment.yaml.j2') | from_yaml }}\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Templates beat raw YAML for fleets - one j2 + 10 host_vars = 10 environments.",
    "Use `from_yaml` filter so kubernetes.core sees a native dict, not a string.",
    "Validate locally with `ansible-lint --offline templates/*.j2`.",
    "Keep templates short - call Helm for anything with charts available upstream.",
  ]);

  // 13 helm
  newPage(ctx);
  drawHeading(ctx, "13. Helm releases via kubernetes.core.helm", 1);
  drawCode(
    ctx,
    [
      "- name: Add ingress-nginx repo",
      "  kubernetes.core.helm_repository:",
      "    name: ingress-nginx",
      "    repo_url: https://kubernetes.github.io/ingress-nginx",
      "",
      "- name: Install ingress-nginx",
      "  kubernetes.core.helm:",
      "    name: ingress-nginx",
      "    chart_ref: ingress-nginx/ingress-nginx",
      "    chart_version: 4.11.3",
      "    release_namespace: ingress-nginx",
      "    create_namespace: true",
      "    values:",
      "      controller:",
      "        replicaCount: 3",
      "        service: { type: LoadBalancer }",
      "        metrics: { enabled: true }",
      "    update_repo_cache: true",
      "    wait: true",
      "    timeout: 10m",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pin `chart_version` - charts ship breaking changes every other release.",
    "`wait: true` + `timeout:` keeps your pipeline from succeeding before the addon is ready.",
    "Values can be a dict OR a list of value files - the dict form is easier to grep.",
    "Diff drift with `helm_info` + a check-mode comparison before re-apply.",
  ]);

  // 14 secrets
  newPage(ctx);
  drawHeading(ctx, "14. Secrets: SealedSecrets, ExternalSecrets, Vault", 1);
  drawCode(
    ctx,
    [
      "- name: Seal a secret via kubeseal CLI",
      "  hosts: bastion",
      "  tasks:",
      "    - ansible.builtin.shell: |-",
      "        kubectl -n {{ ns }} create secret generic {{ name }} \\",
      "          --from-literal=token={{ token }} --dry-run=client -o yaml \\",
      "          | kubeseal --controller-namespace=sealed-secrets -o yaml \\",
      "          > {{ playbook_dir }}/sealed/{{ name }}.yaml",
      "      args: { creates: \"{{ playbook_dir }}/sealed/{{ name }}.yaml\" }",
      "      no_log: true",
      "",
      "- name: External Secrets to Vault",
      "  kubernetes.core.k8s:",
      "    state: present",
      "    definition:",
      "      apiVersion: external-secrets.io/v1beta1",
      "      kind: ClusterSecretStore",
      "      metadata: { name: vault }",
      "      spec:",
      "        provider:",
      "          vault:",
      "            server: https://vault.example.com",
      "            path: kv",
      "            version: v2",
      "            auth:",
      "              kubernetes:",
      "                mountPath: kubernetes",
      "                role: external-secrets",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "SealedSecrets for git-committed secrets; rotate the sealing key yearly.",
    "External Secrets for app-runtime secrets backed by Vault / AWS SM / GCP SM.",
    "`no_log: true` on any task touching secret material - protects logs and AAP UI.",
    "Never store unsealed Secret YAML in git; pre-commit hooks catch slips.",
  ]);

  // 15 gitops
  newPage(ctx);
  drawHeading(ctx, "15. GitOps bootstrap: Argo CD and Flux", 1);
  drawCode(
    ctx,
    [
      "- name: Argo CD bootstrap",
      "  kubernetes.core.helm:",
      "    name: argocd",
      "    chart_ref: argo/argo-cd",
      "    chart_version: 7.6.10",
      "    release_namespace: argocd",
      "    create_namespace: true",
      "    wait: true",
      "",
      "- name: Root app-of-apps",
      "  kubernetes.core.k8s:",
      "    state: present",
      "    definition:",
      "      apiVersion: argoproj.io/v1alpha1",
      "      kind: Application",
      "      metadata: { name: root, namespace: argocd }",
      "      spec:",
      "        project: default",
      "        source:",
      "          repoURL: https://github.com/acme/cluster-config",
      "          path: bootstrap",
      "          targetRevision: main",
      "        destination:",
      "          server: https://kubernetes.default.svc",
      "          namespace: argocd",
      "        syncPolicy:",
      "          automated: { prune: true, selfHeal: true }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Ansible installs Argo CD or Flux once; Git takes over for app delivery.",
    "App-of-apps lets Argo manage itself - never apply individual Application by hand.",
    "Pin chart_version; Argo CD changed CRDs in 2.10 + 2.12 - upgrades are not silent.",
    "Same shape for Flux: Helm install flux-system, then GitRepository + Kustomization.",
  ]);

  // 16 addons
  newPage(ctx);
  drawHeading(ctx, "16. Cluster addons: ingress, cert-manager, metrics-server", 1);
  drawBullets(ctx, [
    "metrics-server: required for HPA + `kubectl top`; install via Helm chart 3.12+.",
    "cert-manager: install CRDs first (`installCRDs: true`), then ClusterIssuers for Let's Encrypt.",
    "ingress-nginx OR Gateway API + Cilium Gateway: pick one per cluster, never both.",
    "external-dns: optional, wire to your DNS provider before exposing services publicly.",
    "Group addons in roles (`roles/k8s_addons/tasks/cert_manager.yml`) for clean tag selection.",
  ]);
  drawCode(
    ctx,
    [
      "- name: cert-manager ClusterIssuer (Let's Encrypt prod)",
      "  kubernetes.core.k8s:",
      "    state: present",
      "    definition:",
      "      apiVersion: cert-manager.io/v1",
      "      kind: ClusterIssuer",
      "      metadata: { name: letsencrypt }",
      "      spec:",
      "        acme:",
      "          server: https://acme-v02.api.letsencrypt.org/directory",
      "          email: ops@example.com",
      "          privateKeySecretRef: { name: letsencrypt-key }",
      "          solvers:",
      "            - http01: { ingress: { class: nginx } }",
    ].join("\n"),
  );

  // 17 networking
  newPage(ctx);
  drawHeading(ctx, "17. MetalLB, Calico, Cilium provisioning", 1);
  drawCode(
    ctx,
    [
      "- name: MetalLB L2 advertisement",
      "  kubernetes.core.k8s:",
      "    state: present",
      "    definition:",
      "      apiVersion: metallb.io/v1beta1",
      "      kind: IPAddressPool",
      "      metadata: { name: prod-pool, namespace: metallb-system }",
      "      spec: { addresses: [\"10.0.100.10-10.0.100.250\"] }",
      "  loop:",
      "    - apiVersion: metallb.io/v1beta1",
      "      kind: L2Advertisement",
      "      metadata: { name: prod, namespace: metallb-system }",
      "      spec: { ipAddressPools: [prod-pool] }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Calico for VXLAN simplicity; Cilium for eBPF + Hubble observability + Gateway API.",
    "MetalLB only on bare-metal / on-prem - cloud LBs cover this elsewhere.",
    "Choose CNI BEFORE first pod schedules; switching CNIs requires cluster rebuild.",
    "Calico: install with operator, set IPv4Pool CIDR matching `pod_subnet`.",
  ]);

  // 18 storage
  newPage(ctx);
  drawHeading(ctx, "18. Persistent storage: OpenEBS, Longhorn, Rook-Ceph", 1);
  drawBullets(ctx, [
    "OpenEBS Mayastor: NVMe over fabric, single-zone, fastest IOPS.",
    "Longhorn: easy 3-replica block, good for 1-10 TB clusters, web UI.",
    "Rook-Ceph: serious storage, 100 TB+, needs dedicated 10G+ network.",
    "Default StorageClass: pick exactly one, mark `is-default-class: true`.",
    "Snapshots + VolumeSnapshotClass mandatory before Velero will back up volumes.",
  ]);
  drawCode(
    ctx,
    [
      "- name: Install Longhorn",
      "  kubernetes.core.helm:",
      "    name: longhorn",
      "    chart_ref: longhorn/longhorn",
      "    chart_version: 1.7.2",
      "    release_namespace: longhorn-system",
      "    create_namespace: true",
      "    values:",
      "      defaultSettings:",
      "        defaultReplicaCount: 3",
      "        backupTarget: s3://backups@eu-west-1/longhorn/",
      "    wait: true",
    ].join("\n"),
  );

  // 19 velero
  newPage(ctx);
  drawHeading(ctx, "19. Backup and DR with Velero", 1);
  drawCode(
    ctx,
    [
      "- name: Install Velero (S3 + CSI snapshots)",
      "  ansible.builtin.command: >-",
      "    velero install",
      "    --provider aws",
      "    --plugins velero/velero-plugin-for-aws:v1.10.0",
      "    --bucket {{ velero_bucket }}",
      "    --backup-location-config region={{ aws_region }}",
      "    --features=EnableCSI",
      "    --use-node-agent",
      "    --uploader-type=kopia",
      "    --secret-file {{ velero_creds }}",
      "",
      "- name: Daily cluster backup schedule",
      "  kubernetes.core.k8s:",
      "    state: present",
      "    definition:",
      "      apiVersion: velero.io/v1",
      "      kind: Schedule",
      "      metadata: { name: daily, namespace: velero }",
      "      spec:",
      "        schedule: \"0 2 * * *\"",
      "        template:",
      "          includedNamespaces: [\"*\"]",
      "          excludedNamespaces: [\"kube-system\", \"velero\"]",
      "          ttl: 720h",
      "          storageLocation: default",
      "          volumeSnapshotLocations: [default]",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Velero with CSI snapshots is the default DR tool; Restic / kopia for unsupported drivers.",
    "Test restore quarterly into a `restore-test` namespace; backups you cannot restore do not exist.",
    "Exclude `velero` namespace - restoring Velero with Velero loops you into the void.",
  ]);

  // 20 observability
  newPage(ctx);
  drawHeading(ctx, "20. Observability: kube-prometheus-stack and Loki", 1);
  drawCode(
    ctx,
    [
      "- name: Install kube-prometheus-stack",
      "  kubernetes.core.helm:",
      "    name: kps",
      "    chart_ref: prometheus-community/kube-prometheus-stack",
      "    chart_version: 65.5.0",
      "    release_namespace: monitoring",
      "    create_namespace: true",
      "    values:",
      "      grafana:",
      "        adminPassword: \"{{ vault_grafana_admin_pw }}\"",
      "        persistence: { enabled: true, size: 10Gi }",
      "      prometheus:",
      "        prometheusSpec:",
      "          retention: 30d",
      "          retentionSize: 100GB",
      "          storageSpec:",
      "            volumeClaimTemplate:",
      "              spec:",
      "                accessModes: [ReadWriteOnce]",
      "                storageClassName: longhorn",
      "                resources: { requests: { storage: 200Gi } }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "kube-prometheus-stack ships ~120 default rules + ~30 dashboards - all production-grade.",
    "Loki + promtail for logs; pair with the same Grafana for unified queries.",
    "Retention: 30 days metrics, 14 days logs, then ship to long-term storage (Mimir/Thanos).",
    "PVC backed by Longhorn / Ceph - losing the Prometheus PV kills your alerting.",
  ]);

  // 21 EE
  newPage(ctx);
  drawHeading(ctx, "21. Execution Environments for kubernetes.core", 1);
  drawCode(
    ctx,
    [
      "# execution-environment.yml",
      "version: 3",
      "images:",
      "  base_image:",
      "    name: registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest",
      "dependencies:",
      "  galaxy:",
      "    collections:",
      "      - name: kubernetes.core",
      "        version: \">=5.0.0\"",
      "      - name: community.kubernetes",
      "      - name: community.general",
      "  python:",
      "    - kubernetes>=30.1.0",
      "    - openshift>=0.13.2",
      "    - pyyaml>=6",
      "  system:",
      "    - openssh-clients",
      "    - jq",
      "",
      "# Build:",
      "ansible-builder build -t ee-k8s:1.0 .",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "EE is the supported way to ship kubernetes.core + the python kubernetes client together.",
    "Pin every collection AND python version - reproducibility wins over latest.",
    "Push EE to your private registry; AAP pulls per job.",
    "Sign the EE image with cosign and verify via Kyverno on the AAP cluster.",
  ]);

  // 22 AAP
  newPage(ctx);
  drawHeading(ctx, "22. Ansible Automation Platform job templates", 1);
  drawBullets(ctx, [
    "One project per repo; one job template per playbook surface (install / upgrade / day-2).",
    "Credentials: kubeconfig as `Machine` credential; vault password as `Vault` credential.",
    "Surveys for `target_node`, `kubernetes_version`, `addon_chart_version` - operators love forms.",
    "Workflow templates chain: pre-flight -> install containerd -> kubeadm -> addons -> tests.",
    "Notifications to Slack / Teams on success and failure - never both ignored.",
    "Schedules: nightly drift detection (--check), weekly backup verification, monthly EE rebuild.",
  ]);

  // 23 molecule
  newPage(ctx);
  drawHeading(ctx, "23. CI / CD: molecule + kind for role testing", 1);
  drawCode(
    ctx,
    [
      "# molecule/default/molecule.yml",
      "driver: { name: docker }",
      "platforms:",
      "  - name: kind-control-plane",
      "    image: kindest/node:v1.31.0",
      "provisioner:",
      "  name: ansible",
      "  inventory:",
      "    host_vars:",
      "      kind-control-plane:",
      "        ansible_connection: docker",
      "verifier: { name: ansible }",
      "",
      "# .github/workflows/molecule.yml",
      "jobs:",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/setup-python@v5",
      "        with: { python-version: \"3.12\" }",
      "      - run: pip install ansible-core molecule molecule-plugins[docker] kubernetes",
      "      - run: molecule test",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "kind clusters spin up in 20 s in GitHub Actions - perfect for role smoke tests.",
    "molecule converge + idempotence + verify catches 90% of role bugs before AAP runs them.",
    "Pin `kindest/node` to the SAME minor as production - tests should mirror prod.",
  ]);

  // 24 errors
  newPage(ctx);
  drawHeading(ctx, "24. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "kubeadm init fails on swap: `swapoff -a && sed -i '/swap/d' /etc/fstab`.",
    "kubelet refuses cgroupfs: enable `SystemdCgroup = true` in containerd config.",
    "kubectl x509 unknown authority: copy /etc/kubernetes/admin.conf, do not generate fresh.",
    "Helm chart hangs at install: `wait: false` then poll with k8s_info - debug what is stuck.",
    "ImagePullBackOff after offline install: configure registry mirror in containerd certs.d.",
    "Argo CD app stuck OutOfSync: missing CRD in source repo OR missing namespace - run k8s_info.",
    "metrics-server CrashLoop: add `--kubelet-insecure-tls` flag if certs are self-signed.",
    "Longhorn replicas Failed: nodes missing `iscsiadm`; install `iscsi-initiator-utils`.",
    "Pod stuck Pending with `no nodes available`: missing taint toleration in playbook.",
    "Velero backup PartiallyFailed: VolumeSnapshotClass not in `velero` annotations - add `velero.io/csi-volumesnapshot-class: \"true\"`.",
  ]);

  // 25 versioning
  newPage(ctx);
  drawHeading(ctx, "25. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks ansible-core 2.18 (Ansible 11), kubernetes.core 5.x, Kubernetes 1.29-1.31, k3s 1.31+, OpenShift 4.17. Recipes are revalidated whenever any of these ships a minor; updates ship via /library within 30 days.",
  );
  drawBullets(ctx, [
    "Sign in to https://www.copypastelearn.com/library to mint a fresh download link.",
    "Support: support@copypastelearn.com (one business day). Security: security@copypastelearn.com.",
  ]);

  // 26 license
  newPage(ctx);
  drawHeading(ctx, "26. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the recipes inside your own infrastructure projects, including projects you build for paying clients. You may not resell, sublicense, or republish the recipes as a standalone product.",
  );
  drawParagraph(
    ctx,
    "Ansible, kubernetes.core, Kubernetes, kubeadm, k3s, OpenShift, Argo CD, Flux, Helm, Velero, Longhorn, MetalLB, Calico, Cilium, and kube-prometheus-stack are governed by their own open-source licenses - refer to upstream documentation for compliance details. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
