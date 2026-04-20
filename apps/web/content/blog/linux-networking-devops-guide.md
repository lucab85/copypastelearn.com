---
title: "Linux Networking for DevOps"
slug: "linux-networking-devops-guide"
date: "2026-02-06"
category: "DevOps"
tags: ["Linux", "Networking", "DevOps", "System Administration", "Troubleshooting"]
excerpt: "Essential Linux networking commands for DevOps. IP addressing, DNS, firewall, routing, packet capture, and troubleshooting connectivity."
description: "Essential Linux networking for DevOps engineers. IP configuration, DNS resolution, firewall rules, routing tables, packet capture with tcpdump, and troubleshooting tools."
---

Every DevOps engineer debugs network issues. These are the commands and concepts you need when something cannot connect.

## IP Addressing

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

## DNS

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

## Connectivity Testing

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

### UFW (Ubuntu)

```bash
sudo ufw status verbose
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw deny 23/tcp
sudo ufw enable
```

### iptables

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

### firewalld (RHEL/CentOS)

```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

## Routing

```bash
# Show routing table
ip route show
ip route get 8.8.8.8    # How to reach a specific IP

# Add route
sudo ip route add 10.1.0.0/16 via 10.0.0.1 dev eth0

# Default gateway
sudo ip route add default via 10.0.0.1
```

## Packet Capture

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

## Network Namespaces (Containers)

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

## Common Issues

| Symptom | Check | Fix |
|---|---|---|
| Connection refused | `ss -tlnp` | Service not running or wrong port |
| Connection timeout | `ping`, firewall | Firewall blocking, wrong IP/route |
| DNS not resolving | `/etc/resolv.conf` | Wrong nameserver, DNS down |
| Intermittent failures | `mtr` | Packet loss, flaky network |
| High latency | `curl -w` timing | DNS slow, route inefficient, TLS overhead |

## What's Next?

Our **Docker Fundamentals** course covers container networking. **SELinux for System Admins** teaches network access controls at the OS level. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

