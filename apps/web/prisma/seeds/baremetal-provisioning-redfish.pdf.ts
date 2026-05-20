/**
 * PDF generator for "Bare-metal Provisioning with Redfish".
 *
 * Automation cookbook for provisioning bare-metal servers via the DMTF
 * Redfish API: BMC inventory, BIOS / firmware updates, virtual media boot,
 * PXE + kickstart, network boot images, Metal3 / Ironic integration,
 * fleet imaging, Ansible community.general.redfish_* modules.
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

export async function generateBareMetalProvisioningRedfishPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Bare-metal Provisioning with Redfish",
    subject:
      "Cookbook for automating bare-metal server provisioning via the Redfish API - BMC, BIOS, firmware, virtual media, PXE, kickstart, Metal3, Ironic, Ansible.",
    keywords: [
      "redfish",
      "bare-metal",
      "bmc",
      "ipmi",
      "ilo",
      "idrac",
      "ironic",
      "metal3",
      "pxe",
      "kickstart",
      "ansible",
    ],
    headerLeft: "Bare-metal Provisioning with Redfish",
  });

  drawCover(ctx, {
    title: "Bare-metal Provisioning with Redfish",
    subtitle: "BMC + BIOS + firmware + PXE + Metal3 cookbook for hardware fleets",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "Redfish API basics: schema, sessions, ETags",
    "BMC inventory: power, NICs, drives, firmware versions",
    "Authentication: local accounts, LDAP, mTLS",
    "Power and one-time boot via Redfish",
    "Virtual media: attach ISO + boot once",
    "BIOS settings: get + set + apply on next boot",
    "Firmware update: SimpleUpdate task flow",
    "RAID / storage controller configuration",
    "SNMP -> Redfish migration patterns",
    "PXE + DHCP + TFTP baseline for fleet boot",
    "Kickstart for RHEL / Rocky / AlmaLinux",
    "Autoinstall for Ubuntu 22.04 / 24.04",
    "Image-based provisioning with osbuild / coreos-installer",
    "Ansible: community.general.redfish_* modules",
    "Inventory plugin: Redfish-driven dynamic inventory",
    "Metal3 + Ironic on Kubernetes",
    "Tinkerbell as a Metal3 alternative",
    "Secure boot, TPM, and disk encryption (LUKS2)",
    "Day-2: telemetry via Redfish events + RSyslog",
    "Common errors and one-line fixes",
    "Reference YAML and shell snippets",
    "Versioning, releases, and support",
    "License",
  ]);

  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "Bare-metal Provisioning with Redfish is the cookbook we hand to engineers running on-prem and colo hardware fleets. It covers the Redfish API end to end, from inventory queries through firmware updates to image-based provisioning, plus the orchestrators (Metal3 / Ironic / Tinkerbell) that turn those primitives into a self-service platform.",
  );
  drawParagraph(
    ctx,
    "Every recipe is tested against Dell iDRAC 9 (firmware 7.x), HPE iLO 5 + 6, Supermicro X12 BMC, and Lenovo XCC2. Redfish version target: 1.20.x. Recipes work against vanilla curl, the python-redfish library, the Ansible community.general.redfish_* modules, and Metal3 v1.7+.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Redfish schema cheat-sheet: Systems, Chassis, Managers, BIOS, Storage.",
    "BMC inventory queries (NICs, drives, firmware) as plain curl and Ansible.",
    "Power + one-time boot recipes (PXE / HDD / virtual media).",
    "Virtual-media attach + boot for image-based installs (no PXE / DHCP needed).",
    "BIOS get/set with ETag concurrency and apply-on-next-reset.",
    "SimpleUpdate firmware flow for iDRAC / iLO / Supermicro.",
    "PXE + kickstart + autoinstall recipes for RHEL / Rocky / Ubuntu.",
    "Metal3 + Ironic on Kubernetes for declarative bare-metal.",
    "Tinkerbell workflows as a lighter alternative.",
    "Day-2 telemetry via Redfish events + 10 common errors with fixes.",
    "Lifetime updates while the recipes are maintained, delivered via /library.",
  ]);

  // 2
  newPage(ctx);
  drawHeading(ctx, "2. Redfish API basics: schema, sessions, ETags", 1);
  drawCode(
    ctx,
    [
      "# Discover root",
      "curl -ksu admin:password https://bmc.example.com/redfish/v1/ | jq .",
      "",
      "# Create session token (preferred over basic auth)",
      "TOKEN=$(curl -ksi -H 'Content-Type: application/json' \\",
      "  -d '{\"UserName\":\"admin\",\"Password\":\"password\"}' \\",
      "  https://bmc.example.com/redfish/v1/SessionService/Sessions \\",
      "  | awk -F': ' '/X-Auth-Token/ {print $2}' | tr -d '\\r')",
      "",
      "# Use token + ETag for safe PATCH",
      "ETAG=$(curl -ks -H \"X-Auth-Token: $TOKEN\" -I \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Bios | grep ETag | awk '{print $2}')",
      "curl -ksi -X PATCH \\",
      "  -H \"X-Auth-Token: $TOKEN\" -H \"If-Match: $ETAG\" \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '{\"Attributes\":{\"BootMode\":\"Uefi\"}}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Bios/Settings",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always use X-Auth-Token; basic auth chews BMC CPU and triggers brute-force lockouts.",
    "Send `If-Match: $ETag` on every PATCH - mandatory on iLO 6, recommended everywhere.",
    "Pretty-print with jq; Redfish JSON has many `@odata.id` links to follow.",
    "Validate Redfish 1.x with `redfish-conformance` before assuming spec parity.",
  ]);

  // 3 inventory
  newPage(ctx);
  drawHeading(ctx, "3. BMC inventory: power, NICs, drives, firmware versions", 1);
  drawCode(
    ctx,
    [
      "# Power state",
      "curl -ks -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/Systems/1 \\",
      "  | jq '{model: .Model, sku: .SKU, serial: .SerialNumber, power: .PowerState, mem_gb: .MemorySummary.TotalSystemMemoryGiB}'",
      "",
      "# Network adapters",
      "curl -ks -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/EthernetInterfaces \\",
      "  | jq '.Members[].\"@odata.id\"'",
      "",
      "# Drives",
      "curl -ks -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Storage/Controller0/Drives/Drive0 \\",
      "  | jq '{model: .Model, capacity_gb: (.CapacityBytes / 1024 / 1024 / 1024 | round), media: .MediaType, fw: .Revision}'",
      "",
      "# Firmware inventory",
      "curl -ks -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/UpdateService/FirmwareInventory \\",
      "  | jq '.Members[].\"@odata.id\"'",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Cache the inventory daily into a JSON file - feeds dashboards + AAP surveys.",
    "Vendor-specific keys (Oem.*) drift across firmware; standard keys (Model, SKU) are stable.",
    "Drive WearOut / PredictedMediaLifeLeftPercent on NVMe alerts you BEFORE the drive dies.",
  ]);

  // 4 auth
  newPage(ctx);
  drawHeading(ctx, "4. Authentication: local accounts, LDAP, mTLS", 1);
  drawBullets(ctx, [
    "Disable default root account; create per-environment service accounts (prod-ops, prod-readonly).",
    "Integrate AccountService with LDAP / AD; SSO into BMCs via your identity provider.",
    "Enforce TLS 1.2+ on every BMC; replace self-signed certs with internal CA via Redfish.",
    "Lockout policy: 5 failed attempts -> 30 min lockout; logs to /Managers/1/LogServices.",
    "Rotate service-account passwords quarterly with an Ansible playbook + vault.",
  ]);

  // 5 power
  newPage(ctx);
  drawHeading(ctx, "5. Power and one-time boot via Redfish", 1);
  drawCode(
    ctx,
    [
      "# Power on",
      "curl -ks -X POST -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"ResetType\":\"On\"}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Actions/ComputerSystem.Reset",
      "",
      "# Force restart",
      "  -d '{\"ResetType\":\"ForceRestart\"}'",
      "",
      "# One-time PXE boot, then back to HDD",
      "curl -ks -X PATCH -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"Boot\":{\"BootSourceOverrideTarget\":\"Pxe\",\"BootSourceOverrideEnabled\":\"Once\",\"BootSourceOverrideMode\":\"UEFI\"}}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1",
      "",
      "# One-time virtual CD boot",
      "  -d '{\"Boot\":{\"BootSourceOverrideTarget\":\"Cd\",\"BootSourceOverrideEnabled\":\"Once\"}}'",
    ].join("\n"),
  );

  // 6 virtual media
  newPage(ctx);
  drawHeading(ctx, "6. Virtual media: attach ISO + boot once", 1);
  drawCode(
    ctx,
    [
      "# Attach an ISO over HTTPS",
      "curl -ksi -X POST -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"Image\":\"https://repo.example.com/iso/rhel9.iso\",\"Inserted\":true,\"WriteProtected\":true}' \\",
      "  https://bmc.example.com/redfish/v1/Managers/1/VirtualMedia/CD/Actions/VirtualMedia.InsertMedia",
      "",
      "# Set one-time CD boot",
      "curl -ks -X PATCH -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"Boot\":{\"BootSourceOverrideTarget\":\"Cd\",\"BootSourceOverrideEnabled\":\"Once\"}}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1",
      "",
      "# Reboot to start install",
      "curl -ks -X POST -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"ResetType\":\"ForceRestart\"}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Actions/ComputerSystem.Reset",
      "",
      "# After install completes, eject",
      "curl -ks -X POST -H \"X-Auth-Token: $TOKEN\" -d '{}' \\",
      "  https://bmc.example.com/redfish/v1/Managers/1/VirtualMedia/CD/Actions/VirtualMedia.EjectMedia",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Virtual media beats PXE for green-field installs - no DHCP / TFTP infra required.",
    "Host the ISO over HTTPS with a valid cert; iLO 6 rejects self-signed remotes.",
    "Always eject after install - left-attached virtual media slows reboot.",
    "iDRAC supports HTTPS, NFS, CIFS; pick whatever survives your firewall.",
  ]);

  // 7 BIOS
  newPage(ctx);
  drawHeading(ctx, "7. BIOS settings: get + set + apply on next boot", 1);
  drawCode(
    ctx,
    [
      "# Read current BIOS attributes",
      "curl -ks -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Bios \\",
      "  | jq .Attributes",
      "",
      "# Stage changes to take effect on next boot",
      "ETAG=$(curl -ks -I -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Bios/Settings | grep ETag | awk '{print $2}')",
      "curl -ks -X PATCH -H \"X-Auth-Token: $TOKEN\" -H \"If-Match: $ETAG\" \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '{\"Attributes\":{\"BootMode\":\"Uefi\",\"SecureBoot\":\"Enabled\",\"ProcVirtualization\":\"Enabled\",\"SriovGlobalEnable\":\"Enabled\"}}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Bios/Settings",
      "",
      "# Reboot to apply",
      "curl -ks -X POST -H \"X-Auth-Token: $TOKEN\" \\",
      "  -d '{\"ResetType\":\"ForceRestart\"}' -H 'Content-Type: application/json' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Actions/ComputerSystem.Reset",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always PATCH `Bios/Settings`, never `Bios` directly - the latter is read-only.",
    "Attribute names are vendor-specific; pull current values first then diff against desired.",
    "Build a per-model BIOS template in YAML; converge with Ansible community.general.redfish_config.",
    "Some attributes require BIOS reset to defaults; capture the reset action URL upfront.",
  ]);

  // 8 firmware
  newPage(ctx);
  drawHeading(ctx, "8. Firmware update: SimpleUpdate task flow", 1);
  drawCode(
    ctx,
    [
      "# Start firmware update from HTTPS URL",
      "TASK=$(curl -ksi -X POST -H \"X-Auth-Token: $TOKEN\" \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '{\"ImageURI\":\"https://repo.example.com/fw/bios-2.21.exe\",\"TransferProtocol\":\"HTTPS\",\"Targets\":[\"/redfish/v1/UpdateService/FirmwareInventory/BIOS\"]}' \\",
      "  https://bmc.example.com/redfish/v1/UpdateService/Actions/UpdateService.SimpleUpdate \\",
      "  | awk -F': ' '/Location/ {print $2}' | tr -d '\\r')",
      "",
      "# Poll until the task completes",
      "while true; do",
      "  STATE=$(curl -ks -H \"X-Auth-Token: $TOKEN\" \"https://bmc.example.com$TASK\" | jq -r .TaskState)",
      "  echo \"$(date -u) state=$STATE\"",
      "  [ \"$STATE\" = Completed ] && break",
      "  [ \"$STATE\" = Exception ] && exit 1",
      "  sleep 60",
      "done",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "SimpleUpdate is the standard; vendor `OemUpdate` exists but breaks portability.",
    "Stage firmware on an internal repo; never expose updates to the public internet.",
    "Use a maintenance window; some firmware updates restart the BMC mid-flow.",
    "Always verify firmware checksum (Sha256Checksum) before invoking SimpleUpdate.",
  ]);

  // 9 RAID
  newPage(ctx);
  drawHeading(ctx, "9. RAID / storage controller configuration", 1);
  drawCode(
    ctx,
    [
      "# List storage controllers",
      "curl -ks -H \"X-Auth-Token: $TOKEN\" \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Storage \\",
      "  | jq '.Members[].\"@odata.id\"'",
      "",
      "# Create a RAID1 volume",
      "curl -ks -X POST -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"RAIDType\":\"RAID1\",\"CapacityBytes\":1099511627776,\"Links\":{\"Drives\":[{\"@odata.id\":\"/redfish/v1/Systems/1/Storage/RAID/Drives/Drive0\"},{\"@odata.id\":\"/redfish/v1/Systems/1/Storage/RAID/Drives/Drive1\"}]}}' \\",
      "  https://bmc.example.com/redfish/v1/Systems/1/Storage/RAID/Volumes",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always target boot RAID1; data RAID5/6 only with battery-backed cache.",
    "Some controllers require `InitializeMethod: Background` to avoid 30+ min init wait.",
    "Capture volume serial; map to OS device by `lsblk -o NAME,WWN` post-install.",
  ]);

  // 10 SNMP migration
  newPage(ctx);
  drawHeading(ctx, "10. SNMP -> Redfish migration patterns", 1);
  drawBullets(ctx, [
    "Redfish is the long-term direction; SNMP v1/v2 is being deprecated by major vendors.",
    "Use Redfish event subscriptions instead of SNMP traps - reliable, scoped, authenticated.",
    "Map common OIDs to Redfish properties; document the cross-reference per model.",
    "Run both in parallel for one quarter; then disable SNMP via Redfish PATCH.",
    "Telemetry collectors: redfish_exporter for Prometheus replaces snmp_exporter at scale.",
  ]);

  // 11 PXE baseline
  newPage(ctx);
  drawHeading(ctx, "11. PXE + DHCP + TFTP baseline for fleet boot", 1);
  drawCode(
    ctx,
    [
      "# /etc/dhcp/dhcpd.conf",
      "subnet 10.0.10.0 netmask 255.255.255.0 {",
      "  range 10.0.10.50 10.0.10.250;",
      "  option routers 10.0.10.1;",
      "  next-server 10.0.10.5;     # TFTP server",
      "  if exists user-class and option user-class = \"iPXE\" {",
      "    filename \"http://10.0.10.5/boot.ipxe\";",
      "  } else {",
      "    filename \"undionly.kpxe\";",
      "  }",
      "}",
      "",
      "# /var/lib/tftpboot/boot.ipxe",
      "#!ipxe",
      "set base-url http://10.0.10.5/images/rhel9",
      "kernel ${base-url}/vmlinuz inst.ks=http://10.0.10.5/ks/${net0/mac}.cfg",
      "initrd ${base-url}/initrd.img",
      "boot",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "iPXE chainloaded from PXE breaks vendor lock - HTTP is faster + firewall-friendly.",
    "Per-MAC kickstart URL lets one DHCP serve N hardware profiles.",
    "Keep TFTP server's filesystem tiny - the slowness compounds with hundreds of nodes booting.",
  ]);

  // 12 kickstart
  newPage(ctx);
  drawHeading(ctx, "12. Kickstart for RHEL / Rocky / AlmaLinux", 1);
  drawCode(
    ctx,
    [
      "# /var/www/html/ks/aa:bb:cc:dd:ee:ff.cfg",
      "text",
      "lang en_US.UTF-8",
      "keyboard us",
      "timezone Europe/Amsterdam --utc",
      "rootpw --iscrypted $6$saltsalt$...",
      "selinux --enforcing",
      "firewall --enabled --service=ssh",
      "url --url=http://10.0.10.5/images/rhel9",
      "repo --name=AppStream --baseurl=http://10.0.10.5/images/rhel9/AppStream",
      "clearpart --all --initlabel",
      "autopart --type=lvm --encrypted --passphrase=changeme",
      "bootloader --location=mbr --boot-drive=sda",
      "%packages",
      "@core",
      "ansible-core",
      "open-vm-tools",
      "%end",
      "%post --interpreter=/usr/bin/bash --log=/root/post.log",
      "set -euo pipefail",
      "mkdir -p /root/.ssh && chmod 700 /root/.ssh",
      "curl -fsS http://10.0.10.5/keys/ansible.pub >> /root/.ssh/authorized_keys",
      "%end",
      "reboot",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pre-hash root password with `python3 -c 'import crypt;print(crypt.crypt(\"...\",crypt.mksalt()))'`.",
    "Always `clearpart --all --initlabel` for new hardware; otherwise leftover GPT confuses Anaconda.",
    "%post is your first chance to drop SSH keys + register subscription-manager.",
    "Log to /root/post.log - rescue mode reads it when %post fails.",
  ]);

  // 13 autoinstall
  newPage(ctx);
  drawHeading(ctx, "13. Autoinstall for Ubuntu 22.04 / 24.04", 1);
  drawCode(
    ctx,
    [
      "# /var/www/html/ai/user-data",
      "#cloud-config",
      "autoinstall:",
      "  version: 1",
      "  locale: en_US.UTF-8",
      "  keyboard: { layout: us }",
      "  network:",
      "    version: 2",
      "    ethernets:",
      "      eno1: { dhcp4: true }",
      "  storage:",
      "    layout: { name: lvm, sizing-policy: all, password: changeme }",
      "  identity:",
      "    hostname: '{{ hostname }}'",
      "    username: ansible",
      "    password: '$6$saltsalt$...'",
      "  ssh:",
      "    install-server: true",
      "    authorized-keys: ['ssh-ed25519 AAAA...']",
      "  packages: [open-vm-tools, qemu-guest-agent, snmpd]",
      "  late-commands:",
      "    - curtin in-target --target=/target -- systemctl enable qemu-guest-agent",
      "",
      "# kernel cmdline for the netboot kernel",
      "  autoinstall ds=nocloud-net;s=http://10.0.10.5/ai/",
    ].join("\n"),
  );

  // 14 image-based
  newPage(ctx);
  drawHeading(ctx, "14. Image-based provisioning with osbuild / coreos-installer", 1);
  drawCode(
    ctx,
    [
      "# Build a raw image with osbuild-composer (RHEL)",
      "cat > toml.toml <<EOF",
      "name = \"rhel9-gold\"",
      "description = \"hardened base\"",
      "version = \"1.0.0\"",
      "modules = []",
      "groups = []",
      "[[packages]]",
      "name = \"ansible-core\"",
      "[customizations]",
      "[[customizations.user]]",
      "name = \"ansible\"",
      "key = \"ssh-ed25519 AAAA...\"",
      "groups = [\"wheel\"]",
      "EOF",
      "composer-cli blueprints push toml.toml",
      "composer-cli compose start rhel9-gold raw",
      "",
      "# Lay it down with coreos-installer on first boot (CoreOS / RHCOS)",
      "coreos-installer install /dev/sda \\",
      "  --image-url https://repo.example.com/img/rhcos-4.16.raw.xz \\",
      "  --ignition-url https://repo.example.com/ignition/${MAC}.ign",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "osbuild is the supported path on RHEL; output formats: raw, qcow2, ova, iso.",
    "Ignition (RHCOS) and cloud-init (RHEL) co-exist; pick one per node class.",
    "Build images in CI; pin all RPMs to a specific Composer repo snapshot.",
    "Sign images with cosign; verify before coreos-installer pulls them.",
  ]);

  // 15 Ansible redfish
  newPage(ctx);
  drawHeading(ctx, "15. Ansible: community.general.redfish_* modules", 1);
  drawCode(
    ctx,
    [
      "- name: Power on + boot once from CD",
      "  hosts: localhost",
      "  vars:",
      "    bmcs:",
      "      - { host: bmc01.example.com, user: \"{{ vault_bmc_user }}\", pass: \"{{ vault_bmc_pass }}\" }",
      "  tasks:",
      "    - name: Insert virtual media",
      "      community.general.redfish_command:",
      "        category: Manager",
      "        command: VirtualMediaInsert",
      "        virtual_media:",
      "          image_url: https://repo.example.com/iso/rhel9.iso",
      "          media_types: [\"CD\", \"DVD\"]",
      "          inserted: true",
      "          write_protected: true",
      "        baseuri: \"{{ item.host }}\"",
      "        username: \"{{ item.user }}\"",
      "        password: \"{{ item.pass }}\"",
      "      loop: \"{{ bmcs }}\"",
      "    - name: Boot once from CD",
      "      community.general.redfish_config:",
      "        category: Systems",
      "        command: SetBootOverride",
      "        bootdevice: Cd",
      "        boot_override_mode: UEFI",
      "        bootnext: true",
      "        baseuri: \"{{ item.host }}\"",
      "        username: \"{{ item.user }}\"",
      "        password: \"{{ item.pass }}\"",
      "      loop: \"{{ bmcs }}\"",
      "    - name: Force restart",
      "      community.general.redfish_command:",
      "        category: Systems",
      "        command: PowerForceRestart",
      "        baseuri: \"{{ item.host }}\"",
      "        username: \"{{ item.user }}\"",
      "        password: \"{{ item.pass }}\"",
      "      loop: \"{{ bmcs }}\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "community.general.redfish_* covers Systems + Managers + Chassis - 90% of day-2.",
    "For Bios attribute drift: redfish_config + a YAML template per server model.",
    "Run BMC playbooks from a controller, not the target host - chicken-and-egg otherwise.",
  ]);

  // 16 inventory plugin
  newPage(ctx);
  drawHeading(ctx, "16. Inventory plugin: Redfish-driven dynamic inventory", 1);
  drawCode(
    ctx,
    [
      "# inventory/redfish.yml",
      "plugin: community.general.redfish",
      "url: https://bmc-mgr.example.com",
      "username: \"{{ lookup('env', 'REDFISH_USER') }}\"",
      "password: \"{{ lookup('env', 'REDFISH_PASS') }}\"",
      "fetch_all: false",
      "compose:",
      "  ansible_host: redfish.Bmc.Address",
      "groups:",
      "  dell: \"'Dell' in redfish.System.Manufacturer\"",
      "  hpe:  \"'HPE'  in redfish.System.Manufacturer\"",
      "  smc:  \"'Supermicro' in redfish.System.Manufacturer\"",
    ].join("\n"),
  );

  // 17 Metal3
  newPage(ctx);
  drawHeading(ctx, "17. Metal3 + Ironic on Kubernetes", 1);
  drawCode(
    ctx,
    [
      "apiVersion: metal3.io/v1alpha1",
      "kind: BareMetalHost",
      "metadata: { name: node01, namespace: metal3 }",
      "spec:",
      "  bmc:",
      "    address: redfish-virtualmedia://bmc01.example.com/redfish/v1/Systems/1",
      "    credentialsName: node01-bmc",
      "    disableCertificateVerification: false",
      "  bootMACAddress: aa:bb:cc:dd:ee:ff",
      "  bootMode: UEFI",
      "  online: true",
      "  image:",
      "    url: https://repo.example.com/img/ubuntu-24.04.qcow2",
      "    checksum: https://repo.example.com/img/ubuntu-24.04.qcow2.sha256",
      "    checksumType: sha256",
      "  userData: { name: node01-user-data, namespace: metal3 }",
      "  rootDeviceHints: { rotational: false, minSizeGigabytes: 480 }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Metal3 turns BareMetalHost into a Kubernetes resource; reconciles via Ironic.",
    "`redfish-virtualmedia://` driver: zero PXE infra needed.",
    "rootDeviceHints picks the right drive - critical on multi-disk systems.",
    "Combine with CAPI for a fully GitOps bare-metal Kubernetes pipeline.",
  ]);

  // 18 tinkerbell
  newPage(ctx);
  drawHeading(ctx, "18. Tinkerbell as a Metal3 alternative", 1);
  drawBullets(ctx, [
    "Tinkerbell is lighter than Metal3 - no Kubernetes required, but works on it (Boots / Hegel).",
    "Workflow YAML drives a multi-step provision: wipe -> partition -> dd image -> cloud-init.",
    "Use when you want a self-contained provisioner without the Ironic complexity.",
    "Pairs well with Cluster API's CAPT provider for bare-metal Kubernetes.",
  ]);

  // 19 secure boot
  newPage(ctx);
  drawHeading(ctx, "19. Secure boot, TPM, and disk encryption (LUKS2)", 1);
  drawBullets(ctx, [
    "Enable Secure Boot + TPM 2.0 in BIOS template; required for FedRAMP / DISA STIG.",
    "Seal LUKS2 keys to PCRs (0,1,4,7) via clevis + tang - no manual passphrase at boot.",
    "Provision tang server before fleet rollout; quorum of 2 in geographic redundancy.",
    "Rotate LUKS keys yearly; clevis luks regen handles re-binding without re-encryption.",
  ]);

  // 20 telemetry
  newPage(ctx);
  drawHeading(ctx, "20. Day-2: telemetry via Redfish events + RSyslog", 1);
  drawCode(
    ctx,
    [
      "# Subscribe to Redfish events (HTTP POST to your receiver)",
      "curl -ks -X POST -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"Destination\":\"https://collector.example.com/redfish-events\",\"Protocol\":\"Redfish\",\"EventTypes\":[\"Alert\",\"ResourceUpdated\"],\"Context\":\"prod\"}' \\",
      "  https://bmc.example.com/redfish/v1/EventService/Subscriptions",
      "",
      "# Forward BMC SEL/log to rsyslog target",
      "curl -ks -X PATCH -H \"X-Auth-Token: $TOKEN\" -H 'Content-Type: application/json' \\",
      "  -d '{\"SyslogServers\":[{\"Address\":\"syslog.example.com\",\"Port\":514,\"Protocol\":\"UDP\"}]}' \\",
      "  https://bmc.example.com/redfish/v1/Managers/1/NetworkProtocol",
    ].join("\n"),
  );

  // 21 errors
  newPage(ctx);
  drawHeading(ctx, "21. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "401 Unauthorized: stale X-Auth-Token; re-create the session and retry.",
    "412 Precondition Failed on PATCH: missing/stale ETag; GET headers again then PATCH.",
    "Virtual media insert hangs: receiver TLS cert invalid; use cert from internal CA.",
    "Firmware task stuck `Running`: BMC service crashed; reset BMC via Manager.Reset.",
    "BIOS Settings not applied: missing reboot OR another change pending; check `Bios/Settings`.",
    "Storage volume create returns 400: not enough drives match the RAID type/size.",
    "iLO `RIBCL deprecated`: switch from HP-iLO module to community.general.redfish_*.",
    "Subscription POST 405: vendor lacks EventService; poll LogServices instead.",
    "PXE never reaches bootloader: BIOS in Legacy + iPXE expects UEFI; align mode.",
    "Kickstart `dracut: failed to find /dev/disk/by-uuid`: wrong inst.ks.device hint.",
  ]);

  // 22 reference YAML
  newPage(ctx);
  drawHeading(ctx, "22. Reference YAML and shell snippets", 1);
  drawCode(
    ctx,
    [
      "# Idempotent BIOS converge (Ansible)",
      "- community.general.redfish_config:",
      "    category: Systems",
      "    command: SetBiosAttributes",
      "    bios_attributes:",
      "      BootMode: Uefi",
      "      SecureBoot: Enabled",
      "      ProcVirtualization: Enabled",
      "      SriovGlobalEnable: Enabled",
      "      LogicalProc: Enabled",
      "    baseuri: \"{{ bmc.host }}\"",
      "    username: \"{{ bmc.user }}\"",
      "    password: \"{{ bmc.pass }}\"",
      "  notify: reset for BIOS",
      "handlers:",
      "  - name: reset for BIOS",
      "    community.general.redfish_command:",
      "      category: Systems",
      "      command: PowerForceRestart",
      "      baseuri: \"{{ bmc.host }}\"",
      "      username: \"{{ bmc.user }}\"",
      "      password: \"{{ bmc.pass }}\"",
    ].join("\n"),
  );

  // 23 versioning
  newPage(ctx);
  drawHeading(ctx, "23. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks Redfish 1.20.x, iDRAC 9 firmware 7.x, iLO 5/6, Supermicro X12 BMC, Lenovo XCC2, ansible-core 2.18, community.general 9.x, Metal3 v1.7+. Recipes are revalidated quarterly; updates ship via /library within 30 days.",
  );
  drawBullets(ctx, [
    "Sign in to https://www.copypastelearn.com/library to mint a fresh download link.",
    "Support: support@copypastelearn.com (one business day). Security: security@copypastelearn.com.",
  ]);

  // 24 license
  newPage(ctx);
  drawHeading(ctx, "24. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the recipes inside your own infrastructure projects, including projects you build for paying clients. You may not resell, sublicense, or republish the recipes as a standalone product.",
  );
  drawParagraph(
    ctx,
    "Redfish is a DMTF standard. iDRAC, iLO, XCC, Supermicro BMC, and related management firmware are trademarks of their respective owners. Metal3, Ironic, Tinkerbell, Ansible, and community.general are governed by their own open-source licenses - refer to upstream documentation for compliance details. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
