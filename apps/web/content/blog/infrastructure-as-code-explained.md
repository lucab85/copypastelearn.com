---
title: "Infrastructure as Code Explained"
description: "Understand Infrastructure as Code (IaC) — what it is, why it matters, and how tools like Terraform are transforming cloud infrastructure management."
date: "2026-02-26"
author: "Luca Berton"
category: "DevOps"
tags: ["IaC", "DevOps", "cloud infrastructure"]
---

This post is for anyone still provisioning cloud resources by hand — clicking through the AWS, Azure, or GCP console, or SSHing into boxes to install packages one at a time — and wondering whether Infrastructure as Code (IaC) is worth the switch. You don't need prior experience with Terraform, Ansible, or any specific tool to follow along. You do need to have felt the pain of "ClickOps" at least once: the moment you needed to rebuild an environment and realized nobody, including you, could remember exactly how it was put together.

## The Problem with Manual Infrastructure

Imagine setting up 50 servers by clicking through the AWS console. Now imagine doing it again next month. And again for staging. And again for disaster recovery.

Here's how that usually plays out in practice. An engineer opens the console, creates a VPC, adds a couple of subnets, attaches a security group with a handful of inbound rules they figured out by trial and error, launches an EC2 instance, and installs the application by hand. It works. Everyone moves on. Eight months later, that engineer has left the team, and production is throwing an obscure networking error. Someone opens the console to compare it against staging and finds the two environments have quietly diverged: staging has an extra security group rule someone added to debug an issue in March, one subnet in production was resized after a capacity scare, and nobody documented either change. This is config drift — the gap between what your infrastructure is supposed to look like and what it actually looks like after months of ad hoc fixes — and it's not a one-off mistake, it's the default outcome of managing infrastructure by hand.

The deeper problem is that a console click-path isn't an artifact. It doesn't live anywhere you can inspect, diff, or hand to a teammate. "It worked when I set it up eight months ago" is a real sentence people say, and it's a sign that the setup only exists as a memory, scattered across whichever engineers happened to be in the room. When that memory is wrong, incomplete, or has left the company, rebuilding the environment means reverse-engineering it from whatever is currently running — which is exactly the kind of archaeology you want to avoid during an incident.

Manual infrastructure doesn't scale. It's slow, error-prone, and impossible to reproduce consistently.

## What Is Infrastructure as Code?

IaC means managing infrastructure through machine-readable configuration files instead of manual processes. Your infrastructure becomes:

- **Versionable** — track changes in Git
- **Reviewable** — pull requests for infrastructure changes
- **Reproducible** — spin up identical environments instantly
- **Testable** — validate before deploying
- **Documentable** — the code *is* the documentation

None of this is about writing more code for its own sake. It's about turning "what infrastructure do we have and why" from a question only answerable by asking around into a question answerable by reading a file.

## Types of IaC Tools

### Declarative vs Imperative

- **Declarative** (Terraform, CloudFormation): "I want 3 servers" — the tool figures out how
- **Imperative** (Ansible, scripts): "Create server 1, then server 2, then server 3" — you define the steps

The distinction is more than a syntax preference — it changes what you're responsible for reasoning about. With a declarative tool, you describe the end state you want, and the tool is responsible for figuring out the sequence of API calls needed to get there, including deciding what to create, what to leave alone, and what to tear down. With an imperative tool, you write the sequence of steps yourself, which means you're responsible for making sure that sequence still produces the right result the second, third, and hundredth time you run it — a property usually called idempotency. Declarative tools bake idempotency in: running `terraform apply` against infrastructure that already matches your configuration does nothing, because there's nothing left to reconcile. An imperative script that isn't written carefully can fail, half-apply, or create duplicate resources if you run it twice.

This matters practically because most real infrastructure work isn't "build it once" — it's "here's what exists, here's what changed, make it match." A declarative tool can compute that diff for you and show you exactly what it plans to add, change, or destroy before it touches anything. An imperative tool generally can't show you that diff up front, because the actions are the plan; you find out what changed by running it, or by reading the script closely enough to simulate it in your head. That's the practical case for leaning declarative when you're managing long-lived infrastructure that many people will touch over time, and why tools like Pulumi and AWS CDK — which are imperative in the sense that you write real code (TypeScript, Python, Go) to define resources — still compile down to a declarative execution plan under the hood rather than executing your code step by step against live infrastructure.

### Configuration Management vs Provisioning

