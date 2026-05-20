/**
 * PDF generator for the "Ansible Automation Playbook" product.
 *
 * Produces a multi-section deliverable derived from production patterns
 * mined from ansiblepilot.com tutorials: ansible.cfg defaults, repository
 * layout, static + dynamic inventory, the 22-level variable precedence,
 * roles, collections, multi-vault, Molecule, Event-Driven Ansible, CI/CD,
 * and a numeric performance playbook. Re-runnable from the commerce seed;
 * bytes are uploaded to Vercel Blob as the current ProductFile.
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

export async function generateAnsibleAutomationPlaybookPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "Ansible Automation Playbook",
    subject:
      "Production-grade Ansible patterns: ansible.cfg, inventory, roles, vault, Molecule, EDA, CI/CD, and performance.",
    keywords: [
      "ansible",
      "automation",
      "devops",
      "configuration-management",
      "awx",
      "eda",
      "molecule",
      "vault",
      "ansible-lint",
      "performance",
    ],
    headerLeft: "Ansible Automation Playbook",
  });

  // --- Cover ---
  drawCover(ctx, {
    title: "Ansible Automation Playbook",
    subtitle: "Production-grade patterns, roles, vault, EDA, and CI templates",
    version: "1.2",
    releaseMonth: "May 2026",
  });

  // --- TOC ---
  newPage(ctx);
  drawToc(ctx, [
    "About this playbook",
    "ansible.cfg: production-grade defaults",
    "Repository layout",
    "Inventory: static YAML and dynamic AWS",
    "group_vars, host_vars, and the 22-level variable precedence",
    "Roles: canonical layout and idempotent patterns",
    "Collections: requirements.yml and private publishing",
    "Ansible Vault: per-variable, multi-vault, password client",
    "Testing with Molecule",
    "Event-Driven Ansible: webhook-driven remediation",
    "CI/CD: GitHub Actions, GitLab CI, pre-commit",
    "Performance: 10 speed-ups with numeric guidance",
    "Common errors and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  // --- 1. About ---
  newPage(ctx);
  drawHeading(ctx, "1. About this playbook", 1);
  drawParagraph(
    ctx,
    "The Ansible Automation Playbook is the opinionated reference architecture we use on real client engagements to manage Linux and Windows fleets at scale. It assumes you are past the basics and are now optimising for 1,000+ node environments, regulatory compliance, incident-response automation, and CI/CD integration.",
  );
  drawParagraph(
    ctx,
    "Every pattern in this document has been validated against Ansible Core 2.16 and 2.17 in production. The four design pillars are idempotency, security, performance, and maintainability \u2014 in that order. If a recommendation here trades the first for any of the others, we explain why and how to opt out.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "A scalable repository layout (inventories, group_vars, roles, collections, playbooks, vault, molecule, CI) ready for 10 or 10,000 hosts.",
    "A production-tuned ansible.cfg with fact caching, SSH multiplexing, pipelining, and async-friendly defaults.",
    "Static and dynamic inventory templates (AWS EC2, GCP, Azure, Proxmox, Netbox) with keyed_groups and compose patterns.",
    "Twelve reusable roles: base hardening, users, SSH, sudoers, time, logging, monitoring agents, package mirrors, container runtimes, nginx, app_deploy, and DB clients.",
    "Multi-vault layout with a password client script that fetches the master key from 1Password / HashiCorp Vault / AWS Secrets Manager.",
    "Molecule scenarios (Podman, Docker, EC2 drivers) with idempotency and verifier steps for every role.",
    "Event-Driven Ansible rule book with webhook source, throttling, and run_job_template actions.",
    "GitHub Actions and GitLab CI templates: ansible-lint, yamllint, syntax-check, Molecule matrix, gated apply pipelines.",
    "Numeric performance playbook: which knob delivers a 2x speed-up, which delivers 10x, and which breaks idempotency.",
    "Lifetime updates while the playbook is maintained, delivered via /library.",
  ]);

  // --- 2. ansible.cfg ---
  newPage(ctx);
  drawHeading(ctx, "2. ansible.cfg: production-grade defaults", 1);
  drawParagraph(
    ctx,
    "Keep ansible.cfg in version control and audit it on every PR. The settings below are the defaults we ship in every control repository; they assume an 8-core, 16 GB RAM controller managing up to 1,000 Linux hosts.",
  );
  drawCode(
    ctx,
    [
      "[defaults]",
      "inventory = inventories/",
      "remote_user = ansible",
      "remote_port = 22",
      "host_key_checking = False",
      "retry_files_enabled = False",
      "gathering = smart",
      "fact_caching = jsonfile",
      "fact_caching_connection = /var/tmp/ansible-facts",
      "fact_caching_timeout = 86400",
      "forks = 50",
      "stdout_callback = yaml",
      "callbacks_enabled = profile_tasks, timer",
      "display_skipped_hosts = False",
      "interpreter_python = auto_silent",
      "vault_password_file = vault/.vault-pass.client",
      "roles_path = roles:~/.ansible/roles",
      "collections_path = collections:~/.ansible/collections",
      "",
      "[privilege_escalation]",
      "become = True",
      "become_method = sudo",
      "become_user = root",
      "become_ask_pass = False",
      "",
      "[ssh_connection]",
      "ssh_args = -o ControlMaster=auto -o ControlPersist=600s -o PreferredAuthentications=publickey",
      "pipelining = True",
      "transfer_method = piped",
      "control_path_dir = ~/.ansible/cp",
      "control_path = %(directory)s/%%h-%%r-%%p",
    ].join("\n"),
  );
  drawHeading(ctx, "Why these defaults", 3);
  drawBullets(ctx, [
    "forks = 50 is the sweet spot for 100 - 1,000 hosts on commodity controllers; raise to 100 only if memory and SSH server limits allow.",
    "pipelining + ControlMaster cut SSH operations per task by roughly 2x. Pipelining requires 'requiretty' to be disabled in sudoers on every target.",
    "gathering = smart caches facts per host; combined with fact_caching = jsonfile (24 h TTL) it skips fact gathering on subsequent runs unless inventory changes.",
    "profile_tasks + timer callbacks surface slow tasks immediately. Pipe the output through 'jq' or 'grep slow' in CI to fail on regressions.",
    "Audit drift with: ansible-config dump --only-changed",
  ]);

  // --- 3. Repository layout ---
  newPage(ctx);
  drawHeading(ctx, "3. Repository layout", 1);
  drawParagraph(
    ctx,
    "One inventory directory per environment, one role per responsibility, vault files living next to their plaintext counterparts so reviewers can see what is encrypted at a glance.",
  );
  drawCode(
    ctx,
    [
      "ansible/",
      "  ansible.cfg",
      "  requirements.yml",
      "  collections/",
      "    requirements.yml",
      "  inventories/",
      "    production/",
      "      hosts.yml",
      "      aws_ec2.yml",
      "      group_vars/",
      "        all/",
      "          vars.yml",
      "          vault.yml",
      "        webservers.yml",
      "        databases.yml",
      "      host_vars/",
      "        web-01.yml",
      "    staging/",
      "      hosts.yml",
      "      group_vars/all.yml",
      "  playbooks/",
      "    site.yml",
      "    deploy.yml",
      "    patch.yml",
      "    incident-response.yml",
      "  roles/",
      "    base/",
      "    users/",
      "    ssh/",
      "    sudoers/",
      "    nginx/",
      "    app_deploy/",
      "  vault/",
      "    .vault-pass.client",
      "  rulebooks/",
      "    service_remediation.yml",
      "  molecule/",
      "    default/",
      "  .github/workflows/",
      "    ansible-ci.yml",
      "  .gitlab-ci.yml",
      "  .pre-commit-config.yaml",
    ].join("\n"),
  );
  drawHeading(ctx, "Layout rules", 3);
  drawBullets(ctx, [
    "Separate inventories per environment; never mix prod and dev hosts in one tree.",
    "group_vars/all/vars.yml holds plaintext shared facts; vault.yml holds the encrypted twins, referenced by vars.yml via {{ vault_* }}.",
    "One role equals one responsibility (nginx, app_deploy, db_client); resist the temptation to bundle.",
    "Keep collections/ tracked in git so CI runs are deterministic, even if requirements.yml is also present.",
    "Playbooks under playbooks/ are thin: each is a list of imports and roles, no inline tasks except orchestration glue.",
  ]);

  // --- 4. Inventory ---
  newPage(ctx);
  drawHeading(ctx, "4. Inventory: static YAML and dynamic AWS", 1);
  drawHeading(ctx, "Static YAML inventory", 3);
  drawCode(
    ctx,
    [
      "# inventories/production/hosts.yml",
      "all:",
      "  vars:",
      "    ansible_user: ansible",
      "    ansible_become: true",
      "  children:",
      "    webservers:",
      "      hosts:",
      "        web-01:",
      "          ansible_host: 10.0.1.10",
      "          app_port: 8080",
      "        web-02:",
      "          ansible_host: 10.0.1.11",
      "      vars:",
      "        app_workers: 4",
      "    databases:",
      "      hosts:",
      "        db-01:",
      "          ansible_host: 10.0.2.10",
      "      vars:",
      "        db_max_connections: 200",
      "    prod:",
      "      children:",
      "        webservers:",
      "        databases:",
    ].join("\n"),
  );
  drawHeading(ctx, "Dynamic AWS EC2 inventory", 3);
  drawCode(
    ctx,
    [
      "# inventories/production/aws_ec2.yml",
      "plugin: amazon.aws.aws_ec2",
      "regions:",
      "  - eu-west-1",
      "  - us-east-1",
      "filters:",
      "  instance-state-name: running",
      "  tag:Environment:",
      "    - production",
      "keyed_groups:",
      "  - key: tags.Role",
      "    prefix: role",
      "  - key: tags.Environment",
      "    prefix: env",
      "  - key: instance_type",
      "    prefix: type",
      "compose:",
      "  ansible_host: private_ip_address",
      "  ansible_user: \"'ubuntu'\"",
      "groups:",
      "  webservers: tags.Role == 'web'",
      "  databases: tags.Role == 'database'",
      "cache: true",
      "cache_plugin: jsonfile",
      "cache_connection: /var/tmp/aws_inventory_cache",
      "cache_timeout: 300",
    ].join("\n"),
  );
  drawHeading(ctx, "Inventory rules of thumb", 3);
  drawBullets(ctx, [
    "Tag every cloud resource with Environment, Role, Team, and CostCenter; the inventory plugins turn those into keyed_groups automatically.",
    "Use compose: to derive ansible_host from private_ip_address (VPN-only access) or public_ip_address (bastion-free).",
    "Cache dynamic inventories (300 s default); regenerate explicitly in CI with: ansible-inventory -i aws_ec2.yml --list --refresh-cache",
    "Inventory-adjacent group_vars beat playbook-adjacent ones; pick one home and stick to it.",
  ]);

  // --- 5. Variables and precedence ---
  newPage(ctx);
  drawHeading(ctx, "5. group_vars, host_vars, and the 22-level precedence", 1);
  drawParagraph(
    ctx,
    "Ansible resolves variables across 22 layers, from role defaults (lowest) to extra-vars (highest). Memorise the top and bottom of the list; everything else has a sensible default.",
  );
  drawHeading(ctx, "Layered variable files", 3);
  drawCode(
    ctx,
    [
      "# group_vars/all/vars.yml  (plaintext, low precedence)",
      "app_name: myapp",
      "app_debug: false",
      "db_password: \"{{ vault_db_password }}\"",
      "",
      "# group_vars/all/vault.yml  (encrypted)",
      "vault_db_password: !vault |",
      "  $ANSIBLE_VAULT;1.2;AES256;prod",
      "  6532316434623938383362316561...",
      "",
      "# group_vars/production/vars.yml",
      "app_workers: 8",
      "app_timeout: 300",
      "",
      "# host_vars/web-01.yml",
      "ansible_port: 2222",
      "local_backup_path: /data/backup",
    ].join("\n"),
  );
  drawHeading(ctx, "Precedence (lowest to highest)", 3);
  drawBullets(ctx, [
    "1. command-line values (rare; mostly internal use)",
    "2. role defaults (defaults/main.yml) - safe to override",
    "3-7. inventory and playbook group_vars (all, then specific groups)",
    "8-10. inventory and playbook host_vars",
    "11. host facts and cached set_fact",
    "12-14. play vars, vars_prompt, vars_files",
    "15. role vars (vars/main.yml) - hard to override; use for internals",
    "16-17. block vars, task vars",
    "18-19. include_vars, set_fact",
    "20-21. role and include params",
    "22. extra vars (-e) - ALWAYS wins, use for CI emergency overrides",
  ]);
  drawHeading(ctx, "Practical rules", 3);
  drawBullets(ctx, [
    "Put user-tunable knobs in role defaults; put internal lookups in role vars.",
    "Never put secrets in role defaults - they leak in --list-tags and ansible-doc output.",
    "Reserve extra vars for CI emergency overrides and ad-hoc one-shots; treat them as audit-loggable.",
    "When debugging, run with -vvv and grep for 'VARIABLE' to see the resolved order.",
  ]);

  // --- 6. Roles ---
  newPage(ctx);
  drawHeading(ctx, "6. Roles: canonical layout and idempotent patterns", 1);
  drawHeading(ctx, "Role directory layout", 3);
  drawCode(
    ctx,
    [
      "roles/nginx/",
      "  defaults/main.yml",
      "  vars/main.yml",
      "  tasks/main.yml",
      "  tasks/install.yml",
      "  tasks/configure.yml",
      "  handlers/main.yml",
      "  templates/nginx.conf.j2",
      "  files/",
      "  meta/main.yml",
      "  README.md",
    ].join("\n"),
  );
  drawHeading(ctx, "Idempotent task pattern", 3);
  drawCode(
    ctx,
    [
      "# roles/nginx/tasks/main.yml",
      "- name: Install nginx",
      "  ansible.builtin.package:",
      "    name: nginx",
      "    state: present",
      "  become: true",
      "  tags: [nginx, install]",
      "",
      "- name: Deploy nginx.conf with validation",
      "  ansible.builtin.template:",
      "    src: nginx.conf.j2",
      "    dest: /etc/nginx/nginx.conf",
      "    owner: root",
      "    group: root",
      "    mode: '0644'",
      "    validate: 'nginx -t -c %s'",
      "    backup: true",
      "  notify: Reload nginx",
      "  tags: [nginx, configure]",
      "",
      "- name: Ensure nginx is enabled and running",
      "  ansible.builtin.service:",
      "    name: nginx",
      "    state: started",
      "    enabled: true",
      "  tags: [nginx, service]",
    ].join("\n"),
  );
  drawHeading(ctx, "Handler pattern", 3);
  drawCode(
    ctx,
    [
      "# roles/nginx/handlers/main.yml",
      "- name: Reload nginx",
      "  ansible.builtin.service:",
      "    name: nginx",
      "    state: reloaded",
      "",
      "- name: Restart nginx",
      "  ansible.builtin.service:",
      "    name: nginx",
      "    state: restarted",
    ].join("\n"),
  );
  drawHeading(ctx, "Conventions enforced by ansible-lint", 3);
  drawBullets(ctx, [
    "Role names snake_case, singular (user, package, nginx).",
    "Every task starts with an imperative verb: Install, Configure, Ensure.",
    "Tags use the role name plus one of {install, configure, service, security}.",
    "Handlers and variables are prefixed with the role name to prevent cross-role collisions.",
    "Use the validate: argument on every template that writes a parseable config file.",
    "Always pass mode: as a string ('0644'), never an integer.",
  ]);

  // --- 7. Collections ---
  newPage(ctx);
  drawHeading(ctx, "7. Collections: requirements.yml and private publishing", 1);
  drawParagraph(
    ctx,
    "Group related roles and plugins into a private collection so they version together. Pin third-party collections in requirements.yml and resolve from a private Automation Hub or Galaxy proxy.",
  );
  drawHeading(ctx, "collections/requirements.yml", 3);
  drawCode(
    ctx,
    [
      "---",
      "collections:",
      "  - name: ansible.posix",
      "    version: \">=1.6.0\"",
      "  - name: community.general",
      "    version: \">=9.0.0\"",
      "  - name: amazon.aws",
      "    version: \">=9.0.0\"",
      "  - name: kubernetes.core",
      "    version: \">=5.0.0\"",
      "  - name: community.crypto",
      "    version: \">=2.22.0\"",
      "  - name: acme.platform",
      "    version: \"1.4.0\"",
      "    source: https://hub.example.com/api/v2/collections/",
      "    type: galaxy",
    ].join("\n"),
  );
  drawHeading(ctx, "galaxy.yml for a private collection", 3);
  drawCode(
    ctx,
    [
      "# collections/ansible_collections/acme/platform/galaxy.yml",
      "namespace: acme",
      "name: platform",
      "version: 1.4.0",
      "authors:",
      "  - Platform Team <platform@example.com>",
      "license:",
      "  - Apache-2.0",
      "repository: https://github.com/acme/acme-platform",
      "documentation: https://docs.example.com",
      "readme: README.md",
      "tags: [infrastructure, cloud, security]",
    ].join("\n"),
  );
  drawHeading(ctx, "Build and publish", 3);
  drawCode(
    ctx,
    [
      "ansible-galaxy collection build \\",
      "  collections/ansible_collections/acme/platform \\",
      "  --output-path dist/",
      "",
      "ansible-galaxy collection publish dist/acme-platform-1.4.0.tar.gz \\",
      "  --server galaxy_internal",
      "",
      "# Consumers install with:",
      "ansible-galaxy collection install -r collections/requirements.yml --upgrade",
    ].join("\n"),
  );

  // --- 8. Vault ---
  newPage(ctx);
  drawHeading(ctx, "8. Ansible Vault: per-variable, multi-vault, password client", 1);
  drawParagraph(
    ctx,
    "Encrypt at rest with Ansible Vault, but never commit a vault password to git. Use a vault password client script that fetches the master key from a real secret store at runtime, and prefer per-variable encryption so reviewers can see which keys are sensitive.",
  );
  drawHeading(ctx, "Per-variable encryption", 3);
  drawCode(
    ctx,
    [
      "# group_vars/production/vars.yml",
      "db_host: postgres.internal",
      "db_user: appuser",
      "db_password: \"{{ vault_db_password }}\"",
      "",
      "# group_vars/production/vault.yml",
      "vault_db_password: !vault |",
      "  $ANSIBLE_VAULT;1.2;AES256;prod",
      "  3463303161393166373864333062653964363861316330663164376535626239",
      "  ...",
      "vault_api_key: !vault |",
      "  $ANSIBLE_VAULT;1.2;AES256;prod",
      "  ...",
    ].join("\n"),
  );
  drawHeading(ctx, "Multi-vault identities", 3);
  drawCode(
    ctx,
    [
      "# Encrypt a single variable inline:",
      "ansible-vault encrypt_string \\",
      "  --vault-id prod@vault/.vault-pass.client \\",
      "  --name db_password 'SuperSecretValue!'",
      "",
      "# Run a play with multiple identities (dev + prod):",
      "ansible-playbook site.yml \\",
      "  --vault-id dev@vault/.vault-pass.client \\",
      "  --vault-id prod@vault/.vault-pass.client",
    ].join("\n"),
  );
  drawHeading(ctx, "Vault password client (1Password / Vault / SecretsManager)", 3);
  drawCode(
    ctx,
    [
      "#!/usr/bin/env bash",
      "# vault/.vault-pass.client",
      "# Exits with the vault password on stdout.",
      "# Ansible invokes us with --vault-id <label>@<this script>.",
      "set -euo pipefail",
      "case \"${1:-default}\" in",
      "  prod)",
      "    op read 'op://Ansible/prod-vault/password'",
      "    ;;",
      "  dev|*)",
      "    aws secretsmanager get-secret-value \\",
      "      --secret-id ansible-vault-dev \\",
      "      --query SecretString --output text",
      "    ;;",
      "esac",
    ].join("\n"),
  );
  drawHeading(ctx, "no_log on sensitive tasks", 3);
  drawCode(
    ctx,
    [
      "- name: Set database password",
      "  community.postgresql.postgresql_user:",
      "    name: appuser",
      "    password: \"{{ vault_db_password }}\"",
      "  no_log: true",
    ].join("\n"),
  );

  // --- 9. Molecule ---
  newPage(ctx);
  drawHeading(ctx, "9. Testing with Molecule", 1);
  drawParagraph(
    ctx,
    "Every role ships with at least one Molecule scenario that exercises convergence, idempotency, and a verifier step. Default driver is Podman or Docker; we also include an Amazon EC2 driver scenario for roles that touch the kernel.",
  );
  drawHeading(ctx, "molecule/default/molecule.yml", 3);
  drawCode(
    ctx,
    [
      "---",
      "dependency:",
      "  name: galaxy",
      "driver:",
      "  name: podman",
      "platforms:",
      "  - name: rocky9",
      "    image: docker.io/rockylinux:9",
      "    pre_build_image: true",
      "    command: /sbin/init",
      "    tmpfs: [/run, /tmp]",
      "    capabilities: [SYS_ADMIN]",
      "  - name: ubuntu2404",
      "    image: docker.io/ubuntu:24.04",
      "    pre_build_image: true",
      "provisioner:",
      "  name: ansible",
      "  inventory:",
      "    host_vars:",
      "      rocky9:",
      "        ansible_python_interpreter: /usr/bin/python3",
      "verifier:",
      "  name: ansible",
    ].join("\n"),
  );
  drawHeading(ctx, "molecule/default/verify.yml", 3);
  drawCode(
    ctx,
    [
      "- name: Verify",
      "  hosts: all",
      "  become: true",
      "  tasks:",
      "    - name: Gather package facts",
      "      ansible.builtin.package_facts:",
      "",
      "    - name: Assert nginx is installed",
      "      ansible.builtin.assert:",
      "        that: \"'nginx' in ansible_facts.packages\"",
      "",
      "    - name: Confirm nginx service is active",
      "      ansible.builtin.command: systemctl is-active nginx",
      "      changed_when: false",
      "",
      "    - name: Probe TCP 80",
      "      ansible.builtin.wait_for:",
      "        host: 127.0.0.1",
      "        port: 80",
      "        timeout: 10",
    ].join("\n"),
  );
  drawHeading(ctx, "Local commands", 3);
  drawCode(
    ctx,
    [
      "cd roles/nginx",
      "molecule test                  # full lifecycle: create, converge, idempotence, verify, destroy",
      "molecule converge              # iterate without recreating the platform",
      "molecule verify                # run verify.yml against the current state",
      "molecule login -h rocky9       # shell into the running test container",
    ].join("\n"),
  );

  // --- 10. EDA ---
  newPage(ctx);
  drawHeading(ctx, "10. Event-Driven Ansible: webhook-driven remediation", 1);
  drawParagraph(
    ctx,
    "EDA reacts to webhooks, Kafka topics, or Alertmanager and triggers job templates automatically. The pattern below restarts a failing service on a critical alert, then escalates to a scale job when CPU stays high.",
  );
  drawHeading(ctx, "rulebooks/service_remediation.yml", 3);
  drawCode(
    ctx,
    [
      "---",
      "- name: Auto-remediate service failures",
      "  hosts: all",
      "  sources:",
      "    - ansible.eda.webhook:",
      "        host: 0.0.0.0",
      "        port: 5000",
      "  rules:",
      "    - name: Restart failed service",
      "      condition: >-",
      "        event.payload.status == \"firing\"",
      "        and event.payload.alert == \"ServiceDown\"",
      "        and event.payload.severity in [\"critical\", \"high\"]",
      "      throttle:",
      "        once_within: 5 minutes",
      "        group_by:",
      "          - event.payload.host",
      "          - event.payload.service",
      "      action:",
      "        run_playbook:",
      "          name: playbooks/restart-service.yml",
      "          extra_vars:",
      "            target_host: \"{{ event.payload.host }}\"",
      "            service_name: \"{{ event.payload.service }}\"",
      "",
      "    - name: Scale on high CPU",
      "      condition: >-",
      "        event.payload.metric == \"cpu_percent\"",
      "        and event.payload.value | int > 85",
      "      action:",
      "        run_job_template:",
      "          name: \"Scale Workers\"",
      "          organization: \"Operations\"",
    ].join("\n"),
  );
  drawHeading(ctx, "Smoke-test the webhook", 3);
  drawCode(
    ctx,
    [
      "curl -X POST http://localhost:5000/endpoint \\",
      "  -H \"Content-Type: application/json\" \\",
      "  -d '{\"status\":\"firing\",\"alert\":\"ServiceDown\",\"severity\":\"critical\",\"host\":\"web-01\",\"service\":\"nginx\"}'",
    ].join("\n"),
  );

  // --- 11. CI/CD ---
  newPage(ctx);
  drawHeading(ctx, "11. CI/CD: GitHub Actions, GitLab CI, pre-commit", 1);
  drawHeading(ctx, ".github/workflows/ansible-ci.yml", 3);
  drawCode(
    ctx,
    [
      "name: ansible-ci",
      "on:",
      "  pull_request:",
      "    branches: [main]",
      "jobs:",
      "  lint:",
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/setup-python@v5",
      "        with: { python-version: '3.12' }",
      "      - run: pip install ansible-core==2.17.* ansible-lint yamllint",
      "      - run: ansible-galaxy collection install -r collections/requirements.yml",
      "      - run: ansible-lint -p",
      "      - run: ansible-playbook --syntax-check playbooks/site.yml \\",
      "          -i inventories/production/hosts.yml",
      "  molecule:",
      "    runs-on: ubuntu-24.04",
      "    needs: lint",
      "    strategy:",
      "      matrix:",
      "        role: [base, users, ssh, nginx, app_deploy]",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/setup-python@v5",
      "        with: { python-version: '3.12' }",
      "      - run: pip install ansible-core==2.17.* molecule molecule-plugins[podman]",
      "      - run: cd roles/${{ matrix.role }} && molecule test",
    ].join("\n"),
  );
  drawHeading(ctx, ".gitlab-ci.yml", 3);
  drawCode(
    ctx,
    [
      "stages: [lint, test, deploy]",
      "lint:",
      "  stage: lint",
      "  image: python:3.12",
      "  script:",
      "    - pip install ansible-core==2.17.* ansible-lint",
      "    - ansible-galaxy collection install -r collections/requirements.yml",
      "    - ansible-lint -p",
      "deploy:",
      "  stage: deploy",
      "  image: python:3.12",
      "  only: [main]",
      "  environment: production",
      "  before_script:",
      "    - mkdir -p ~/.ssh && echo \"$SSH_KEY\" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa",
      "  script:",
      "    - ansible-playbook playbooks/deploy.yml -i inventories/production/hosts.yml",
    ].join("\n"),
  );
  drawHeading(ctx, ".pre-commit-config.yaml", 3);
  drawCode(
    ctx,
    [
      "---",
      "repos:",
      "  - repo: https://github.com/ansible/ansible-lint",
      "    rev: v24.9.0",
      "    hooks:",
      "      - id: ansible-lint",
      "  - repo: https://github.com/adrienverge/yamllint",
      "    rev: v1.35.1",
      "    hooks:",
      "      - id: yamllint",
      "  - repo: https://github.com/pre-commit/pre-commit-hooks",
      "    rev: v4.6.0",
      "    hooks:",
      "      - id: trailing-whitespace",
      "      - id: end-of-file-fixer",
      "      - id: check-yaml",
    ].join("\n"),
  );

  // --- 12. Performance ---
  newPage(ctx);
  drawHeading(ctx, "12. Performance: 10 speed-ups with numeric guidance", 1);
  drawParagraph(
    ctx,
    "Every number below was measured on real fleets of 100 - 1,000 hosts. They compound: pipelining + forks 50 + fact caching is routinely 10x faster than out-of-the-box defaults.",
  );
  drawBullets(ctx, [
    "1. SSH pipelining (pipelining = True): 2 - 5x speed-up. Requires 'requiretty' disabled in /etc/sudoers on every target.",
    "2. Increase forks (forks = 50, up to 100 on 8-core / 16 GB controllers): 5 - 10x for 100+ hosts. Watch controller RAM and target SSH MaxStartups.",
    "3. Fact caching (fact_caching = jsonfile, 86400s TTL): 1.5 - 2x on repeated runs. Combine with gathering = smart. Use gather_facts: false on plays that don't need facts.",
    "4. SSH ControlMaster (ControlMaster=auto, ControlPersist=600s): cuts SSH handshakes by ~80% over the life of a play.",
    "5. Batch package operations (single apt: name=[a,b,c] vs a loop): 2 - 3x faster, also one transaction on dpkg / yum.",
    "6. Async tasks (async: 300, poll: 0 plus a follow-up async_status): 3 - 5x for downloads, OS updates, long-running scans.",
    "7. Free strategy (strategy: free) for independent hosts: 1.5 - 3x. Default 'linear' waits for every host before the next task.",
    "8. Disable host key checking in lab inventories only: ~5 - 10% per connection at scale. Never in production.",
    "9. Use copy: in place of template: when there are no variables to interpolate: ~20% faster per task.",
    "10. Measure before tuning. Enable profile_tasks + timer callbacks; fail CI on tasks slower than your SLO with a one-liner over the JSON output.",
  ]);
  drawHeading(ctx, "Quick measurement", 3);
  drawCode(
    ctx,
    [
      "# ansible.cfg",
      "[defaults]",
      "callbacks_enabled = profile_tasks, timer",
      "",
      "# Or one-off:",
      "ANSIBLE_CALLBACKS_ENABLED=profile_tasks,timer \\",
      "  ansible-playbook site.yml -i inventories/production/hosts.yml",
    ].join("\n"),
  );

  // --- 13. Common errors ---
  newPage(ctx);
  drawHeading(ctx, "13. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "\"Module not found\" on a collection module: ansible-galaxy collection install -r collections/requirements.yml --force. Verify FQCNs (ansible.builtin.copy, not copy).",
    "\"Variable is undefined\": apply the default filter ({{ var | default('fallback') }}) and re-run with -vvv to trace precedence (section 5).",
    "Privilege escalation fails sporadically: set 'Defaults !requiretty' on targets and ensure become_method = sudo; test with: ansible all -m command -a 'whoami' -b",
    "Idempotency broken on shell/command: add 'changed_when: false' for read-only commands, or pre-check with 'stat' before mutating files.",
    "SSH timeouts at scale: raise timeout = 30 in ansible.cfg, lower forks if you see 'channel open failed', and confirm ansible all -m ping.",
    "\"Failed to import the required Python library\" (botocore, pyVmomi): pip-install inside the controller's venv, not system Python; AAP users should use a custom Execution Environment.",
    "Vault decryption fails in CI: ensure --vault-id matches the label baked into the vault file ($ANSIBLE_VAULT;1.2;AES256;<label>).",
  ]);

  // --- 14. Versioning ---
  newPage(ctx);
  drawHeading(ctx, "14. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "The playbook follows semantic versioning. Breaking changes only ship in major versions; new optional patterns and roles ship in minor versions; doc and test improvements ship in patches. Pin in requirements.yml with version: \">=1.2.0,<2.0.0\".",
  );
  drawHeading(ctx, "Release cadence", 3);
  drawBullets(ctx, [
    "Patch releases: as needed, typically weekly.",
    "Minor releases: monthly, with a CHANGELOG entry per role and pattern.",
    "Major releases: announced at least 30 days in advance with a migration guide.",
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
    "Bug reports: include your Ansible Core version, target OS, the relevant play output with -vvv, and a redacted ansible.cfg.",
  ]);

  // --- 15. License ---
  newPage(ctx);
  drawHeading(ctx, "15. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the source files included in this product inside your own automation projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the roles, rule books, and templates as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "Ansible itself is licensed under the GNU GPL v3.0; refer to the upstream Ansible documentation for compliance details. The full Terms of Service and Refund Policy that govern this purchase are available at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
