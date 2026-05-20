/**
 * PDF generator for "RHEL 9 CIS Hardening Playbook".
 *
 * Mined from the RHEL9-CIS Ansible role: CIS RHEL 9 benchmark sections 1-6,
 * variable model, idempotent task patterns, SELinux, crypto policies, AIDE,
 * OpenSCAP workflow, Molecule testing, and operational deployment pipeline.
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

export async function generateRhelCisHardeningPlaybookPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "RHEL 9 CIS Hardening Playbook",
    subject:
      "Production-grade Ansible automation to harden RHEL 9 fleets to CIS Level 1 and Level 2 baselines.",
    keywords: [
      "rhel",
      "rhel9",
      "cis",
      "hardening",
      "ansible",
      "selinux",
      "openscap",
      "compliance",
      "stig",
      "sre",
      "security",
    ],
    headerLeft: "RHEL 9 CIS Hardening Playbook",
  });

  drawCover(ctx, {
    title: "RHEL 9 CIS Hardening Playbook",
    subtitle: "Ansible automation for CIS Level 1 and Level 2 compliance at fleet scale",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "The CIS RHEL 9 benchmark: sections, Level 1 vs Level 2",
    "Pre-flight: inventory, role layout, variable scoping",
    "Section 1: filesystem modules, partitions, sticky bit, GPG",
    "Section 2: services and time synchronization (chrony)",
    "Section 3: network hardening (sysctl, firewalld, nftables)",
    "Section 4: logging and auditing (auditd, rsyslog, journald)",
    "Section 5.1: SSH server hardening",
    "Section 5.2: PAM, password quality, faillock",
    "Section 5.3: user accounts, umask, login.defs",
    "Section 6.1: system file permissions",
    "Section 6.2: users, groups, root path",
    "SELinux: enforcing, booleans, custom policy",
    "SETroubleshoot and audit2allow workflow",
    "Crypto policies and FIPS mode",
    "AIDE file integrity baseline",
    "Variable model: section and per-rule toggles",
    "OpenSCAP pre-remediation scan",
    "Post-remediation scan and deviations register",
    "Idempotency, Molecule testing, tag strategy",
    "Pipeline: lint, molecule, staging, canary, fleet",
    "Drift detection and scheduled scans",
    "Common pitfalls and one-line fixes",
    "Versioning, releases, and support",
    "License",
  ]);

  // 1
  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "RHEL 9 CIS Hardening Playbook is the field manual we use to bring Red Hat Enterprise Linux fleets from a stock kickstart into CIS Level 1 or Level 2 compliance with Ansible. It is for the engineer who needs to ship 500 hardened hosts before the next audit window and have the change be idempotent, reversible, and tagged.",
  );
  drawParagraph(
    ctx,
    "Every recipe is derived from the Ansible Lockdown RHEL9-CIS role and the official CIS Red Hat Enterprise Linux 9 Benchmark v1.0.0. The four design pillars are: variable-driven per-control toggles, tagged execution for partial remediation, OpenSCAP-verified before and after, and Molecule-tested on every commit.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "All six CIS sections covered: filesystems, services, network, auditing, access, file permissions.",
    "Copy-paste Ansible task blocks with correct `when:` guards, tags, and handler notifications.",
    "Per-rule and per-section toggles so you can deploy CIS-1.1.1.1 alone or the whole benchmark.",
    "SELinux, crypto policies, AIDE, and FIPS mode chapters - the controls auditors always ask about.",
    "OpenSCAP scan + report workflow with ssg-rhel9-ds.xml for pre and post-remediation evidence.",
    "Molecule scenarios (Podman + EC2 drivers), CI pipeline templates, and drift-detection runbook.",
    "Common pitfalls (Docker breaking after IP forwarding off, SSH lockout from cipher whitelist, etc.).",
    "Lifetime updates while the benchmark is maintained, delivered via /library.",
  ]);

  // 2
  newPage(ctx);
  drawHeading(ctx, "2. The CIS RHEL 9 benchmark: sections, Level 1 vs Level 2", 1);
  drawParagraph(
    ctx,
    "CIS Red Hat Enterprise Linux 9 Benchmark v1.0.0 organizes 141 controls across six sections: filesystem modules (1), services (2), network (3), logging and auditing (4), access control - SSH / PAM / users (5), and system file and group permissions (6). Each control is Level 1 (foundational, low operational impact) or Level 2 (defense in depth, requires testing).",
  );
  drawHeading(ctx, "Tag and variable mapping", 3);
  drawCode(
    ctx,
    [
      "# defaults/main.yml - section toggles",
      "rhel9cis_section1: true   # filesystems, sticky bit, GPG",
      "rhel9cis_section2: true   # services, time sync",
      "rhel9cis_section3: true   # network, sysctl, firewalld",
      "rhel9cis_section4: true   # auditd, rsyslog, journald",
      "rhel9cis_section5: true   # SSH, PAM, users, sudo",
      "rhel9cis_section6: true   # file and group permissions",
      "",
      "rhel9cis_level_1: true",
      "rhel9cis_level_2: false   # opt in after staging",
      "",
      "# per-rule toggles",
      "rhel9cis_rule_1_1_1_1: true   # disable squashfs",
      "rhel9cis_rule_3_4_2_1: true   # firewalld default zone",
      "rhel9cis_rule_5_2_16: true    # SSH PasswordAuthentication",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Level 1 is the baseline that fits almost every production host; ship it first.",
    "Level 2 includes IP-forwarding off, strict SSH ciphers, SELinux enforcing - test in staging first.",
    "Use `--tags level1-server` to filter; pair with `-l groupname` for partial fleet rollout.",
    "Each rule has its own `rhel9cis_rule_X_Y_Z` toggle - granular control without forking the role.",
    "Track the benchmark version (v1.0.0), role version, and your deviations register in git.",
  ]);

  // 3
  newPage(ctx);
  drawHeading(ctx, "3. Pre-flight: inventory, role layout, variable scoping", 1);
  drawCode(
    ctx,
    [
      "# inventories/prod/hosts.yml",
      "all:",
      "  vars:",
      "    ansible_user: sysadmin",
      "    ansible_become: true",
      "  children:",
      "    rhel9_cis_level1:",
      "      hosts:",
      "        web01.prod.internal: {}",
      "        web02.prod.internal: {}",
      "      vars:",
      "        rhel9cis_level_1: true",
      "        rhel9cis_level_2: false",
      "    rhel9_cis_level2:",
      "      hosts: { db01.prod.internal: {} }",
      "      vars:",
      "        rhel9cis_level_1: true",
      "        rhel9cis_level_2: true",
      "        rhel9cis_selinux_disable: false",
      "        rhel9cis_rule_3_1_2: false   # allow IP forwarding (CNI)",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# site.yml",
      "- name: RHEL 9 CIS Hardening",
      "  hosts: all",
      "  become: true",
      "  pre_tasks:",
      "    - name: Assert RHEL 9",
      "      ansible.builtin.assert:",
      "        that:",
      "          - ansible_distribution in ['RedHat', 'AlmaLinux', 'Rocky']",
      "          - ansible_distribution_major_version is version_compare('9', '==')",
      "  roles:",
      "    - role: RHEL9-CIS",
      "      vars:",
      "        skip_reboot: true   # reboot in change windows",
    ].join("\n"),
  );
  drawHeading(ctx, "Dry-run before any production apply", 3);
  drawCode(
    ctx,
    [
      "ansible-playbook -i inventories/prod/hosts.yml \\",
      "  -l rhel9_cis_level1 --tags level1-server \\",
      "  --check --diff site.yml | tee check.log",
      "",
      "ansible-playbook --syntax-check site.yml",
      "ansible-lint -c .ansible-lint site.yml",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Variable precedence: --extra-vars > host_vars > group_vars/group > group_vars/all > defaults.",
    "Organize inventory by compliance tier (level1, level2, exceptions) so rollback is `-l <tier>`.",
    "Check mode catches most state changes; kernel module removals and GRUB edits do NOT show up.",
    "`become: true` at play level, never at task level - faster and cleaner audit logs.",
    "Always pair `--tags` with `-l` so a typo does not roll out a partial change cluster-wide.",
  ]);

  // 4
  newPage(ctx);
  drawHeading(ctx, "4. Section 1: filesystem modules, partitions, sticky bit, GPG", 1);
  drawCode(
    ctx,
    [
      "# 1.1.1.1 disable squashfs",
      "- name: \"1.1.1.1 | PATCH | Disable squashfs\"",
      "  block:",
      "    - ansible.builtin.lineinfile:",
      "        path: /etc/modprobe.d/CIS.conf",
      "        regexp: \"^install squashfs\"",
      "        line: \"install squashfs /bin/true\"",
      "        create: true",
      "        mode: '0600'",
      "    - community.general.modprobe: { name: squashfs, state: absent }",
      "      when: not system_is_container",
      "  when: rhel9cis_rule_1_1_1_1",
      "  tags: [level2-server, patch, rule_1.1.1.1]",
      "",
      "# 1.1.8.1 sticky bit on world-writable dirs",
      "- name: \"1.1.8.1 | PATCH | Sticky bit on world-writable dirs\"",
      "  ansible.builtin.shell: |",
      "    df --local -P | awk 'NR>1 {print $6}' | \\",
      "    xargs -I {} find {} -xdev -type d -perm -0002 ! -perm -1000 \\",
      "      -exec chmod a+t {} \\;",
      "  changed_when: true",
      "  when: rhel9cis_rule_1_1_8_1",
      "  tags: [level1-server, patch]",
      "",
      "# 1.6.1.2 enforce gpgcheck in every repo",
      "- name: \"1.6.1.2 | PATCH | gpgcheck=1 everywhere\"",
      "  ansible.builtin.shell: |",
      "    find /etc/yum.repos.d -name '*.repo' \\",
      "      -exec sed -i 's/gpgcheck=0/gpgcheck=1/g' {} \\;",
      "  changed_when: true",
      "  when: rhel9cis_rule_1_6_1_2",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Disable squashfs, udf, jffs2, cramfs, vfat unless you actually mount them.",
    "Partitions (/tmp, /var, /var/tmp, /var/log, /var/log/audit, /home) must exist at provisioning time.",
    "Mount options nodev, nosuid, noexec on /tmp and /var/tmp; nodev on /home.",
    "Sticky bit fix can be slow on large filesystems; bound it with `-xdev` and per-mount loops.",
    "GRUB password is high-friction - confirm console access plan before enabling.",
  ]);

  // 5
  newPage(ctx);
  drawHeading(ctx, "5. Section 2: services and time synchronization (chrony)", 1);
  drawCode(
    ctx,
    [
      "# 2.2.x remove a long list of legacy services",
      "- name: \"2.2 | PATCH | Remove unnecessary packages\"",
      "  ansible.builtin.package:",
      "    name: \"{{ item.name }}\"",
      "    state: absent",
      "  loop:",
      "    - { name: xorg-x11-server-common, when: not rhel9cis_gui }",
      "    - { name: avahi,                  when: not rhel9cis_avahi_server }",
      "    - { name: cups,                   when: not rhel9cis_cups_server }",
      "    - { name: dhcp-server,            when: not rhel9cis_dhcp_server }",
      "    - { name: bind,                   when: not rhel9cis_dns_server }",
      "    - { name: vsftpd,                 when: not rhel9cis_vsftpd_server }",
      "    - { name: tftp-server,            when: not rhel9cis_tftp_server }",
      "    - { name: nfs-utils,              when: not rhel9cis_nfs_server }",
      "    - { name: rsync-daemon,           when: not rhel9cis_rsync_server }",
      "    - { name: telnet-server,          when: true }",
      "  when: item.when and item.name in ansible_facts.packages",
      "",
      "# 2.3 enable chronyd",
      "- name: \"2.3.1 | PATCH | chrony installed and enabled\"",
      "  ansible.builtin.package: { name: chrony, state: present }",
      "- ansible.builtin.systemd:",
      "    name: chronyd",
      "    state: started",
      "    enabled: true",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# /etc/chrony.conf - minimal hardened",
      "pool 2.rhel.pool.ntp.org iburst maxpoll 10",
      "driftfile /var/lib/chrony/drift",
      "makestep 1.0 3",
      "rtcsync",
      "leapsectz right/UTC",
      "logdir /var/log/chrony",
      "# do NOT listen on the network unless this host is an NTP server:",
      "# listen 0.0.0.0:123",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always set `rhel9cis_<service>_server: true` overrides BEFORE running, never after package removal.",
    "Mask removed services with `systemctl mask` so a misconfigured RPM cannot revive them.",
    "Chrony, not ntpd: ntp package was removed in RHEL 8+; the CIS control name is unchanged.",
    "Time drift is an audit finding: alert on `chronyc tracking | grep 'Stratum'` > 4.",
  ]);

  // 6
  newPage(ctx);
  drawHeading(ctx, "6. Section 3: network hardening (sysctl, firewalld, nftables)", 1);
  drawCode(
    ctx,
    [
      "# /etc/sysctl.d/60-netipv4.conf",
      "net.ipv4.ip_forward = 0",
      "net.ipv4.conf.all.send_redirects = 0",
      "net.ipv4.conf.default.send_redirects = 0",
      "net.ipv4.conf.all.accept_source_route = 0",
      "net.ipv4.conf.all.accept_redirects = 0",
      "net.ipv4.conf.all.secure_redirects = 0",
      "net.ipv4.conf.all.log_martians = 1",
      "net.ipv4.icmp_echo_ignore_broadcasts = 1",
      "net.ipv4.icmp_ignore_bogus_error_responses = 1",
      "net.ipv4.conf.all.rp_filter = 1",
      "net.ipv4.tcp_syncookies = 1",
      "",
      "# /etc/sysctl.d/60-netipv6.conf",
      "net.ipv6.conf.all.accept_ra = 0",
      "net.ipv6.conf.all.accept_redirects = 0",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "- name: \"3.4 | PATCH | firewalld default zone drop\"",
      "  ansible.posix.firewalld:",
      "    zone: drop",
      "    state: enabled",
      "    permanent: true",
      "    immediate: true",
      "",
      "- name: \"3.4 | PATCH | Allow SSH from admin network only\"",
      "  ansible.posix.firewalld:",
      "    rich_rule: 'rule family=ipv4 source address=10.0.0.0/24 service name=ssh accept'",
      "    permanent: true",
      "    state: enabled",
      "    immediate: true",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "IP forwarding OFF breaks container CNIs (Calico, Cilium, Flannel) - keep ON on K8s nodes.",
    "Source routing, ICMP redirects, broadcast pings - all hard OFF on every host.",
    "Use firewalld rich rules to scope SSH to admin CIDRs; rely on nftables under the hood.",
    "Apply with `sysctl --system`; verify with `sysctl -a | grep <key>`.",
    "Wireless interfaces disabled with `nmcli radio wifi off` and rfkill block all.",
  ]);

  // 7
  newPage(ctx);
  drawHeading(ctx, "7. Section 4: logging and auditing (auditd, rsyslog, journald)", 1);
  drawCode(
    ctx,
    [
      "- name: \"4.1.1.1 | PATCH | Install audit and audit-libs\"",
      "  ansible.builtin.package:",
      "    name: [audit, audit-libs]",
      "    state: present",
      "",
      "- name: \"4.1.1.2 | PATCH | Enable auditd\"",
      "  ansible.builtin.systemd:",
      "    name: auditd",
      "    state: started",
      "    enabled: true",
      "",
      "- name: \"4.1.1.4 | PATCH | audit=1 in GRUB kernel cmdline\"",
      "  ansible.builtin.lineinfile:",
      "    path: /etc/default/grub",
      "    regexp: '^GRUB_CMDLINE_LINUX='",
      "    line: 'GRUB_CMDLINE_LINUX=\"audit=1 audit_backlog_limit=8192\"'",
      "  notify: Grub2cfg",
      "",
      "- name: \"4.1.3 | PATCH | Deploy auditd rules\"",
      "  ansible.builtin.copy:",
      "    src: audit/99_auditd.rules",
      "    dest: /etc/audit/rules.d/99_auditd.rules",
      "    mode: '0640'",
      "  notify: Restart auditd",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# /etc/audit/rules.d/99_auditd.rules - high-value subset",
      "-w /etc/sudoers     -p wa -k scope",
      "-w /etc/sudoers.d/  -p wa -k scope",
      "-w /var/log/sudo.log -p wa -k actions",
      "-w /etc/group       -p wa -k identity",
      "-w /etc/passwd      -p wa -k identity",
      "-w /etc/shadow      -p wa -k identity",
      "-a always,exit -F arch=b64 -S execve -C uid!=euid -F euid=0 -k setuid",
      "-a always,exit -F arch=b64 -S unlink -S unlinkat -S rename -S renameat -F auid>=1000 -k delete",
      "-e 2   # make rules immutable; reboot to change",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "audit_backlog_limit=8192 minimum; under load auditd will drop events otherwise.",
    "Ship audit logs off-host to rsyslog server or Splunk; local logs are evidence-destructible.",
    "Journald: storage=persistent in /etc/systemd/journald.conf; SystemMaxUse=2G.",
    "rsyslog: forward to central log server with `*.* @@logs.internal:514` and TLS.",
    "After loading new rules: `augenrules --load` then `auditctl -s` to confirm enabled=1.",
  ]);

  // 8
  newPage(ctx);
  drawHeading(ctx, "8. Section 5.1: SSH server hardening", 1);
  drawCode(
    ctx,
    [
      "# /etc/ssh/sshd_config - CIS-aligned",
      "Protocol 2",
      "Port 22",
      "AddressFamily inet",
      "LogLevel VERBOSE",
      "PermitRootLogin no",
      "PermitEmptyPasswords no",
      "PermitUserEnvironment no",
      "PasswordAuthentication no",
      "ChallengeResponseAuthentication no",
      "KerberosAuthentication no",
      "GSSAPIAuthentication no",
      "X11Forwarding no",
      "AllowTcpForwarding no",
      "ClientAliveInterval 300",
      "ClientAliveCountMax 0",
      "LoginGraceTime 60",
      "MaxAuthTries 4",
      "MaxSessions 4",
      "MaxStartups 10:30:60",
      "Banner /etc/issue.net",
      "UsePAM yes",
      "",
      "# strong crypto only (matches OpenSSH 8.x and crypto policy DEFAULT)",
      "Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com",
      "MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com",
      "KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512",
      "HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256",
      "",
      "AllowGroups wheel sudoers",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "- name: \"5.2 | PATCH | Deploy sshd_config and validate\"",
      "  ansible.builtin.template:",
      "    src: etc/ssh/sshd_config.j2",
      "    dest: /etc/ssh/sshd_config",
      "    owner: root",
      "    group: root",
      "    mode: '0600'",
      "    validate: '/usr/sbin/sshd -t -f %s'",
      "  notify: Restart sshd",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "ALWAYS keep a second authenticated session open while applying SSH changes - lockout is real.",
    "Use `validate: 'sshd -t -f %s'` so a malformed template never gets installed.",
    "Cipher whitelist must match what your clients support; old git/Jenkins/RHEL 6 boxes break.",
    "ClientAliveInterval + CountMax=0 disconnects idle sessions; pair with tmux/screen for ops.",
    "AllowGroups wheel sudoers is safer than AllowUsers - groups stay in sync with IPA/LDAP.",
  ]);

  // 9
  newPage(ctx);
  drawHeading(ctx, "9. Section 5.2: PAM, password quality, faillock", 1);
  drawCode(
    ctx,
    [
      "# /etc/security/pwquality.conf",
      "minlen = 14",
      "minclass = 4",
      "dcredit = -1",
      "ucredit = -1",
      "lcredit = -1",
      "ocredit = -1",
      "maxrepeat = 3",
      "maxclassrepeat = 4",
      "gecoscheck = 1",
      "dictcheck = 1",
      "enforce_for_root",
      "",
      "# /etc/security/faillock.conf",
      "deny = 5",
      "fail_interval = 900",
      "unlock_time = 900",
      "even_deny_root",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# /etc/pam.d/system-auth - lockout + history",
      "auth     required      pam_faillock.so preauth silent",
      "auth     [success=1 default=bad] pam_unix.so",
      "auth     [default=die] pam_faillock.so authfail",
      "auth     sufficient    pam_faillock.so authsucc",
      "",
      "password requisite pam_pwquality.so try_first_pass local_users_only retry=3",
      "password required  pam_pwhistory.so remember=24 use_authtok",
      "password sufficient pam_unix.so sha512 shadow use_authtok",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "pam_pwhistory remember=24 stops password reuse for 24 cycles - matches CIS Level 2.",
    "faillock deny=5 with unlock_time=900 locks after 5 failures for 15 minutes.",
    "even_deny_root applies the lockout to root; have a console plan or this WILL bite you.",
    "Use `authselect select sssd with-faillock` once, then edit profiles - never hand-edit /etc/pam.d/.",
    "Test pwquality: `echo 'weakpass' | pwscore` returns 0 = rejected.",
  ]);

  // 10
  newPage(ctx);
  drawHeading(ctx, "10. Section 5.3: user accounts, umask, login.defs", 1);
  drawCode(
    ctx,
    [
      "# /etc/login.defs",
      "PASS_MAX_DAYS   365",
      "PASS_MIN_DAYS   1",
      "PASS_WARN_AGE   7",
      "UMASK           027",
      "ENCRYPT_METHOD  SHA512",
      "FAIL_DELAY      4",
      "FAILLOG_ENAB    yes",
      "",
      "# /etc/profile.d/cis-umask.sh",
      "if [ \"$(id -u)\" -ge 1000 ]; then",
      "    umask 027",
      "fi",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "- name: \"5.5.1.5 | PATCH | Lock inactive accounts after 30 days\"",
      "  ansible.builtin.shell: useradd -D -f 30",
      "  changed_when: true",
      "",
      "- name: \"5.5.2 | PATCH | Lock system accounts\"",
      "  ansible.builtin.user:",
      "    name: \"{{ item }}\"",
      "    password_lock: true",
      "    shell: /sbin/nologin",
      "  loop:",
      "    - daemon",
      "    - bin",
      "    - sync",
      "    - shutdown",
      "    - halt",
      "    - mail",
      "    - operator",
      "    - games",
      "    - ftp",
      "    - nobody",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "UMASK 027 by default; users override per-shell if they need world-readable artifacts.",
    "PASS_MAX_DAYS 365 = annual rotation; tighten only if your IdP enforces shorter.",
    "INACTIVE=30 + lock system accounts removes the second-most-common foothold (stale local users).",
    "Audit duplicates: `awk -F: '{print $3}' /etc/passwd | sort | uniq -d` MUST return empty.",
    "Keep one local emergency account (locked, password in vault) for IdP-outage recovery.",
  ]);

  // 11
  newPage(ctx);
  drawHeading(ctx, "11. Section 6.1: system file permissions", 1);
  drawCode(
    ctx,
    [
      "- name: \"6.1.x | PATCH | Enforce canonical permissions on system files\"",
      "  ansible.builtin.file:",
      "    path: \"{{ item.path }}\"",
      "    owner: \"{{ item.owner }}\"",
      "    group: \"{{ item.group }}\"",
      "    mode: \"{{ item.mode }}\"",
      "  loop:",
      "    - { path: /etc/passwd,   owner: root, group: root,   mode: '0644' }",
      "    - { path: /etc/passwd-,  owner: root, group: root,   mode: '0600' }",
      "    - { path: /etc/group,    owner: root, group: root,   mode: '0644' }",
      "    - { path: /etc/group-,   owner: root, group: root,   mode: '0600' }",
      "    - { path: /etc/shadow,   owner: root, group: root,   mode: '0000' }",
      "    - { path: /etc/shadow-,  owner: root, group: root,   mode: '0000' }",
      "    - { path: /etc/gshadow,  owner: root, group: root,   mode: '0000' }",
      "    - { path: /etc/gshadow-, owner: root, group: root,   mode: '0000' }",
      "    - { path: /boot/grub2/grub.cfg, owner: root, group: root, mode: '0600' }",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Find ungrouped, unowned, and world-writable files (audit only)",
      "find / -xdev \\( -nouser -o -nogroup \\) -exec ls -ld {} \\;",
      "find / -xdev -type f -perm -0002 -print",
      "find / -xdev -type d -perm -0002 ! -perm -1000 -print",
      "find / -xdev -type f -perm -4000 -print  # SUID inventory",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "/etc/shadow mode 0000 is intentional - root reads via setuid system calls.",
    "/boot/grub2/grub.cfg 0600 prevents reading kernel boot parameters by non-root users.",
    "SUID inventory should be a known fixed list; alert on any new SUID binary.",
    "Run the find audits weekly via cron; pipe diffs into the SIEM as anomaly events.",
  ]);

  // 12
  newPage(ctx);
  drawHeading(ctx, "12. Section 6.2: users, groups, root path", 1);
  drawCode(
    ctx,
    [
      "# 6.2.1 ensure root PATH has no empty entries and is owned by root",
      "- name: \"6.2.1 | AUDIT | Inspect root PATH\"",
      "  ansible.builtin.shell: |",
      "    sudo -Hiu root env | awk -F= '/^PATH=/ {print $2}' | tr ':' '\\n' \\",
      "      | grep -E '^$|^\\.' && exit 1 || exit 0",
      "  changed_when: false",
      "  failed_when: false",
      "",
      "# 6.2.x detect duplicate UIDs/GIDs and orphan home dirs",
      "- name: \"6.2 | AUDIT | Duplicate UIDs\"",
      "  ansible.builtin.shell: |",
      "    awk -F: '{print $3}' /etc/passwd | sort | uniq -d",
      "  register: dup_uids",
      "  changed_when: false",
      "  failed_when: dup_uids.stdout != ''",
      "",
      "- name: \"6.2 | AUDIT | Orphan home dirs (no matching /etc/passwd entry)\"",
      "  ansible.builtin.shell: |",
      "    for h in /home/*; do",
      "      u=$(basename \"$h\")",
      "      getent passwd \"$u\" >/dev/null || echo \"orphan: $h\"",
      "    done",
      "  changed_when: false",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Empty PATH entries (::) and '.' in root PATH are immediate privilege-escalation vectors.",
    "Duplicate UIDs/GIDs let users impersonate each other to the kernel - fix at IdP source.",
    "Orphan home dirs are forensics gold but compliance debt; archive then remove.",
    "Group membership audit: `getent group wheel`, `getent group sudoers` cross-checked vs IdP.",
  ]);

  // 13
  newPage(ctx);
  drawHeading(ctx, "13. SELinux: enforcing, booleans, custom policy", 1);
  drawCode(
    ctx,
    [
      "- name: \"SELinux | PATCH | enforce targeted policy\"",
      "  ansible.posix.selinux:",
      "    policy: targeted",
      "    state: enforcing",
      "",
      "- name: \"SELinux | PATCH | enable booleans for nginx\"",
      "  ansible.posix.seboolean:",
      "    name: \"{{ item }}\"",
      "    state: true",
      "    persistent: true",
      "  loop:",
      "    - httpd_can_network_connect",
      "    - httpd_can_network_relay",
      "",
      "- name: \"SELinux | PATCH | label custom port for app\"",
      "  community.general.seport:",
      "    ports: 8443",
      "    proto: tcp",
      "    setype: http_port_t",
      "    state: present",
      "",
      "- name: \"SELinux | PATCH | label app directory\"",
      "  community.general.sefcontext:",
      "    target: '/opt/app(/.*)?'",
      "    setype: httpd_sys_content_t",
      "    state: present",
      "  notify: Restorecon app",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Targeted policy is the only supported choice on RHEL 9; mls is not for general workloads.",
    "Use `semanage` (Ansible: seboolean, seport, sefcontext) - never `chcon` for persistent labels.",
    "Run `restorecon -Rv /path` after every sefcontext change or labels revert on relabel.",
    "Disable SELinux only on legacy hosts that genuinely cannot be remediated - and document why.",
  ]);

  // 14
  newPage(ctx);
  drawHeading(ctx, "14. SETroubleshoot and audit2allow workflow", 1);
  drawCode(
    ctx,
    [
      "# 1) reproduce the denial",
      "ausearch -m AVC,USER_AVC -ts recent | tail -50",
      "",
      "# 2) get a human-readable explanation",
      "sealert -a /var/log/audit/audit.log | less",
      "",
      "# 3) generate a local policy module (NAMING convention: my-<service>)",
      "ausearch -m AVC -ts recent | audit2allow -M my-nginx-upload",
      "",
      "# 4) review the .te file BEFORE loading",
      "cat my-nginx-upload.te",
      "",
      "# 5) install the module",
      "semodule -i my-nginx-upload.pp",
      "",
      "# 6) confirm",
      "semodule -l | grep my-nginx-upload",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "audit2allow is a starting point; never ship its output without reading the .te file.",
    "Prefer a boolean or sefcontext fix over a custom module - upgrades will not break them.",
    "Tag every custom module with `my-<service>` so cleanup is one grep away.",
    "Run setroubleshoot-server on staging only; the GUI sealert daemon is noisy on prod.",
  ]);

  // 15
  newPage(ctx);
  drawHeading(ctx, "15. Crypto policies and FIPS mode", 1);
  drawCode(
    ctx,
    [
      "# show current",
      "update-crypto-policies --show",
      "",
      "# baseline (DEFAULT removes SHA1, weak ciphers, RSA-1024)",
      "update-crypto-policies --set DEFAULT",
      "",
      "# stricter: FUTURE policy",
      "update-crypto-policies --set FUTURE",
      "",
      "# scoped sub-policy: DEFAULT with SHA1 removed for signatures",
      "update-crypto-policies --set DEFAULT:NO-SHA1",
      "",
      "# FIPS 140-3 mode (NIST-approved cryptography only)",
      "fips-mode-setup --enable",
      "reboot",
      "fips-mode-setup --check     # FIPS mode is enabled.",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Crypto policies apply globally to OpenSSH, OpenSSL, GnuTLS, libssh, NSS - one knob.",
    "FUTURE is the safer Level 2 default; FIPS is a separate, regulatory mode (FedRAMP, ITAR).",
    "FIPS mode requires reboot and re-validation of every TLS-consuming app; test in staging.",
    "After NO-SHA1, old git remotes (CentOS 7 era) stop working - inventory before flipping.",
  ]);

  // 16
  newPage(ctx);
  drawHeading(ctx, "16. AIDE file integrity baseline", 1);
  drawCode(
    ctx,
    [
      "- name: \"AIDE | PATCH | Install AIDE\"",
      "  ansible.builtin.package: { name: aide, state: present }",
      "",
      "- name: \"AIDE | PATCH | Initialize database\"",
      "  ansible.builtin.shell: |",
      "    aide --init",
      "    mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz",
      "  args: { creates: /var/lib/aide/aide.db.gz }",
      "",
      "- name: \"AIDE | PATCH | Nightly check via systemd timer\"",
      "  ansible.builtin.copy:",
      "    dest: /etc/systemd/system/aide-check.service",
      "    mode: '0644'",
      "    content: |",
      "      [Unit]",
      "      Description=AIDE integrity check",
      "      [Service]",
      "      Type=oneshot",
      "      ExecStart=/usr/sbin/aide --check",
      "",
      "- ansible.builtin.copy:",
      "    dest: /etc/systemd/system/aide-check.timer",
      "    mode: '0644'",
      "    content: |",
      "      [Unit]",
      "      Description=Run AIDE check nightly",
      "      [Timer]",
      "      OnCalendar=*-*-* 03:30:00",
      "      Persistent=true",
      "      [Install]",
      "      WantedBy=timers.target",
      "",
      "- ansible.builtin.systemd:",
      "    name: aide-check.timer",
      "    enabled: true",
      "    state: started",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Initialize AIDE after the full CIS run - otherwise every remediation is a 'change' on first check.",
    "Ship aide.db.gz off-host every night; on-host integrity DB is not an audit-defensible source.",
    "Tune /etc/aide.conf to exclude /var/log, /var/lib/sss/db, /var/cache/yum - they change constantly.",
    "Pipe AIDE output to the SIEM with a unique source so noise can be tuned per host class.",
  ]);

  // 17
  newPage(ctx);
  drawHeading(ctx, "17. Variable model: section and per-rule toggles", 1);
  drawCode(
    ctx,
    [
      "# group_vars/rhel9_cis_exceptions/hardening.yml",
      "rhel9cis_rule_2_2_5: false       # keep bind (DNS server tier)",
      "rhel9cis_rule_3_1_2: false       # allow IP forwarding (K8s nodes)",
      "rhel9cis_rule_5_2_16: false      # allow PasswordAuthentication (legacy ops)",
      "rhel9cis_rule_1_8_1: false       # skip MOTD (automation parses motd)",
      "",
      "rhel9cis_selinux_disable: false",
      "rhel9cis_rule_4_1_1_1: true      # enforce auditd",
      "",
      "rhel9cis_sshd:",
      "  allowusers: \"sysadmin deploy monitoring\"",
      "  allowgroups: \"wheel sudoers\"",
      "  denyusers: \"root bin daemon\"",
      "  port: 2222",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Toggle granularity: section -> level -> per-rule. Always disable at the deepest level.",
    "Every disabled rule MUST have a one-line comment with the deviation ID (e.g. DEV-2025-014).",
    "Track exceptions in a YAML deviations register that doubles as the audit evidence.",
    "Promote exceptions from per-host to per-group only after 2 weeks of stability.",
  ]);

  // 18
  newPage(ctx);
  drawHeading(ctx, "18. OpenSCAP pre-remediation scan", 1);
  drawCode(
    ctx,
    [
      "dnf install -y openscap-scanner scap-security-guide",
      "",
      "# list available profiles",
      "oscap info /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml",
      "",
      "# scan against CIS Level 2 profile",
      "oscap xccdf eval \\",
      "  --profile xccdf_org.ssgproject.content_profile_cis \\",
      "  --results-arf /var/tmp/scan-pre.xml \\",
      "  --report /var/tmp/scan-pre.html \\",
      "  /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml",
      "",
      "# parse pass/fail counts",
      "oscap xccdf generate report /var/tmp/scan-pre.xml > /var/tmp/scan-pre.html",
      "grep -oE 'notchecked=\"[0-9]+\"' /var/tmp/scan-pre.xml",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Run the pre-scan into a versioned bucket (s3://compliance/rhel9/$host/$YYYYMMDD/).",
    "Use `--profile cis` for Level 1, `--profile cis_workstation_l2` for Level 2 desktops.",
    "Capture both ARF (machine) and HTML (human) outputs - auditors want both.",
    "Pre-scan is mandatory evidence that the system was non-compliant before remediation.",
  ]);

  // 19
  newPage(ctx);
  drawHeading(ctx, "19. Post-remediation scan and deviations register", 1);
  drawCode(
    ctx,
    [
      "# rerun the exact same profile after the playbook",
      "oscap xccdf eval \\",
      "  --profile xccdf_org.ssgproject.content_profile_cis \\",
      "  --results-arf /var/tmp/scan-post.xml \\",
      "  --report /var/tmp/scan-post.html \\",
      "  /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml",
      "",
      "# diff to find new pass/fail",
      "oscap xccdf generate report /var/tmp/scan-post.xml > /var/tmp/scan-post.html",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# deviations/rhel9-cis-deviations.yml",
      "deviations:",
      "  - id: DEV-2026-014",
      "    rule: xccdf_org.ssgproject.content_rule_sysctl_net_ipv4_ip_forward",
      "    host_group: rhel9_k8s_nodes",
      "    reason: \"Container CNI requires kernel IP forwarding\"",
      "    approved_by: security-team",
      "    review_by: \"2026-12-31\"",
      "  - id: DEV-2026-015",
      "    rule: xccdf_org.ssgproject.content_rule_sshd_disable_user_known_hosts",
      "    host_group: jump_hosts",
      "    reason: \"Operators need .ssh/known_hosts for bastion fan-out\"",
      "    approved_by: cto",
      "    review_by: \"2026-09-30\"",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Every fail in scan-post.xml MUST appear in the deviations register or it is a finding.",
    "Review deviations quarterly; auto-expire entries with review_by in the past.",
    "Run scans as a CronJob/systemd-timer and ship results to S3 with object-lock for 7 years.",
    "Use `oscap-anaconda-addon` at install time to ship hosts pre-hardened.",
  ]);

  // 20
  newPage(ctx);
  drawHeading(ctx, "20. Idempotency, Molecule testing, tag strategy", 1);
  drawCode(
    ctx,
    [
      "# molecule/default/molecule.yml",
      "dependency: { name: galaxy }",
      "driver: { name: podman }",
      "platforms:",
      "  - name: rhel9-test",
      "    image: registry.access.redhat.com/ubi9/ubi-init",
      "    pre_build_image: true",
      "    privileged: true",
      "    command: /usr/sbin/init",
      "provisioner:",
      "  name: ansible",
      "  inventory:",
      "    group_vars:",
      "      all:",
      "        rhel9cis_level_1: true",
      "        rhel9cis_level_2: false",
      "verifier: { name: ansible }",
      "scenario:",
      "  test_sequence:",
      "    - dependency",
      "    - syntax",
      "    - create",
      "    - converge",
      "    - idempotence",
      "    - verify",
      "    - destroy",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "molecule test runs converge twice; the second run MUST report `changed=0`.",
    "Use `tags: [level1-server, patch, rule_X.Y.Z]` on every task - enables granular CI runs.",
    "Audit-only tasks get `tags: [audit, never]` so they run only on explicit `--tags audit`.",
    "Run Molecule on every PR against both Podman (fast) and EC2 (real kernel modules) drivers.",
  ]);

  // 21
  newPage(ctx);
  drawHeading(ctx, "21. Pipeline: lint, molecule, staging, canary, fleet", 1);
  drawCode(
    ctx,
    [
      "# .github/workflows/cis.yml",
      "name: rhel9-cis",
      "on: [pull_request, push]",
      "jobs:",
      "  lint:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - run: pip install ansible-lint yamllint",
      "      - run: yamllint .",
      "      - run: ansible-lint",
      "  molecule:",
      "    needs: lint",
      "    runs-on: ubuntu-latest",
      "    strategy:",
      "      matrix:",
      "        distro: [ubi9, almalinux9, rockylinux9]",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - run: pip install molecule molecule-plugins[podman] ansible-core",
      "      - run: molecule test -s default",
      "        env: { MOLECULE_DISTRO: \"${{ matrix.distro }}\" }",
      "  staging:",
      "    needs: molecule",
      "    if: github.ref == 'refs/heads/main'",
      "    runs-on: [self-hosted, awx-runner]",
      "    steps:",
      "      - run: |",
      "          ansible-playbook -i inventories/staging/hosts.yml \\",
      "            -l rhel9_cis_level1 --tags level1-server site.yml",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pipeline gates: lint -> molecule -> staging -> canary (1 host) -> 10% -> 100%.",
    "Each gate runs the OpenSCAP scan and uploads ARF + HTML to S3 as evidence.",
    "Canary host stays on the new policy for 24h; alert on `chronyc tracking`, sshd up, sudo works.",
    "Roll back by reverting the role version - inventory pins to a Galaxy version, never `main`.",
  ]);

  // 22
  newPage(ctx);
  drawHeading(ctx, "22. Drift detection and scheduled scans", 1);
  drawCode(
    ctx,
    [
      "# /etc/systemd/system/cis-scan.service",
      "[Unit]",
      "Description=Daily CIS scan and upload",
      "[Service]",
      "Type=oneshot",
      "ExecStart=/usr/local/bin/cis-scan.sh",
      "",
      "# /etc/systemd/system/cis-scan.timer",
      "[Unit]",
      "Description=Run CIS scan daily",
      "[Timer]",
      "OnCalendar=*-*-* 02:00:00",
      "RandomizedDelaySec=30min",
      "Persistent=true",
      "[Install]",
      "WantedBy=timers.target",
      "",
      "# /usr/local/bin/cis-scan.sh",
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      "STAMP=$(date +%Y%m%d-%H%M%S)",
      "OUT=/var/log/cis/${STAMP}",
      "mkdir -p \"$OUT\"",
      "oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis \\",
      "  --results-arf \"$OUT/scan.xml\" \\",
      "  --report \"$OUT/scan.html\" \\",
      "  /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml || true",
      "aws s3 cp \"$OUT/\" \"s3://compliance/rhel9/$(hostname)/${STAMP}/\" --recursive",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Daily scans plus a weekly diff alert catch drift before quarterly audit cycles.",
    "RandomizedDelaySec=30min spreads load across the fleet - your S3 endpoint will thank you.",
    "Alert on any rule that flips from pass to fail between scans - that is the drift.",
    "Keep 13 months of scans in S3 Glacier - cheap insurance against retroactive audit asks.",
  ]);

  // 23
  newPage(ctx);
  drawHeading(ctx, "23. Common pitfalls and one-line fixes", 1);
  drawBullets(ctx, [
    "Docker / Podman containers stop networking after CIS-3.1.2 (IP forwarding off): set `rhel9cis_rule_3_1_2: false` on container hosts.",
    "SSH lockout after CIS-5.2 (cipher whitelist): keep a console session open; pre-test ciphers with `ssh -Q cipher`.",
    "Chrony stops syncing after CIS-2.3.2 template overwrites custom pools: move custom pools to `rhel9cis_time_pool` var.",
    "Auditd drops events under load: increase `audit_backlog_limit=8192` in GRUB cmdline.",
    "SELinux denies app after relabel: `restorecon -Rv /opt/app` then `ausearch -m AVC -ts recent`.",
    "GRUB password locks single-user mode: keep `vault_grub_superuser_passwd` in 1Password.",
    "AIDE reports thousands of changes on first run after CIS: rebuild DB AFTER full remediation.",
    "Faillock locks root: `faillock --user root --reset` from console, then audit pam.d.",
    "/var/log/audit fills disk: separate `/var/log/audit` partition with 5+ GB.",
    "OpenSCAP scan reports `notchecked` for rules: install `scap-security-guide` >= 0.1.66.",
  ]);

  // 24
  newPage(ctx);
  drawHeading(ctx, "24. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks CIS Red Hat Enterprise Linux 9 Benchmark v1.0.0 and v2.0.0 once published. New releases ship within 30 days of each benchmark revision and are tagged against the Ansible Lockdown RHEL9-CIS role version they map to.",
  );
  drawBullets(ctx, [
    "Pin the role: `roles/RHEL9-CIS, version: 1.4.0` in requirements.yml - never `main`.",
    "Read the CHANGELOG before bumping; CIS revisions can rename rule IDs.",
    "Sign in to https://www.copypastelearn.com/library to mint a fresh download link.",
    "Support: support@copypastelearn.com (one business day). Security: security@copypastelearn.com.",
  ]);

  // 25
  newPage(ctx);
  drawHeading(ctx, "25. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the playbooks and templates included in this product inside your own infrastructure projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the playbooks and templates as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "The Ansible Lockdown RHEL9-CIS role is MIT-licensed; the CIS RHEL 9 Benchmark is published by the Center for Internet Security under their own terms - refer to https://www.cisecurity.org for compliance details. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
