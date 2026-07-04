---
title: "Linux Networking for DevOps"
slug: "linux-networking-devops-guide"
date: "2026-02-06"
category: "DevOps"
tags: ["Linux", "Networking", "DevOps", "System Administration", "Troubleshooting"]
excerpt: "Essential Linux networking commands for DevOps. IP addressing, DNS, firewall, routing, packet capture, and troubleshooting connectivity."
description: "Linux networking for DevOps. IP configuration, DNS, firewall rules, routing tables, packet capture with tcpdump, and troubleshooting."
author: "Luca Berton"
---

Every DevOps engineer debugs network issues, and the first question during an incident is almost always the same: a service won't connect, and you don't yet know if it's DNS, a firewall rule, or a bad route. You need to answer that fast, before an outage window stretches out, which means having the right command and the reasoning behind it ready instead of relearning `tcpdump` filter syntax under pressure. This guide walks the stack layer by layer — addressing, DNS, firewall, routing, packets — so you can narrow down where a connection is actually failing instead of guessing.

## Prerequisites

This guide assumes a Linux host (Debian/Ubuntu or RHEL/CentOS family) with `sudo` access and `iproute2` installed, since that package provides the `ip` and `ss` commands used throughout. Several sections also expect `tcpdump`, `dig` (from `bind-utils` or `dnsutils`), `mtr`, and `nc` to be present — most server images ship with these, but minimal container base images often strip them out, so you may need to install them or use `nsenter` from the host instead of chasing them down inside the image.

## IP Addressing

Modern distributions treat `ip` (from `iproute2`) as the default tool for interface and address work; `ifconfig` and the old `route` command are deprecated on most systems and may not even be installed, so reach for `ip` first. Start here whenever a host looks unreachable — confirm the interface exists, is up, and has the address you expect before chasing anything further down the stack.

```bash
# Show all interfaces
ip addr show
ip a                    # Short form

# Show specific interface
ip addr show eth0

# Add/remove IP
sudo ip addr add 10.0.0.10/24 dev eth0
sudo ip addr del 10.0.0.10/24 dev eth0

# Bring interface up/down
sudo ip link set eth0 up
sudo ip link set eth0 down
```

Changes made with `ip addr` or `ip link` only affect the running kernel state — they don't persist across a reboot unless you also update the distro's network configuration (netplan, NetworkManager, or `/etc/network/interfaces`). A manual fix that mysteriously "reverts" after a reboot is almost always this.

## DNS

If a service can't connect, DNS is the fastest thing to rule out, because a failed lookup often looks identical to a network failure from the application's point of view — the connection just hangs or times out either way. `dig` is the tool of choice here since it shows the full response, TTLs, and which server answered, whereas `nslookup` is quicker to type but isn't always installed on minimal images.

```bash
# Resolve hostname
dig example.com
dig +short example.com
dig example.com MX        # Mail records
dig example.com NS        # Nameservers
dig @8.8.8.8 example.com  # Query specific DNS server

# Reverse lookup
dig -x 93.184.216.34

# Check DNS resolution chain
dig +trace example.com

# Simple lookup
host example.com
nslookup example.com

# Check local DNS config
cat /etc/resolv.conf

# Flush DNS cache (systemd-resolved)
sudo resolvectl flush-caches
```

Flushing the OS-level cache with `resolvectl` does nothing if the resolution was cached somewhere else in the chain — a local `dnsmasq`, a stub resolver inside a container, or your application runtime's own DNS cache. If a stale record keeps coming back after a flush, check those layers too before assuming the DNS server itself hasn't picked up the change.

## Connectivity Testing

Once DNS resolves, the next question is whether you can reach the host at all, and separately, whether the specific port you care about is open. A host can answer ping while the application port stays firewalled, so don't stop at ICMP and call it "network is fine." When the complaint is latency rather than an outright failure, `curl`'s timing breakdown is more useful than a plain ping, since it separates DNS lookup time from TCP connect time and TLS handshake time — which matters when you're trying to tell a slow DNS server apart from a slow TLS negotiation.

