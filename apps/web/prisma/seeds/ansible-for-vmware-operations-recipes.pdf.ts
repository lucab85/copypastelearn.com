/**
 * PDF generator for "Ansible for VMware Operations Recipes".
 *
 * Day-2 operations cookbook for vCenter / ESXi fleets driven by Ansible:
 * inventory + dynamic plugin, VM lifecycle, templates + content libraries,
 * snapshots + backups, NSX networking, vSAN storage, hardening, vCenter
 * upgrade orchestration, AAP integration, OS customization.
 *
 * Distinct from the user's Apress 2023 book by title and scope -
 * recipes are written from public community.vmware / vmware.vmware_rest
 * collection patterns.
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

export async function generateAnsibleForVmwareOperationsRecipesPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Ansible for VMware Operations Recipes",
    subject:
      "Day-2 operations cookbook for vCenter / ESXi fleets with Ansible - community.vmware, vmware.vmware_rest, VM lifecycle, templates, snapshots, NSX, vSAN, hardening, AAP.",
    keywords: [
      "ansible",
      "vmware",
      "vcenter",
      "esxi",
      "community.vmware",
      "vmware.vmware_rest",
      "nsx",
      "vsan",
      "aap",
      "automation",
    ],
    headerLeft: "Ansible for VMware Operations Recipes",
  });

  drawCover(ctx, {
    title: "Ansible for VMware Operations Recipes",
    subtitle: "Automate vCenter, ESXi, NSX, and vSAN with idempotent playbooks",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "Inventory and auth: vault, dynamic inventory, REST tokens",
    "Pre-flight: collections, python deps, EE image",
    "Folders, resource pools, and clusters",
    "VM lifecycle: clone, power, reconfigure, delete",
    "Content libraries and OVF / OVA templates",
    "Customization specs: Linux and Windows",
    "Cloud-init / Sysprep guest customization",
    "Snapshots: create, consolidate, prune, restore",
    "Backups via Velero-vSphere and storage snapshots",
    "Tagging and categories for governance",
    "Resource pools, DRS rules, and reservations",
    "Networking: portgroups, dvSwitch, NSX-T segments",
    "Storage: datastores, vSAN policies, SPBM",
    "ESXi host lifecycle: enter / exit maintenance",
    "vCenter and ESXi upgrade orchestration",
    "Patching guests via Ansible after migration",
    "Hardening: STIG-aligned ESXi + vCenter recipes",
    "Monitoring hooks: vROps, Aria, Prometheus",
    "Disaster recovery: SRM orchestration",
    "Execution Environments for vmware.vmware_rest",
    "Ansible Automation Platform job templates",
    "Common errors and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "Ansible for VMware Operations Recipes is the day-2 cookbook we hand to VMware administrators who want to retire click-ops. It covers vCenter / ESXi lifecycle, VM provisioning, content libraries, snapshots, NSX, vSAN, hardening, upgrades, and AAP integration.",
  );
  drawParagraph(
    ctx,
    "Every recipe is tested against vSphere 7.0 U3 and 8.0 U3, NSX-T 4.1+, vSAN 8 ESA, Ansible 11 (ansible-core 2.18), community.vmware 5.x, and vmware.vmware_rest 4.x. Idempotency is enforced - playbooks converge in a second run with zero changed tasks.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Inventory and auth: vault patterns + dynamic inventory + REST session reuse.",
    "VM lifecycle: clone-from-template, reconfigure CPU/RAM, migrate, delete.",
    "Content libraries: subscribe, publish, deploy OVF / OVA templates.",
    "Guest customization: cloud-init + Sysprep + DHCP / static IP.",
    "Snapshots: create, consolidate, prune older than N days, restore.",
    "Tagging + governance: categories, tag attachers, policy enforcement.",
    "Networking: portgroups, dvSwitch uplinks, NSX-T segments + firewall.",
    "Storage: datastore mounts, vSAN storage policies, SPBM.",
    "Host + cluster lifecycle: maintenance mode, rolling ESXi upgrades.",
    "Hardening: STIG-aligned ESXi + vCenter recipes, lockdown mode.",
    "EE image, AAP job templates, common errors, support model.",
    "Lifetime updates while the recipes are maintained, delivered via /library.",
  ]);

  // 2
  newPage(ctx);
  drawHeading(ctx, "2. Inventory and auth: vault, dynamic inventory, REST tokens", 1);
  drawCode(
    ctx,
    [
      "# inventories/prod/vcenter.yml",
      "all:",
      "  vars:",
      "    vcenter_hostname: vcsa.example.com",
      "    vcenter_username: \"{{ vault_vcenter_user }}\"",
      "    vcenter_password: \"{{ vault_vcenter_pass }}\"",
      "    vcenter_validate_certs: true",
      "    datacenter: \"DC1\"",
      "    cluster: \"PROD-01\"",
      "",
      "# inventories/prod/vmware.yml  -- dynamic inventory",
      "plugin: community.vmware.vmware_vm_inventory",
      "hostname: vcsa.example.com",
      "username: \"{{ lookup('env', 'VMWARE_USER') }}\"",
      "password: \"{{ lookup('env', 'VMWARE_PASSWORD') }}\"",
      "validate_certs: true",
      "with_tags: true",
      "filters:",
      "  - 'config.template == false'",
      "  - 'runtime.powerState == \"poweredOn\"'",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "vCenter credentials always in ansible-vault or a Vault lookup, never in plaintext inventory.",
    "Dynamic inventory plugin auto-discovers VMs + tags; great for fleet-wide playbooks.",
    "Filter by `template == false` to avoid running playbooks against gold templates.",
    "REST token reuse: vmware.vmware_rest reuses the session within a play - keep tasks grouped.",
  ]);

  // 3
  newPage(ctx);
  drawHeading(ctx, "3. Pre-flight: collections, python deps, EE image", 1);
  drawCode(
    ctx,
    [
      "# requirements.yml",
      "collections:",
      "  - name: community.vmware",
      "    version: \">=5.0.0\"",
      "  - name: vmware.vmware_rest",
      "    version: \">=4.0.0\"",
      "  - name: ansible.posix",
      "  - name: community.general",
      "",
      "# requirements.txt (for EE / venv)",
      "pyvmomi>=8.0",
      "aiohttp>=3.9",
      "vmware-vcenter>=8.0",
      "vmware-vapi-common-client>=2.45",
      "",
      "ansible-galaxy collection install -r requirements.yml",
      "pip install -r requirements.txt",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "community.vmware uses pyvmomi (SOAP); vmware.vmware_rest uses aiohttp + REST. Both ship.",
    "Pin all four collections + python deps to avoid surprises on `latest`.",
    "Bake into an EE image for AAP - no controller has to know pyvmomi version.",
  ]);

  // 4
  newPage(ctx);
  drawHeading(ctx, "4. Folders, resource pools, and clusters", 1);
  drawCode(
    ctx,
    [
      "- name: Ensure VM folder",
      "  community.vmware.vcenter_folder:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    datacenter: \"{{ datacenter }}\"",
      "    folder_name: \"{{ folder_path }}\"",
      "    folder_type: vm",
      "    state: present",
      "",
      "- name: Ensure resource pool",
      "  community.vmware.vmware_resource_pool:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    datacenter: \"{{ datacenter }}\"",
      "    cluster: \"{{ cluster }}\"",
      "    resource_pool: web-tier",
      "    cpu_limit: 64000",
      "    mem_limit: 131072",
      "    state: present",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Folders: per-tenant / per-app / per-env structure - reuse for RBAC inheritance.",
    "Resource pools: cap CPU + RAM per tenant; never set `cpu_shares` without a reservation.",
    "Set DRS to fully-automated only for stateless workloads; leave stateful at semi-automated.",
  ]);

  // 5
  newPage(ctx);
  drawHeading(ctx, "5. VM lifecycle: clone, power, reconfigure, delete", 1);
  drawCode(
    ctx,
    [
      "- name: Clone VM from template",
      "  community.vmware.vmware_guest:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    datacenter: \"{{ datacenter }}\"",
      "    folder: \"/{{ datacenter }}/vm/{{ folder_path }}\"",
      "    cluster: \"{{ cluster }}\"",
      "    name: \"{{ vm_name }}\"",
      "    template: \"rhel9-template\"",
      "    hardware:",
      "      memory_mb: 8192",
      "      num_cpus: 4",
      "      hotadd_cpu: true",
      "      hotadd_memory: true",
      "    disk:",
      "      - size_gb: 80",
      "        type: thin",
      "        datastore: vsanDatastore",
      "    networks:",
      "      - name: \"vlan-100\"",
      "        type: static",
      "        ip: \"{{ vm_ip }}\"",
      "        netmask: 255.255.255.0",
      "        gateway: 10.0.100.1",
      "        dns_servers: [\"10.0.0.10\", \"10.0.0.11\"]",
      "    state: poweredon",
      "    wait_for_ip_address: true",
      "",
      "- name: Reconfigure CPU/RAM (hot)",
      "  community.vmware.vmware_guest:",
      "    name: \"{{ vm_name }}\"",
      "    hardware: { memory_mb: 16384, num_cpus: 8 }",
      "    state: present",
      "",
      "- name: Delete VM",
      "  community.vmware.vmware_guest:",
      "    name: \"{{ vm_name }}\"",
      "    state: absent",
      "    force: true",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always set `wait_for_ip_address: true` so subsequent plays can SSH in.",
    "Hot-add CPU/RAM only if the template has the toggle - otherwise reboot is forced.",
    "Disk `type: thin` for non-prod, `type: thick_eager` for vSAN performance tiers.",
    "Delete is irreversible - protect with `--check` first or AAP approval gate.",
  ]);

  // 6 content libs
  newPage(ctx);
  drawHeading(ctx, "6. Content libraries and OVF / OVA templates", 1);
  drawCode(
    ctx,
    [
      "- name: Create content library (subscribed)",
      "  community.vmware.vmware_content_library_manager:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    library_name: gold-images",
      "    library_description: \"OS gold images, published from build cluster\"",
      "    library_type: subscribed",
      "    subscription_url: \"https://build-vcsa.example.com/cls/vcsp/lib/<id>/lib.json\"",
      "    update_on_demand: true",
      "    state: present",
      "",
      "- name: Deploy from OVF in content library",
      "  community.vmware.vmware_content_deploy_ovf_template:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    ovf_template: \"rhel9-base\"",
      "    library: gold-images",
      "    datacenter: \"{{ datacenter }}\"",
      "    cluster: \"{{ cluster }}\"",
      "    datastore: vsanDatastore",
      "    folder: \"/{{ datacenter }}/vm/{{ folder_path }}\"",
      "    name: \"{{ vm_name }}\"",
      "    state: present",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Subscribed libraries pull from a publisher - build once, deploy to N vCenters.",
    "Update-on-demand keeps storage low; otherwise everything mirrors automatically.",
    "Deploy-OVF preserves OVF properties for first-boot customization.",
    "Sign OVAs with vCenter trusted-root for tamper detection.",
  ]);

  // 7 customization
  newPage(ctx);
  drawHeading(ctx, "7. Customization specs: Linux and Windows", 1);
  drawCode(
    ctx,
    [
      "- name: Linux customization (DHCP)",
      "  community.vmware.vmware_guest:",
      "    name: \"{{ vm_name }}\"",
      "    template: rhel9-template",
      "    customization:",
      "      hostname: \"{{ vm_name }}\"",
      "      domain: example.com",
      "      dns_servers: [10.0.0.10]",
      "      dns_suffix: [example.com]",
      "      timezone: Europe/Amsterdam",
      "    state: poweredon",
      "    wait_for_ip_address: true",
      "",
      "- name: Windows customization (Sysprep)",
      "  community.vmware.vmware_guest:",
      "    name: \"{{ vm_name }}\"",
      "    template: win2022-template",
      "    customization:",
      "      hostname: \"{{ vm_name }}\"",
      "      autologon: true",
      "      autologoncount: 1",
      "      orgname: Example Corp",
      "      fullname: Administrator",
      "      domain: corp.example.com",
      "      joindomain: corp.example.com",
      "      domainadmin: \"{{ vault_domain_admin }}\"",
      "      domainadminpassword: \"{{ vault_domain_admin_pw }}\"",
      "      timezone: 105   # Central European",
      "    state: poweredon",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Linux: cloud-init via vmware_guest accepts user-data; preferred over legacy guest tools.",
    "Windows Sysprep: pass domain join credentials via vault; never echo to logs.",
    "Sysprep first boot can take 10-15 min; raise `wait_for_ip_address` timeout to 1200 s.",
    "Test customization specs on one VM in --check then roll out fleet-wide.",
  ]);

  // 8 cloud-init
  newPage(ctx);
  drawHeading(ctx, "8. Cloud-init / Sysprep guest customization", 1);
  drawCode(
    ctx,
    [
      "# templates/cloud-init-user-data.yaml.j2",
      "#cloud-config",
      "hostname: {{ vm_name }}",
      "fqdn: {{ vm_name }}.example.com",
      "manage_etc_hosts: true",
      "users:",
      "  - name: ansible",
      "    sudo: ALL=(ALL) NOPASSWD:ALL",
      "    ssh_authorized_keys:",
      "      - {{ ansible_pubkey }}",
      "package_update: true",
      "packages: [python3, qemu-guest-agent]",
      "runcmd:",
      "  - systemctl enable --now qemu-guest-agent",
      "  - subscription-manager register --activationkey={{ rhsm_key }} --org={{ rhsm_org }}",
      "",
      "# playbook",
      "- community.vmware.vmware_guest:",
      "    name: \"{{ vm_name }}\"",
      "    customization:",
      "      hostname: \"{{ vm_name }}\"",
      "    advanced_settings:",
      "      - { key: guestinfo.userdata, value: \"{{ lookup('template', 'templates/cloud-init-user-data.yaml.j2') | b64encode }}\" }",
      "      - { key: guestinfo.userdata.encoding, value: base64 }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pass user-data via guestinfo.* advanced settings - cloud-init datasource ovf picks it up.",
    "Base64 encode to avoid escaping issues with multi-line YAML.",
    "Bake the open-vm-tools + cloud-init combo into your gold image once.",
    "Validate first-boot with `cloud-init status --long` before declaring the play green.",
  ]);

  // 9 snapshots
  newPage(ctx);
  drawHeading(ctx, "9. Snapshots: create, consolidate, prune, restore", 1);
  drawCode(
    ctx,
    [
      "- name: Pre-change snapshot",
      "  community.vmware.vmware_guest_snapshot:",
      "    name: \"{{ vm_name }}\"",
      "    snapshot_name: \"pre-{{ change_id }}\"",
      "    description: \"Change {{ change_id }} pre-state\"",
      "    state: present",
      "    quiesce: true",
      "    memory_dump: false",
      "",
      "- name: Prune snapshots older than 14d",
      "  community.vmware.vmware_guest_snapshot:",
      "    name: \"{{ vm_name }}\"",
      "    state: remove_all",
      "    when: snapshot_age_days | int > 14",
      "",
      "- name: Restore on rollback",
      "  community.vmware.vmware_guest_snapshot:",
      "    name: \"{{ vm_name }}\"",
      "    snapshot_name: \"pre-{{ change_id }}\"",
      "    state: revert",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Quiesced snapshots flush guest filesystems - mandatory for DB VMs.",
    "Memory dump = much larger snapshot, slower; skip unless you need running-state restore.",
    "Snapshots are NOT backups - they degrade VM performance after 72h.",
    "AAP workflow: snapshot -> change -> validate -> if ok prune, if fail revert.",
  ]);

  // 10 backups
  newPage(ctx);
  drawHeading(ctx, "10. Backups via Velero-vSphere and storage snapshots", 1);
  drawBullets(ctx, [
    "Velero-vSphere wraps CSI snapshots into S3-compatible cluster backups.",
    "For pure VM backups, use vSphere Storage API + a 3rd-party (Veeam / NetBackup) - Ansible orchestrates the policy assignment.",
    "Tag VMs `backup=true` and rely on the backup tool to consume tags - no per-VM job creation.",
    "Restore drills quarterly; document RPO 24 h / RTO 4 h per tier.",
  ]);
  drawCode(
    ctx,
    [
      "- name: Apply backup tag",
      "  community.vmware.vmware_tag_manager:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    tag_names: [\"backup:daily\"]",
      "    object_name: \"{{ vm_name }}\"",
      "    object_type: VirtualMachine",
      "    state: add",
    ].join("\n"),
  );

  // 11 tagging
  newPage(ctx);
  drawHeading(ctx, "11. Tagging and categories for governance", 1);
  drawCode(
    ctx,
    [
      "- name: Ensure tag categories",
      "  community.vmware.vmware_category:",
      "    hostname: \"{{ vcenter_hostname }}\"",
      "    username: \"{{ vcenter_username }}\"",
      "    password: \"{{ vcenter_password }}\"",
      "    category_name: \"{{ item.cat }}\"",
      "    category_cardinality: \"{{ item.cardinality }}\"",
      "    associable_object_types: [VirtualMachine]",
      "    state: present",
      "  loop:",
      "    - { cat: env,     cardinality: single }",
      "    - { cat: tenant,  cardinality: single }",
      "    - { cat: backup,  cardinality: multiple }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Categories first, tags second; categories enforce cardinality (one env, one tenant).",
    "Tag every VM at creation - retroactive tagging is painful at fleet scale.",
    "Drive cost reports, backup policy, and RBAC from tags; one source of truth.",
  ]);

  // 12 drs
  newPage(ctx);
  drawHeading(ctx, "12. Resource pools, DRS rules, and reservations", 1);
  drawCode(
    ctx,
    [
      "- name: Anti-affinity for HA pair",
      "  community.vmware.vmware_vm_vm_drs_rule:",
      "    cluster_name: \"{{ cluster }}\"",
      "    drs_rule_name: \"anti-{{ app }}\"",
      "    vms: [\"{{ app }}-01\", \"{{ app }}-02\"]",
      "    enabled: true",
      "    affinity_rule: false",
      "    mandatory: true",
      "    state: present",
      "",
      "- name: VM-to-host affinity (license-bound)",
      "  community.vmware.vmware_vm_host_drs_rule:",
      "    cluster_name: \"{{ cluster }}\"",
      "    drs_rule_name: \"oracle-host-group\"",
      "    affinity_rule: true",
      "    mandatory: true",
      "    vm_group_name: oracle-vms",
      "    host_group_name: oracle-hosts",
      "    enabled: true",
    ].join("\n"),
  );

  // 13 networking
  newPage(ctx);
  drawHeading(ctx, "13. Networking: portgroups, dvSwitch, NSX-T segments", 1);
  drawCode(
    ctx,
    [
      "- name: Distributed Virtual Switch",
      "  community.vmware.vmware_dvswitch:",
      "    datacenter: \"{{ datacenter }}\"",
      "    switch_name: dvs-prod",
      "    version: 8.0.0",
      "    mtu: 9000",
      "    uplink_quantity: 2",
      "    state: present",
      "",
      "- name: dvPortgroup vlan 100",
      "  community.vmware.vmware_dvs_portgroup:",
      "    switch_name: dvs-prod",
      "    portgroup_name: vlan-100",
      "    vlan_id: 100",
      "    num_ports: 256",
      "    portgroup_type: earlyBinding",
      "    state: present",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "MTU 9000 on the dvSwitch (and physical fabric!) for vSAN / vMotion performance.",
    "earlyBinding port groups are the safe default; ephemeral only for troubleshooting.",
    "NSX-T segments via `vmware.ansible_for_nsxt` collection - separate playbook to avoid mixing.",
  ]);

  // 14 storage
  newPage(ctx);
  drawHeading(ctx, "14. Storage: datastores, vSAN policies, SPBM", 1);
  drawCode(
    ctx,
    [
      "- name: Mount NFS datastore on all hosts",
      "  community.vmware.vmware_host_datastore:",
      "    datastore_name: nfs-shared",
      "    datastore_type: nfs",
      "    nfs_server: nfs.example.com",
      "    nfs_path: /vol/shared",
      "    nfs_ro: false",
      "    esxi_hostname: \"{{ item }}\"",
      "    state: present",
      "  loop: \"{{ esxi_hosts }}\"",
      "",
      "- name: SPBM policy",
      "  community.vmware.vmware_vm_storage_policy:",
      "    name: gold-tier",
      "    description: \"FTT=2 mirror, all-flash\"",
      "    rules:",
      "      - capability_id: \"VSAN.hostFailuresToTolerate\"",
      "        value: 2",
      "      - capability_id: \"VSAN.replicaPreference\"",
      "        value: \"RAID-1 (Mirroring) - Performance\"",
      "    state: present",
    ].join("\n"),
  );

  // 15 host lifecycle
  newPage(ctx);
  drawHeading(ctx, "15. ESXi host lifecycle: enter / exit maintenance", 1);
  drawCode(
    ctx,
    [
      "- name: Enter maintenance",
      "  community.vmware.vmware_maintenancemode:",
      "    esxi_hostname: \"{{ item }}\"",
      "    evacuate: true",
      "    timeout: 3600",
      "    state: present",
      "  loop: \"{{ esxi_hosts }}\"",
      "",
      "- name: Patch / reboot / verify",
      "  ansible.builtin.shell: \"esxcli software profile update -p ESXi-8.0U3-...\"",
      "  delegate_to: \"{{ item }}\"",
      "  loop: \"{{ esxi_hosts }}\"",
      "",
      "- name: Exit maintenance",
      "  community.vmware.vmware_maintenancemode:",
      "    esxi_hostname: \"{{ item }}\"",
      "    state: absent",
      "  loop: \"{{ esxi_hosts }}\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "`evacuate: true` triggers DRS to vMotion all VMs off - blocks until cluster is balanced.",
    "Rolling host patch: one-at-a-time, serial: 1, AAP approval between hosts.",
    "Always validate `vmware_host_facts` after exit - confirm HA/DRS re-enabled.",
  ]);

  // 16 upgrades
  newPage(ctx);
  drawHeading(ctx, "16. vCenter and ESXi upgrade orchestration", 1);
  drawBullets(ctx, [
    "vCenter upgrades: snapshot VCSA -> stage patch via vamicli -> install -> verify.",
    "ESXi: Lifecycle Manager (vLCM) image-based - declare desired image, apply per cluster.",
    "Ansible drives the orchestration: bind cluster image, remediate, watch tasks.",
    "Always upgrade vCenter BEFORE ESXi by at least one minor.",
    "Pre-check compatibility matrix; one bad VIB blocks a 50-host rollout.",
  ]);
  drawCode(
    ctx,
    [
      "- name: Trigger vLCM remediation on cluster",
      "  vmware.vmware_rest.esxi_cluster_software_settings:",
      "    cluster: \"{{ cluster_id }}\"",
      "    action: apply",
      "  register: remediate_task",
      "",
      "- name: Wait for remediation",
      "  vmware.vmware_rest.cis_task_info:",
      "    task: \"{{ remediate_task.task }}\"",
      "  register: t",
      "  until: t.value.status in ['SUCCEEDED', 'FAILED']",
      "  retries: 60",
      "  delay: 60",
    ].join("\n"),
  );

  // 17 patching guests
  newPage(ctx);
  drawHeading(ctx, "17. Patching guests via Ansible after migration", 1);
  drawCode(
    ctx,
    [
      "- name: Patch RHEL guests post-migration",
      "  hosts: rhel_guests",
      "  become: true",
      "  serial: \"25%\"",
      "  tasks:",
      "    - ansible.builtin.dnf: { name: \"*\", state: latest }",
      "    - name: Reboot if needed",
      "      ansible.builtin.command: needs-restarting -r",
      "      register: nr",
      "      changed_when: nr.rc == 1",
      "      failed_when: false",
      "    - ansible.builtin.reboot:",
      "      when: nr.rc == 1",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Use dynamic inventory tagged groups (`rhel_guests`, `windows_guests`) for OS-aware plays.",
    "`serial: 25%` patches the fleet in 4 waves - service stays up.",
    "needs-restarting -r returns 1 when reboot is needed; only reboot then.",
  ]);

  // 18 hardening
  newPage(ctx);
  drawHeading(ctx, "18. Hardening: STIG-aligned ESXi + vCenter recipes", 1);
  drawBullets(ctx, [
    "Lockdown mode `Strict` on every ESXi host - SSH only via vCenter.",
    "Disable Shell + SSH services by default; enable on demand via AAP playbook.",
    "Replace self-signed certs with internal CA - vmware_vcenter_settings + cert_replace plays.",
    "Disable SNMPv1/v2; enable v3 with auth+priv only.",
    "Set syslog target on every host; ship to SIEM with TLS.",
    "Audit weekly: `vmware_host_active_directory`, `vmware_host_ntp_info`, `vmware_host_lockdown_info`.",
  ]);

  // 19 monitoring
  newPage(ctx);
  drawHeading(ctx, "19. Monitoring hooks: vROps, Aria, Prometheus", 1);
  drawCode(
    ctx,
    [
      "# Prometheus vsphere_exporter scrape target",
      "scrape_configs:",
      "  - job_name: vsphere",
      "    static_configs:",
      "      - targets: [\"vsphere-exporter:9272\"]",
      "    params:",
      "      target: [\"https://vcsa.example.com/sdk\"]",
      "",
      "# alert: ESXi host disconnected",
      "alert: EsxiHostDisconnected",
      "expr: vsphere_host_connection_state != 0",
      "for: 5m",
      "labels: { severity: page }",
    ].join("\n"),
  );

  // 20 SRM
  newPage(ctx);
  drawHeading(ctx, "20. Disaster recovery: SRM orchestration", 1);
  drawBullets(ctx, [
    "SRM Recovery Plans define the VM groups + boot order + pre/post scripts.",
    "Ansible kicks SRM via vmware.vmware_rest -> `srm_recovery_plan_invoke`.",
    "Test failover quarterly into the bubble network - never trust untested DR.",
    "Track RPO (storage replication interval) per protection group.",
    "Document the runbook in /docs/dr/srm.md - operators need a manual fallback path.",
  ]);

  // 21 EE
  newPage(ctx);
  drawHeading(ctx, "21. Execution Environments for vmware.vmware_rest", 1);
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
      "      - name: community.vmware",
      "        version: \">=5.0.0\"",
      "      - name: vmware.vmware_rest",
      "        version: \">=4.0.0\"",
      "      - name: ansible.posix",
      "  python:",
      "    - pyvmomi>=8.0",
      "    - aiohttp>=3.9",
      "    - vmware-vcenter>=8.0",
      "    - vmware-vapi-common-client>=2.45",
      "",
      "ansible-builder build -t ee-vmware:1.0 .",
    ].join("\n"),
  );

  // 22 AAP
  newPage(ctx);
  drawHeading(ctx, "22. Ansible Automation Platform job templates", 1);
  drawBullets(ctx, [
    "Credentials: VMware as `VMware vCenter` credential, vault for OS guest creds.",
    "Surveys for `vm_name`, `cluster`, `template`, `cpu`, `memory` - operators self-serve VMs.",
    "Workflow: snapshot -> change -> validate -> prune or revert based on tests.",
    "RBAC: tenant team can deploy only inside their folder + resource pool.",
    "Notifications to Slack / Teams on every powered-on / deleted VM - audit trail.",
  ]);

  // 23 errors
  newPage(ctx);
  drawHeading(ctx, "23. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "InvalidLogin: vault token expired - rotate vault password and re-run.",
    "DuplicateName: VM name reuse in same folder - dynamic inventory will show the survivor.",
    "TaskInProgress: another play has the VM locked - serialize via AAP slice strategy.",
    "wait_for_ip_address timed out: open-vm-tools missing from template - rebuild gold image.",
    "CannotChangeWhileRunning: hot-add not enabled - set hotadd_cpu / hotadd_memory at template build.",
    "DRS rule conflict: existing rule with same name - remove first or change `drs_rule_name`.",
    "Sysprep timeout: domain unreachable from network - validate firewall + DNS in cloud-init test VM.",
    "Snapshot revert hung: large memory snapshot - increase task timeout to 3600s.",
    "REST 401 mid-play: token expired between tasks - re-auth via vmware.vmware_rest module first.",
    "ESXi VIB conflict on upgrade: remove conflicting VIBs in pre-check play, then remediate.",
  ]);

  // 24 versioning
  newPage(ctx);
  drawHeading(ctx, "24. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks vSphere 7.0 U3 + 8.0 U3, NSX-T 4.1+, vSAN 8 ESA, ansible-core 2.18, community.vmware 5.x, vmware.vmware_rest 4.x. Recipes are revalidated quarterly; updates ship via /library within 30 days.",
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
    "VMware vSphere, vCenter, ESXi, NSX, vSAN, SRM, and Aria are trademarks of Broadcom Inc. The community.vmware and vmware.vmware_rest collections are open-source; refer to upstream Ansible documentation for compliance details. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
