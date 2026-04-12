---
title: "Python for DevOps Automation"
slug: "python-devops-automation-guide"
date: "2026-02-03"
category: "Development"
tags: ["Python", "DevOps", "Automation", "Scripting", "Development"]
excerpt: "Use Python for DevOps automation. HTTP APIs, file processing, AWS boto3, subprocess management, and CLI tool development."
description: "Use Python for DevOps automation. HTTP APIs, file processing, AWS boto3, subprocess, and CLI tools."
---

Python is the second language of DevOps after Bash. When a shell script gets too complex — JSON parsing, API calls, error handling — switch to Python.

## When to Use Python Over Bash

| Use Bash When | Use Python When |
|---|---|
| Simple file operations | Complex data processing |
| Piping commands together | API integrations |
| Quick one-liners | Error handling matters |
| System commands | JSON/YAML parsing |
| < 50 lines | > 50 lines |

## HTTP APIs

```python
import requests

# GET request
response = requests.get("https://api.github.com/repos/kubernetes/kubernetes")
data = response.json()
print(f"Stars: {data['stargazers_count']}")

# POST with auth
response = requests.post(
    "https://api.example.com/deployments",
    headers={"Authorization": f"Bearer {os.environ['API_TOKEN']}"},
    json={
        "environment": "production",
        "version": "v2.1.0",
        "notify": True,
    },
    timeout=30,
)
response.raise_for_status()  # Raises exception on 4xx/5xx
```

### Retry Pattern

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503])
session.mount("https://", HTTPAdapter(max_retries=retries))

response = session.get("https://api.example.com/health")
```

## File Processing

### YAML

```python
import yaml

# Read
with open("config.yml") as f:
    config = yaml.safe_load(f)

print(config["database"]["host"])

# Write
config["database"]["port"] = 5433
with open("config.yml", "w") as f:
    yaml.dump(config, f, default_flow_style=False)
```

### JSON

```python
import json

# Read
with open("terraform.tfstate") as f:
    state = json.load(f)

# Process
resources = state.get("resources", [])
instances = [r for r in resources if r["type"] == "aws_instance"]
for inst in instances:
    attrs = inst["instances"][0]["attributes"]
    print(f"{attrs['tags']['Name']}: {attrs['public_ip']}")
```

### CSV / Log Processing

```python
import csv
from collections import Counter

# Parse access logs
status_codes = Counter()
with open("/var/log/nginx/access.log") as f:
    for line in f:
        parts = line.split()
        if len(parts) > 8:
            status_codes[parts[8]] += 1

for code, count in status_codes.most_common(10):
    print(f"{code}: {count}")
```

## AWS with Boto3

```python
import boto3

ec2 = boto3.client("ec2", region_name="eu-west-1")

# List running instances
response = ec2.describe_instances(
    Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
)
for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        name = next(
            (t["Value"] for t in instance.get("Tags", []) if t["Key"] == "Name"),
            "unnamed",
        )
        print(f"{name}: {instance['InstanceId']} ({instance['InstanceType']})")

# Stop instances by tag
def stop_dev_instances():
    response = ec2.describe_instances(
        Filters=[
            {"Name": "tag:Environment", "Values": ["development"]},
            {"Name": "instance-state-name", "Values": ["running"]},
        ]
    )
    instance_ids = [
        i["InstanceId"]
        for r in response["Reservations"]
        for i in r["Instances"]
    ]
    if instance_ids:
        ec2.stop_instances(InstanceIds=instance_ids)
        print(f"Stopped {len(instance_ids)} dev instances")
```

### S3 Operations

```python
s3 = boto3.client("s3")

# Upload
s3.upload_file("backup.sql.gz", "my-backups", f"db/{date}/backup.sql.gz")

# List objects
response = s3.list_objects_v2(Bucket="my-backups", Prefix="db/")
for obj in response.get("Contents", []):
    print(f"{obj['Key']}: {obj['Size'] / 1024 / 1024:.1f} MB")

# Delete old backups
import datetime
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
for obj in response.get("Contents", []):
    if obj["LastModified"] < cutoff:
        s3.delete_object(Bucket="my-backups", Key=obj["Key"])
```

## Subprocess Management

```python
import subprocess

# Simple command
result = subprocess.run(
    ["kubectl", "get", "pods", "-o", "json"],
    capture_output=True,
    text=True,
    check=True,  # Raises on non-zero exit
)
pods = json.loads(result.stdout)

# With timeout
try:
    result = subprocess.run(
        ["terraform", "plan", "-no-color"],
        capture_output=True,
        text=True,
        timeout=300,
        cwd="/path/to/terraform",
    )
except subprocess.TimeoutExpired:
    print("Terraform plan timed out!")
```

## CLI Tools with Click

```python
import click

@click.group()
def cli():
    """DevOps automation toolkit."""

@cli.command()
@click.argument("environment", type=click.Choice(["dev", "staging", "prod"]))
@click.option("--version", required=True, help="Version to deploy")
@click.option("--dry-run", is_flag=True, help="Show what would happen")
def deploy(environment, version, dry_run):
    """Deploy application to an environment."""
    click.echo(f"Deploying v{version} to {environment}")
    if dry_run:
        click.echo("DRY RUN — no changes made")
        return
    # Deploy logic here

@cli.command()
@click.option("--days", default=30, help="Delete backups older than N days")
def cleanup(days):
    """Clean up old backups."""
    click.echo(f"Removing backups older than {days} days")

if __name__ == "__main__":
    cli()
```

```bash
python devops.py deploy staging --version 2.1.0
python devops.py cleanup --days 7
```

## Project Structure

```
devops-tools/
  pyproject.toml
  src/
    devops/
      __init__.py
      cli.py
      aws.py
      kubernetes.py
      notifications.py
  tests/
    test_aws.py
    test_kubernetes.py
```

```toml
# pyproject.toml
[project]
name = "devops-tools"
version = "1.0.0"
dependencies = [
    "boto3>=1.34",
    "click>=8.0",
    "requests>=2.31",
    "pyyaml>=6.0",
]

[project.scripts]
devops = "devops.cli:cli"
```

## What's Next?

Our **Node.js REST APIs** course covers building production APIs. **Ansible Automation in 30 Minutes** teaches infrastructure automation with Python-based Ansible. First lessons are free.