```bash
# Basic ping
ping -c 4 example.com

# TCP port test
nc -zv example.com 443     # Netcat
curl -v telnet://example.com:5432  # Curl

# HTTP test
curl -I https://example.com          # Headers only
curl -w "%{http_code}" -o /dev/null -s https://example.com  # Status code
curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nTotal: %{time_total}s\n" -o /dev/null -s https://example.com

# Traceroute
traceroute example.com
mtr example.com            # Continuous traceroute
```

## Ports and Connections

`ss` replaced `netstat` as the standard tool years ago and is noticeably faster on hosts with a lot of connections, though `netstat` is still worth recognizing since older runbooks and monitoring scripts still call it directly. Before blaming the firewall, confirm the service is actually listening on the interface you expect — a process bound to `127.0.0.1` instead of `0.0.0.0` refuses external connections regardless of how permissive the firewall rules are.

```bash
# What's listening?
ss -tlnp                   # TCP listening ports with process
ss -ulnp                   # UDP listening
ss -tnp                    # Active TCP connections

# Specific port
ss -tlnp | grep :3000

# All connections to a host
ss -tnp dst 10.0.0.5

# Connection count by state
ss -s

# Legacy (still useful)
netstat -tlnp
```

## Firewall (iptables / nftables)

Firewall rules are the second most common cause of "can't connect" after DNS, and they're also the easiest to get subtly wrong, because most distros now run one of several front-ends that all ultimately write to the same underlying netfilter/nftables rule set. Which tool you should reach for depends on the distro and on what's already managing that host.

### UFW (Ubuntu)

UFW is a friendlier front-end over the kernel firewall aimed at single-purpose servers, and it's usually enough for straightforward allow/deny rules without needing to think in chains and tables.

```bash
sudo ufw status verbose
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw deny 23/tcp
sudo ufw enable
```

Don't manage the same host with both UFW and raw `iptables` commands. UFW inserts and expects to own its own chains, so rules added directly with `iptables` can end up ignored, duplicated, or silently reset the next time UFW reloads. Pick one front-end per host and stick with it.

### iptables

Drop to raw `iptables` when you need finer control than UFW exposes — NAT/port-forwarding rules, or matching on criteria UFW's syntax can't express cleanly. Rule order matters here: iptables evaluates a chain top to bottom and stops at the first match, so a broad `DROP` placed above a more specific `ACCEPT` will block traffic that looks, on paper, like it should be allowed.

```bash
# List rules
sudo iptables -L -n -v
sudo iptables -L -n -v -t nat   # NAT table

# Allow port
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Block IP
sudo iptables -A INPUT -s 192.168.1.100 -j DROP

# Port forwarding
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

Rules added with `iptables` directly don't survive a reboot on their own — `iptables-save` only writes the current rule set to a file; you still need something like `iptables-persistent`/`netfilter-persistent` to reload it at boot, or the rules quietly vanish on the next restart.

### firewalld (RHEL/CentOS)

firewalld is the default on RHEL-family systems and models rules around named zones and services rather than raw chains. `--permanent` writes a rule to disk but doesn't apply it until you `--reload`; drop `--permanent` if you want to test a rule temporarily without it surviving a restart.

```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

## Routing

Routing problems show up as a host that can reach some networks but not others — typically a missing route to a VPN range, a second NIC, or a container overlay network. `ip route get` is the fastest way to check what path the kernel would actually pick to reach a given IP, including which interface and gateway it selects, without sending any real traffic.

```bash
# Show routing table
ip route show
ip route get 8.8.8.8    # How to reach a specific IP

# Add route
sudo ip route add 10.1.0.0/16 via 10.0.0.1 dev eth0

# Default gateway
sudo ip route add default via 10.0.0.1
```