- **Provisioning** (Terraform): Create the infrastructure
- **Configuration Management** (Ansible): Configure what's on it

These solve different problems and answer different questions. Provisioning tools answer "does this VPC, load balancer, and database instance exist, with these exact settings?" Configuration management tools answer "is this specific machine running the right version of this package, with this config file, with this service enabled?" You can misuse either tool to do the other's job — people have written Terraform that shells out to configure a server, and Ansible playbooks that create cloud resources — but you end up fighting the tool's model rather than using it. Provisioning tools are built to track and reconcile state; configuration management tools are built to converge a machine toward a target condition, often without maintaining a persistent record of what it changed.

Best practice: use both together.

## Why Terraform Stands Out

- Works across *any* cloud provider
- Massive community and module ecosystem
- Predictable `plan` → `apply` workflow
- State tracking prevents drift

Each of those points holds up for a concrete reason, not just because Terraform is popular. The "any cloud provider" claim comes from Terraform's provider model: a provider is a plugin that translates Terraform's generic resource language into calls against a specific API — AWS, Azure, GCP, Cloudflare, Datadog, GitHub, and hundreds of others. Because providers share the same core engine and the same HCL syntax, you're not learning a new tool every time you add a new system to manage; you're learning a new set of resource types within a system you already understand. That's also why the module ecosystem is as large as it is — a Terraform module for "a standard VPC" or "an S3 bucket with sane defaults" is portable across projects and organizations in a way that ad hoc console setups never are.

The `plan` → `apply` workflow matters because it separates deciding from doing. `terraform plan` computes a diff between your configuration and the real infrastructure and shows you exactly what will be created, modified, or destroyed — before anything happens. That diff is reviewable in a pull request the same way application code is, which is what makes infrastructure changes auditable rather than something you find out about after the fact.

State tracking is the piece that makes the diff possible in the first place. Terraform keeps a state file that records what it believes exists and how those resources map to your configuration. On every run, it compares that state against both your configuration and the real infrastructure, which is how it knows a security group rule was added out-of-band or that a resource was deleted manually. That state file is also the thing you have to manage carefully — storing it remotely with locking (in S3 with DynamoDB, Terraform Cloud, or similar) is what lets a team run Terraform against the same infrastructure without stepping on each other. Combined with a provider ecosystem this broad, the same workflow and the same state model apply whether you're managing a single AWS account or infrastructure spread across three different cloud providers — which is the real substance behind calling Terraform "multi-cloud."

## Real-World Impact

Before IaC:
- Hours to provision environments
- "It works on my machine" for infrastructure
- No audit trail for changes

After IaC:
- Minutes to provision environments
- Identical dev/staging/prod
- Full Git history of every change

Picture a team that needs a new staging environment to test a change safely before it reaches production. Under the manual approach, someone spends the better part of a day recreating what they remember of production — a subnet here, a database instance there, a security group rule they hope is right — and the result is close enough to be useful but different enough that a bug that doesn't reproduce in staging can still bite in production. Under an IaC approach, that same environment is `terraform apply` against a copy of the same configuration with different variable values. It takes minutes, and because it comes from the same source as production, "works in staging" actually means something.

The same shift shows up during incident response. Without IaC, "what changed before this broke" is a question you answer by asking around and combing through CloudTrail or console activity logs, hoping someone remembers. With IaC, it's a question you answer with `git log` — every infrastructure change has an author, a timestamp, and a diff, because it went through the same pull request process as your application code.

### Common Pitfalls

Adopting IaC doesn't automatically fix everything, and a few mistakes show up often enough to call out directly. The first is letting manual changes creep back in — someone tweaks a setting in the console "just this once" to fix an urgent issue, and now your state file and your real infrastructure disagree again, which is the exact drift problem IaC was supposed to eliminate. The fix isn't heroics; it's treating the console as read-only for anything already managed by code, and pulling emergency fixes back into your configuration as soon as the fire is out.

The second is mismanaging state. A state file that isn't stored remotely with locking becomes a single point of failure and a source of conflicts the moment more than one person runs Terraform against the same infrastructure. The third is writing configuration that's too clever — deeply nested conditionals and dynamically generated resource names can make a `plan` output nearly unreadable, which defeats the entire point of having a reviewable diff. IaC gives you the tools to avoid these problems, but only if you treat the configuration with the same discipline you'd apply to production application code.

## Get Started

Learn IaC hands-on with Terraform in our [Terraform for Beginners course](/courses) — from zero to deploying real AWS infrastructure.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

