/**
 * PDF generator for the "Ansible Automation Playbook" product.
 *
 * Produces a multi-section deliverable covering production-grade Ansible
 * patterns: directory layout, inventory, roles, collections, Vault, Molecule
 * testing, AWX/EDA, and CI/CD. Re-runnable from the commerce seed; bytes are
 * uploaded to Vercel Blob as the current ProductFile.
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
      "Production-ready Ansible patterns, roles, collections, Vault, Molecule, AWX/EDA, and CI/CD templates.",
    keywords: [
      "ansible",
      "automation",
      "devops",
      "configuration-management",
      "awx",
      "eda",
      "molecule",
      "vault",
    ],
    headerLeft: "Ansible Automation Playbook",
  });

  // --- Cover ---
  drawCover(ctx, {
    title: "Ansible Automation Playbook",
    subtitle: "Production-ready patterns, roles, and CI templates",
    version: "1.1",
    releaseMonth: "May 2026",
  });

  // --- TOC ---
  newPage(ctx);
  drawToc(ctx, [
    "About this playbook",
    "Repository layout and prerequisites",
    "Inventory and group_vars",
    "Roles: structure and reusable patterns",
    "Collections and Galaxy distribution",
    "Secrets with Ansible Vault",
    "Testing with Molecule",
    "AWX and Event-Driven Ansible",
    "CI/CD with GitHub Actions and GitLab CI",
    "Versioning, releases, and support",
    "License",
  ]);

  // --- 1. About ---
  newPage(ctx);
  drawHeading(ctx, "1. About this playbook", 1);
  drawParagraph(
    ctx,
    "The Ansible Automation Playbook is a curated set of production-grade patterns we use on real client engagements to manage thousands of Linux and Windows hosts. It is not a tutorial: it is the opinionated reference architecture you would otherwise rebuild on every project.",
  );
  drawParagraph(
    ctx,
    "Every pattern has been battle-tested against Ansible 2.16 and 2.17, runs idempotently, and ships with the CI templates and pre-commit hooks needed to keep your control repository healthy as it grows.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "A reference repository layout that scales from 10 to 10,000 managed hosts.",
    "Twelve reusable roles covering base hardening, users, SSH, sudoers, time, logging, monitoring agents, package mirrors, container runtimes, web servers, app deployment, and database client tooling.",
    "Inventory templates for static YAML, dynamic AWS EC2, GCP, Azure, Proxmox, and Netbox sources.",
    "A Vault layout that scales without committing keys to git, with sample Vault password client scripts.",
    "Molecule scenarios with Docker and Podman drivers, including Windows verifiers.",
    "AWX project import templates and an Event-Driven Ansible rule book sample.",
    "GitHub Actions and GitLab CI templates with linting, syntax check, Molecule, and per-environment apply gates.",
    "Lifetime updates while the playbook is maintained, delivered via /library.",
  ]);

  // --- 2. Repository layout ---
  newPage(ctx);
  drawHeading(ctx, "2. Repository layout and prerequisites", 1);
  drawHeading(ctx, "Required tooling", 3);
  drawBullets(ctx, [
    "Ansible Core >= 2.16 (tested against 2.16 and 2.17).",
    "Python >= 3.11 in your control environment.",
    "ansible-lint, yamllint, and pre-commit installed locally.",
    "Optional: AWX 24+ or Ansible Automation Platform 2.5+, Molecule 24+, podman or docker for tests.",
  ]);
  drawHeading(ctx, "Repository layout", 3);
  drawCode(
    ctx,
    [
      "ansible/",
      "  ansible.cfg",
      "  requirements.yml",
      "  collections/",
      "    requirements.yml",
      "  inventories/",
      "    dev/",
      "      hosts.yml",
      "      group_vars/all.yml",
      "    prod/",
      "      hosts.yml",
      "      group_vars/all.yml",
      "  roles/",
      "    base/",
      "    users/",
      "    ssh/",
      "    sudoers/",
      "    nginx/",
      "    app_deploy/",
      "  playbooks/",
      "    site.yml",
      "    web.yml",
      "    db.yml",
      "  vault/",
      "    .vault-pass.client",
      "  molecule/",
      "    default/",
      "  .github/workflows/",
      "    ansible-ci.yml",
    ].join("\n"),
  );
  drawHeading(ctx, "ansible.cfg defaults", 3);
  drawCode(
    ctx,
    [
      "[defaults]",
      "inventory = inventories/dev/hosts.yml",
      "roles_path = roles",
      "collections_path = collections",
      "host_key_checking = False",
      "forks = 50",
      "stdout_callback = yaml",
      "callbacks_enabled = profile_tasks, timer",
      "interpreter_python = auto_silent",
      "retry_files_enabled = False",
      "",
      "[ssh_connection]",
      "pipelining = True",
      "ssh_args = -o ControlMaster=auto -o ControlPersist=300s",
    ].join("\n"),
  );

  // --- 3. Inventory ---
  newPage(ctx);
  drawHeading(ctx, "3. Inventory and group_vars", 1);
  drawParagraph(
    ctx,
    "We use a single source of truth per environment under inventories/{env}/hosts.yml, with group_vars layered by responsibility. Each host belongs to exactly one site, one role, and one tier; the play composes those facets at runtime.",
  );
  drawHeading(ctx, "hosts.yml (static)", 3);
  drawCode(
    ctx,
    [
      "all:",
      "  vars:",
      "    ansible_user: ansible",
      "    ansible_ssh_private_key_file: ~/.ssh/id_ed25519_ansible",
      "  children:",
      "    web:",
      "      hosts:",
      "        web01.prod.example.com:",
      "        web02.prod.example.com:",
      "    db:",
      "      hosts:",
      "        db01.prod.example.com:",
      "    prod:",
      "      children:",
      "        web:",
      "        db:",
    ].join("\n"),
  );
  drawHeading(ctx, "Dynamic inventory (AWS EC2)", 3);
  drawCode(
    ctx,
    [
      "# inventories/prod/aws_ec2.yml",
      "plugin: amazon.aws.aws_ec2",
      "regions:",
      "  - eu-west-1",
      "filters:",
      "  tag:Environment: prod",
      "keyed_groups:",
      "  - key: tags.Role",
      "    prefix: role",
      "  - key: tags.Tier",
      "    prefix: tier",
      "hostnames:",
      "  - private-ip-address",
      "compose:",
      "  ansible_host: private_ip_address",
    ].join("\n"),
  );
  drawHeading(ctx, "group_vars layering", 3);
  drawBullets(ctx, [
    "group_vars/all.yml: cross-cutting facts (timezone, locale, package mirrors).",
    "group_vars/web.yml: web-tier defaults (nginx version, TLS profile).",
    "group_vars/prod.yml: production overrides (stricter sudo, audit logging on).",
    "host_vars/<hostname>.yml: per-host overrides, kept to a minimum.",
  ]);

  // --- 4. Roles ---
  newPage(ctx);
  drawHeading(ctx, "4. Roles: structure and reusable patterns", 1);
  drawParagraph(
    ctx,
    "Every role follows the canonical layout from ansible-galaxy init and exposes a small, documented input surface via defaults/main.yml. Tasks are tagged so partial runs are safe; handlers are namespaced to avoid collisions.",
  );
  drawHeading(ctx, "Canonical role layout", 3);
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
  drawHeading(ctx, "tasks/main.yml pattern", 3);
  drawCode(
    ctx,
    [
      "- name: Install nginx",
      "  ansible.builtin.import_tasks: install.yml",
      "  tags: [nginx, install]",
      "",
      "- name: Configure nginx",
      "  ansible.builtin.import_tasks: configure.yml",
      "  tags: [nginx, configure]",
      "",
      "- name: Ensure nginx is enabled and started",
      "  ansible.builtin.service:",
      "    name: nginx",
      "    state: started",
      "    enabled: true",
      "  tags: [nginx, service]",
    ].join("\n"),
  );
  drawHeading(ctx, "Idempotent template pattern", 3);
  drawCode(
    ctx,
    [
      "- name: Render nginx.conf",
      "  ansible.builtin.template:",
      "    src: nginx.conf.j2",
      "    dest: /etc/nginx/nginx.conf",
      "    owner: root",
      "    group: root",
      "    mode: '0644'",
      "    validate: 'nginx -t -c %s'",
      "    backup: true",
      "  notify: Reload nginx",
    ].join("\n"),
  );
  drawHeading(ctx, "Naming and tagging conventions", 3);
  drawBullets(ctx, [
    "Role names are snake_case and singular (user, package, not users_pkg).",
    "Every task starts with a verb in the imperative: Install, Configure, Ensure.",
    "Tags use the role name plus one of {install, configure, service, security}.",
    "Handlers are prefixed by the role name to avoid cross-role collisions.",
    "All variables prefixed with the role name (nginx_port, not port).",
  ]);

  // --- 5. Collections ---
  newPage(ctx);
  drawHeading(ctx, "5. Collections and Galaxy distribution", 1);
  drawParagraph(
    ctx,
    "Group related roles and plugins into a private collection so they version together. Pin third-party collections in requirements.yml and resolve everything from a private Automation Hub or a Galaxy proxy.",
  );
  drawHeading(ctx, "collections/requirements.yml", 3);
  drawCode(
    ctx,
    [
      "---",
      "collections:",
      "  - name: ansible.posix",
      "    version: 1.6.2",
      "  - name: community.general",
      "    version: 9.5.0",
      "  - name: amazon.aws",
      "    version: 9.0.0",
      "  - name: kubernetes.core",
      "    version: 5.0.0",
      "  - name: community.crypto",
      "    version: 2.22.0",
      "  - name: acme.platform",
      "    version: 1.4.0",
      "    source: https://galaxy.example.com",
    ].join("\n"),
  );
  drawHeading(ctx, "Building a private collection", 3);
  drawCode(
    ctx,
    [
      "ansible-galaxy collection init acme.platform --init-path collections/ansible_collections",
      "# edit galaxy.yml: name, version, dependencies",
      "ansible-galaxy collection build collections/ansible_collections/acme/platform \\",
      "  --output-path dist/",
      "ansible-galaxy collection publish dist/acme-platform-1.4.0.tar.gz \\",
      "  --server galaxy_internal",
    ].join("\n"),
  );

  // --- 6. Vault ---
  newPage(ctx);
  drawHeading(ctx, "6. Secrets with Ansible Vault", 1);
  drawParagraph(
    ctx,
    "Keep secrets encrypted at rest with Ansible Vault, but never commit a vault password to the repository. Use a Vault password client script that fetches the master key from a real secret store (1Password, HashiCorp Vault, AWS Secrets Manager) at runtime.",
  );
  drawHeading(ctx, "Vault password client script", 3);
  drawCode(
    ctx,
    [
      "#!/usr/bin/env bash",
      "# vault/.vault-pass.client",
      "# Exits with the vault password on stdout.",
      "set -euo pipefail",
      "case \"${1:-default}\" in",
      "  prod)",
      "    op read 'op://Ansible/prod-vault/password'",
      "    ;;",
      "  dev|*)",
      "    op read 'op://Ansible/dev-vault/password'",
      "    ;;",
      "esac",
    ].join("\n"),
  );
  drawHeading(ctx, "ansible.cfg vault wiring", 3);
  drawCode(
    ctx,
    [
      "[defaults]",
      "vault_identity_list = dev@vault/.vault-pass.client, prod@vault/.vault-pass.client",
      "vault_password_file = vault/.vault-pass.client",
    ].join("\n"),
  );
  drawHeading(ctx, "Encrypting per-variable", 3);
  drawCode(
    ctx,
    [
      "ansible-vault encrypt_string --vault-id prod@vault/.vault-pass.client \\",
      "  --name db_password 'SuperSecretValue!'",
      "",
      "# Output goes into group_vars/prod.yml as:",
      "# db_password: !vault |",
      "#   $ANSIBLE_VAULT;1.2;AES256;prod",
      "#   3463303161393166...",
    ].join("\n"),
  );

  // --- 7. Molecule ---
  newPage(ctx);
  drawHeading(ctx, "7. Testing with Molecule", 1);
  drawParagraph(
    ctx,
    "Every role ships with at least one Molecule scenario that exercises convergence, idempotency, and a verifier step. The default driver is Podman or Docker; we also include an Amazon EC2 driver scenario for roles that touch the kernel.",
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
  drawHeading(ctx, "Idempotency assertion", 3);
  drawCode(
    ctx,
    [
      "# molecule/default/verify.yml",
      "- name: Verify nginx is healthy",
      "  hosts: all",
      "  tasks:",
      "    - name: Probe TCP 80",
      "      ansible.builtin.wait_for:",
      "        host: 127.0.0.1",
      "        port: 80",
      "        timeout: 10",
      "    - name: Check config syntax",
      "      ansible.builtin.command: nginx -t",
      "      changed_when: false",
    ].join("\n"),
  );
  drawHeading(ctx, "Local run", 3);
  drawCode(
    ctx,
    [
      "cd roles/nginx",
      "molecule test                  # full lifecycle: create, converge, idempotence, verify, destroy",
      "molecule converge              # iterate without destroy/create cycles",
      "molecule verify",
    ].join("\n"),
  );

  // --- 8. AWX / EDA ---
  newPage(ctx);
  drawHeading(ctx, "8. AWX and Event-Driven Ansible", 1);
  drawParagraph(
    ctx,
    "AWX (and Ansible Automation Platform) gives you a UI, RBAC, scheduled jobs, and surveys on top of the same playbooks. Event-Driven Ansible (EDA) reacts to webhooks, Kafka topics, or Alertmanager and triggers job templates automatically.",
  );
  drawHeading(ctx, "AWX project import (job template)", 3);
  drawCode(
    ctx,
    [
      "---",
      "# awx/project.yml (managed via the awx.awx collection)",
      "- name: Configure AWX project for ansible-control",
      "  hosts: localhost",
      "  connection: local",
      "  collections:",
      "    - awx.awx",
      "  tasks:",
      "    - awx.awx.project:",
      "        name: ansible-control",
      "        scm_type: git",
      "        scm_url: git@github.com:acme/ansible-control.git",
      "        scm_branch: main",
      "        scm_update_on_launch: true",
      "        organization: Platform",
      "        controller_host: \"{{ awx_url }}\"",
      "        controller_oauthtoken: \"{{ awx_token }}\"",
    ].join("\n"),
  );
  drawHeading(ctx, "EDA rule book", 3);
  drawCode(
    ctx,
    [
      "---",
      "- name: React to Alertmanager",
      "  hosts: all",
      "  sources:",
      "    - ansible.eda.webhook:",
      "        host: 0.0.0.0",
      "        port: 5000",
      "  rules:",
      "    - name: Restart nginx on alert",
      "      condition: event.payload.alert == \"NginxDown\"",
      "      action:",
      "        run_job_template:",
      "          name: restart-nginx",
      "          organization: Platform",
    ].join("\n"),
  );

  // --- 9. CI/CD ---
  newPage(ctx);
  drawHeading(ctx, "9. CI/CD with GitHub Actions and GitLab CI", 1);
  drawParagraph(
    ctx,
    "Every change to the control repository runs lint, syntax check, and at least one Molecule scenario in CI. The apply pipeline is gated by a manual approval and uses GitHub environments (or GitLab protected environments) to keep prod credentials off pull requests.",
  );
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
      "      - run: ansible-playbook --syntax-check playbooks/site.yml -i inventories/dev/hosts.yml",
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
  drawHeading(ctx, "pre-commit hooks", 3);
  drawCode(
    ctx,
    [
      "---",
      "# .pre-commit-config.yaml",
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

  // --- 10. Versioning & Support ---
  newPage(ctx);
  drawHeading(ctx, "10. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "The playbook follows semantic versioning. Breaking changes only ship in major versions; new optional patterns and roles ship in minor versions; doc and test improvements ship in patches.",
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
    "Bug reports: include your Ansible Core version, target OS, and the relevant play output with -vvv.",
  ]);

  // --- 11. License ---
  newPage(ctx);
  drawHeading(ctx, "11. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the source files included in this product inside your own automation projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the roles and templates as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "The full Terms of Service and Refund Policy that govern this purchase are available at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