Like `ip addr` changes, routes added with `ip route add` are not persistent — they disappear on reboot unless you put them in your distro's network configuration. If a route "keeps disappearing," check whether it was ever added anywhere but a manual command.

## Packet Capture

When ping, DNS, and routing all check out and something still isn't working, packet capture is the way to see what's actually happening on the wire instead of guessing from application logs. `tcpdump` filters use BPF (Berkeley Packet Filter) syntax, which is worth learning even briefly: `host`, `port`, and boolean combinations like `'port 80 or port 443'` let you narrow a busy interface down to exactly the traffic you care about instead of scrolling past everything else.

```bash
# Capture all traffic on interface
sudo tcpdump -i eth0

# Filter by host
sudo tcpdump -i eth0 host 10.0.0.5

# Filter by port
sudo tcpdump -i eth0 port 443
sudo tcpdump -i eth0 'port 80 or port 443'

# Save to file (open in Wireshark)
sudo tcpdump -i eth0 -w capture.pcap -c 1000

# DNS queries
sudo tcpdump -i eth0 port 53

# Show packet contents
sudo tcpdump -i eth0 -A port 80 | head -50
```

On a busy production interface, an unfiltered `tcpdump -i eth0` can produce more output than you can read in real time and adds its own overhead. Always scope a capture with a host/port filter and either a packet count (`-c`) or a short time window, and write it to a file with `-w` if you need to hand it off or inspect it later in Wireshark rather than reading it live in the terminal.

## Network Namespaces (Containers)

Every container gets its own network namespace, which is why running `ip addr` or `ss` on the host tells you nothing useful about a container's actual connectivity — the container has its own interfaces, routing table, and firewall rules, isolated from the host's. Rather than installing networking tools inside an often-minimal container image, use `nsenter` from the host to jump into that namespace and run your usual commands there instead.

```bash
# List network namespaces
ip netns list

# Execute in namespace
sudo ip netns exec my-ns ip addr show

# Find container's network namespace
PID=$(docker inspect -f '{{.State.Pid}}' my-container)
sudo nsenter -t $PID -n ip addr show
sudo nsenter -t $PID -n ss -tlnp
```

## Troubleshooting Flowchart

```
Can't connect to service?
├── Is DNS resolving? → dig hostname
│   └── No → Check /etc/resolv.conf, DNS server
├── Is the port open? → nc -zv host port
│   └── No → Check firewall (ufw/iptables), service running?
├── Is the service listening? → ss -tlnp | grep port
│   └── No → Service crashed or wrong bind address
├── Can you reach the host? → ping host
│   └── No → Check routing (ip route), firewall, security groups
└── Is there packet loss? → mtr host
    └── Yes → Network congestion, ISP issue
```

## Common Issues and Pitfalls

Most connectivity problems fall into a handful of recurring patterns, and matching the symptom to the right check saves you from working through the entire flowchart above every single time.

| Symptom | Check | Fix |
|---|---|---|
| Connection refused | `ss -tlnp` | Service not running or wrong port |
| Connection timeout | `ping`, firewall | Firewall blocking, wrong IP/route |
| DNS not resolving | `/etc/resolv.conf` | Wrong nameserver, DNS down |
| Intermittent failures | `mtr` | Packet loss, flaky network |
| High latency | `curl -w` timing | DNS slow, route inefficient, TLS overhead |

A couple of mistakes are common enough to call out on their own. People frequently test with `ping`, get a reply, and declare the host "reachable" — but ICMP can be wide open while the actual application port stays firewalled, so always confirm the specific port with `nc` or `ss`, not just the host. Similarly, remember that changes made with `ip addr`, `ip route`, and raw `iptables` rules only apply to the running kernel state; without persisting them in your distro's proper configuration, they disappear on the next reboot, and the "fix" you applied during an incident quietly reverts days later, making the same issue look like it came back on its own.

## What's Next?

Our **Docker Fundamentals** course covers container networking. **SELinux for System Admins** teaches network access controls at the OS level. First lessons are free.
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

