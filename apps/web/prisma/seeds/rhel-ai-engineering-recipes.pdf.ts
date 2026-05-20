/**
 * PDF generator for "RHEL AI Engineering Recipes".
 *
 * Code-first cookbook for SRE / platform engineers deploying Red Hat AI,
 * InstructLab, vLLM, model serving, RAG pipelines, and governance on RHEL 9.
 * Derived from open-source code examples in the Practical-RHEL-AI repo plus
 * upstream InstructLab / vLLM / DeepSpeed operational patterns.
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

export async function generateRhelAiEngineeringRecipesPdf(): Promise<Uint8Array> {
  const ctx = await initDoc({
    title: "RHEL AI Engineering Recipes",
    subject:
      "Production cookbook for Red Hat AI, InstructLab, vLLM, model serving, RAG, and governance on RHEL 9 GPU nodes.",
    keywords: [
      "rhel-ai",
      "instructlab",
      "vllm",
      "deepspeed",
      "nvidia",
      "rag",
      "chromadb",
      "langchain",
      "crewai",
      "mlops",
      "sre",
    ],
    headerLeft: "RHEL AI Engineering Recipes",
  });

  drawCover(ctx, {
    title: "RHEL AI Engineering Recipes",
    subtitle: "Production patterns for Red Hat AI, InstructLab, vLLM, and RAG on RHEL 9",
    version: "1.0",
    releaseMonth: "May 2026",
  });

  newPage(ctx);
  drawToc(ctx, [
    "About this book",
    "RHEL AI installation: subscriptions, repos, ilab CLI",
    "GPU enablement: NVIDIA drivers, CUDA, container toolkit",
    "Cloud bootstrap: AWS, Azure, GCP, IBM Cloud GPU nodes",
    "Bare-metal kickstart for RHEL AI nodes",
    "InstructLab taxonomy: knowledge and skills",
    "Synthetic Data Generation (SDG) with ilab",
    "Model training: ilab + DeepSpeed multi-GPU",
    "Model serving: ilab serve and vLLM",
    "Chat and OpenAI-compatible inference",
    "Custom FastAPI wrapper on top of vLLM",
    "RAG pipeline: ChromaDB + LangChain",
    "Multi-agent orchestration with CrewAI",
    "Ansible automation for RHEL AI fleets",
    "Model evaluation: BLEU, BERTScore, ilab evaluate",
    "Observability: vLLM + GPU + Prometheus + Grafana",
    "Scale-out: data-parallel, tensor-parallel, multi-node",
    "Governance: SPDX lineage and model cards",
    "Explainability and audit pipelines",
    "Blue-green and canary model rollouts",
    "Common errors and one-line fixes",
    "Hardware sizing reference",
    "Security: tokens, signing, network isolation",
    "Versioning, releases, and support",
    "License",
  ]);

  newPage(ctx);
  drawHeading(ctx, "1. About this book", 1);
  drawParagraph(
    ctx,
    "RHEL AI Engineering Recipes is the cookbook we hand to platform and SRE engineers on day one of a Red Hat AI engagement. It assumes Linux sysadmin and container runtime familiarity and walks the production path: subscription, GPU enablement, taxonomy, training, serving, RAG, agents, observability, governance.",
  );
  drawParagraph(
    ctx,
    "Every snippet is copy-paste ready and tested against RHEL 9 with NVIDIA A100, H100, and L40S GPUs. The four design pillars are: idempotent deployment with Ansible, reproducible training with InstructLab + DeepSpeed, observable serving with vLLM + Prometheus, and signed-artifact governance with SPDX model cards.",
  );
  drawHeading(ctx, "What you get", 3);
  drawBullets(ctx, [
    "Subscription-manager + repo enablement for `ilab`, CUDA, Gaudi accelerators.",
    "GPU smoke tests and troubleshooting recipes (nvidia-smi, CDI device resolution, persistent mode).",
    "Cloud bootstrap recipes: AWS p5/g5, Azure ND H100 v5, GCP A3, IBM Cloud GX3.",
    "InstructLab taxonomy templates, SDG runbook, multi-GPU DeepSpeed training, vLLM serving.",
    "FastAPI + vLLM wrapper, ChromaDB + LangChain RAG, CrewAI multi-agent orchestration.",
    "Ansible role to deploy RHEL AI across a fleet, idempotent and tag-filtered.",
    "Observability stack: nvidia-dcgm-exporter, vLLM metrics, Prometheus scrape configs, Grafana dashboards.",
    "Governance: SPDX lineage YAML, model cards, signed artifacts with cosign.",
    "Lifetime updates while the recipes are maintained, delivered via /library.",
  ]);

  // 2
  newPage(ctx);
  drawHeading(ctx, "2. RHEL AI installation: subscriptions, repos, ilab CLI", 1);
  drawCode(
    ctx,
    [
      "sudo subscription-manager register \\",
      "  --activationkey=<KEY> --org=<ORG_ID>",
      "",
      "sudo subscription-manager repos \\",
      "  --enable rhelai-1.5-for-rhel-9-x86_64-rpms \\",
      "  --enable rhelai-1.5-cuda-for-rhel-9-x86_64-rpms",
      "",
      "# optional Intel Gaudi",
      "sudo subscription-manager repos \\",
      "  --enable rhelai-1.5-gaudi-for-rhel-9-x86_64-rpms",
      "",
      "sudo dnf makecache",
      "sudo dnf upgrade -y",
      "sudo dnf install -y ilab",
      "ilab --version",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Run `dnf makecache` after enabling repos - silent fallback to old metadata bites hard.",
    "Activation keys expire; rotate 30 days before EOL and roll the fleet with Ansible.",
    "For air-gapped sites mirror the four repos via reposync into a local Pulp / Foreman.",
    "Pin RHEL AI minor version (1.5) per cluster; bump only after staging passes a model eval.",
  ]);

  // 3
  newPage(ctx);
  drawHeading(ctx, "3. GPU enablement: NVIDIA drivers, CUDA, container toolkit", 1);
  drawCode(
    ctx,
    [
      "sudo dnf install -y \\",
      "  nvidia-driver nvidia-fabric-manager nvidia-utils \\",
      "  cuda-toolkit nvidia-container-toolkit",
      "",
      "nvidia-smi",
      "nvcc --version",
      "",
      "# enable persistent mode and ECC",
      "sudo nvidia-smi -pm 1",
      "sudo nvidia-smi -ecc ENABLED",
      "",
      "# test GPU inside a container",
      "sudo systemctl restart podman",
      "podman run --rm --gpus all \\",
      "  nvidia/cuda:12.2.0-devel-ubi9 nvidia-smi",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Common fix: 'unresolvable CDI devices nvidia.com/gpu=all'",
      "systemctl list-units --failed | grep nvidia",
      "sudo systemctl restart nvidia-persistenced.service",
      "sudo systemctl restart nvidia-toolkit-firstboot.service",
      "sudo nvidia-ctk cdi generate \\",
      "  --output=/etc/cdi/nvidia.yaml",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pin the driver major (e.g. nvidia-driver-535) in production; floating drivers break ABI.",
    "Verify GPU INSIDE a container before installing `ilab` - 80% of failures live in the runtime.",
    "Enable ECC where the GPU supports it; flip persistent mode on once per boot.",
    "DCGM exporter requires the same driver version on every node; mismatches drop scrapes.",
  ]);

  // 4
  newPage(ctx);
  drawHeading(ctx, "4. Cloud bootstrap: AWS, Azure, GCP, IBM Cloud GPU nodes", 1);
  drawCode(
    ctx,
    [
      "# AWS - 8x H100 (p5.48xlarge)",
      "resource \"aws_instance\" \"rhelai\" {",
      "  ami                  = var.rhelai_ami_id",
      "  instance_type        = \"p5.48xlarge\"",
      "  key_name             = var.key_name",
      "  iam_instance_profile = aws_iam_instance_profile.gpu.name",
      "  vpc_security_group_ids = [aws_security_group.rhelai.id]",
      "  root_block_device {",
      "    volume_size = 1024",
      "    volume_type = \"gp3\"",
      "    iops        = 3000",
      "    throughput  = 125",
      "  }",
      "  ebs_block_device {",
      "    device_name = \"/dev/sdb\"",
      "    volume_size = 3072",
      "    volume_type = \"gp3\"",
      "    throughput  = 1000",
      "  }",
      "  metadata_options {",
      "    http_tokens = \"required\"",
      "  }",
      "  user_data = templatefile(\"${path.module}/bootstrap.sh.tftpl\", {",
      "    activation_key = var.activation_key",
      "    org_id         = var.org_id",
      "  })",
      "}",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Azure - ND H100 v5",
      "az vm create --resource-group rhelai-rg \\",
      "  --name rhelai-h100-01 \\",
      "  --image RedHat:RHELAI:rhelai-1-5-h100:latest \\",
      "  --size Standard_ND96isr_H100_v5 \\",
      "  --ssh-key-values ~/.ssh/id_ed25519.pub \\",
      "  --custom-data ./bootstrap.sh",
      "",
      "# GCP - A3 (8x H100)",
      "gcloud compute instances create rhelai-h100-01 \\",
      "  --machine-type=a3-highgpu-8g \\",
      "  --image-family=rhel-9 --image-project=rhel-cloud \\",
      "  --accelerator=type=nvidia-h100-80gb,count=8 \\",
      "  --maintenance-policy=TERMINATE \\",
      "  --metadata-from-file=startup-script=bootstrap.sh",
      "",
      "# IBM Cloud - GX3 (gx3.40x224.l40s)",
      "ibmcloud is instance-create rhelai-l40s-01 \\",
      "  vpc-prod us-south-1 gx3.40x224.l40s ibm-redhat-9-3-amd64-1 \\",
      "  --user-data @bootstrap.sh",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Always require IMDSv2 (`http_tokens = required`) on cloud instances.",
    "Use cloud-init / user-data to register with subscription-manager and pre-warm `ilab` on first boot.",
    "Detach the training data volume on stop; it lets you stop large nodes between SDG runs cheaply.",
    "Choose H100 for SDG + training, L40S for inference-only fleets - 3-4x cost efficient.",
  ]);

  // 5
  newPage(ctx);
  drawHeading(ctx, "5. Bare-metal kickstart for RHEL AI nodes", 1);
  drawCode(
    ctx,
    [
      "# /var/lib/tftpboot/pxelinux.cfg/rhelai.ks (kickstart)",
      "lang en_US.UTF-8",
      "keyboard us",
      "timezone Europe/Amsterdam --utc",
      "rootpw --iscrypted $6$...",
      "selinux --enforcing",
      "firewall --enabled --service=ssh",
      "network --bootproto=dhcp --hostname=rhelai-01",
      "url --url=\"http://repo.internal/rhel/9/baseos\"",
      "repo --name=AppStream --baseurl=http://repo.internal/rhel/9/appstream",
      "repo --name=RHELAI    --baseurl=http://repo.internal/rhelai/1.5",
      "",
      "%packages",
      "@core",
      "ilab",
      "nvidia-driver",
      "nvidia-fabric-manager",
      "cuda-toolkit",
      "nvidia-container-toolkit",
      "%end",
      "",
      "%post --interpreter=/bin/bash",
      "subscription-manager register --activationkey=$KEY --org=$ORG",
      "subscription-manager repos --enable rhelai-1.5-for-rhel-9-x86_64-rpms",
      "dnf -y upgrade",
      "systemctl enable --now nvidia-persistenced",
      "%end",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pre-stage the activation key via an injected secret; never bake it into the kickstart in git.",
    "Use SELinux enforcing; the RHEL AI policy is mature and works with vLLM out of the box.",
    "PXE + iPMI lets you reimage a degraded node in 15 minutes - much cheaper than debugging in place.",
    "Mirror the RHEL AI repo locally with `reposync`; avoids cross-Atlantic dnf for every install.",
  ]);

  // 6
  newPage(ctx);
  drawHeading(ctx, "6. InstructLab taxonomy: knowledge and skills", 1);
  drawCode(
    ctx,
    [
      "ilab config init --non-interactive",
      "",
      "# directory layout under ~/.local/share/instructlab/taxonomy/",
      "taxonomy/",
      "  knowledge/",
      "    science/",
      "      physics/",
      "        thermodynamics/",
      "          qna.yaml",
      "          attribution.md",
      "  compositional_skills/",
      "    writing/",
      "      summary/",
      "        executive_summary/",
      "          qna.yaml",
      "          attribution.md",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# qna.yaml - skill example",
      "version: 3",
      "task_description: \"Write a one-paragraph executive summary.\"",
      "created_by: ops-platform",
      "seed_examples:",
      "  - context: |",
      "      Q3 revenue grew 18% YoY to 142M EUR driven by a 27% jump in EU sales.",
      "    question: \"Summarize the quarter for the board.\"",
      "    answer: |",
      "      Q3 delivered 142M EUR (+18% YoY), led by EU sales (+27%).",
      "  - context: |",
      "      The platform shipped 9 outages in March, with MTTR 27 minutes...",
      "    question: \"Brief the CTO on reliability this month.\"",
      "    answer: |",
      "      March saw 9 incidents (MTTR 27 min) - within SLO; root cause...",
      "",
      "ilab taxonomy diff",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "version: 3 is the current schema; older qna files silently skip during SDG.",
    "Knowledge vs skills: knowledge = facts + citations, skills = task patterns (5+ examples each).",
    "Use `ilab taxonomy diff` in CI to validate every PR before merging into the curated taxonomy.",
    "Attribution.md is mandatory for knowledge subtrees - records source + license.",
  ]);

  // 7
  newPage(ctx);
  drawHeading(ctx, "7. Synthetic Data Generation (SDG) with ilab", 1);
  drawCode(
    ctx,
    [
      "# download a teacher model used for SDG",
      "ilab model download --repository instructlab/granite-7b-lab",
      "",
      "# generate synthetic data from the taxonomy",
      "ilab data generate \\",
      "  --model ~/.cache/instructlab/models/granite-7b-lab \\",
      "  --num-cpus 16 \\",
      "  --output-dir ~/.local/share/instructlab/datasets/",
      "",
      "# list generated datasets",
      "ilab data list",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "SDG is GPU + CPU heavy; size the teacher model to fit ONE GPU and saturate the CPUs.",
    "Output JSONL files are the source of truth for training - commit them to a data registry, not git.",
    "Run SDG nightly only when the taxonomy diff is non-empty; cache otherwise.",
    "Keep the teacher model pinned per release; new teachers shift downstream evals.",
  ]);

  // 8
  newPage(ctx);
  drawHeading(ctx, "8. Model training: ilab + DeepSpeed multi-GPU", 1);
  drawCode(
    ctx,
    [
      "# single-node multi-GPU training (8x H100)",
      "ilab model train \\",
      "  --data-dir ~/.local/share/instructlab/datasets/<run-id> \\",
      "  --model-dir ~/.cache/instructlab/models/granite-7b-lab \\",
      "  --num-epochs 7 \\",
      "  --gpus 8 \\",
      "  --strategy deepspeed",
      "",
      "# deepspeed config (zero3 with offload to CPU)",
      "cat > ds_zero3.json <<EOF",
      "{",
      "  \"zero_optimization\": {",
      "    \"stage\": 3,",
      "    \"offload_optimizer\": { \"device\": \"cpu\" },",
      "    \"offload_param\":     { \"device\": \"cpu\" }",
      "  },",
      "  \"train_micro_batch_size_per_gpu\": 4,",
      "  \"gradient_accumulation_steps\": 8,",
      "  \"bf16\": { \"enabled\": true }",
      "}",
      "EOF",
      "",
      "deepspeed --num_gpus 8 train.py --deepspeed ds_zero3.json",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Start with ZeRO Stage 3 + CPU offload; switch to Stage 2 once VRAM allows for speed.",
    "bf16 on H100/A100 is mandatory - fp16 loss scaling stalls long Granite training runs.",
    "Checkpoint every 500 steps; resume from the latest if any node OOMs or NCCL stalls.",
    "Monitor `nvidia-smi dmon` during training; SM util < 70% means data-loader is the bottleneck.",
  ]);

  // 9
  newPage(ctx);
  drawHeading(ctx, "9. Model serving: ilab serve and vLLM", 1);
  drawCode(
    ctx,
    [
      "# quick start with ilab",
      "ilab model serve \\",
      "  --model-path ~/.cache/instructlab/models/granite-7b-lab \\",
      "  --gpus 1 \\",
      "  --port 8000",
      "",
      "# production: vLLM directly with tensor parallel",
      "vllm serve ~/.cache/instructlab/models/granite-7b-lab \\",
      "  --tensor-parallel-size 4 \\",
      "  --max-model-len 8192 \\",
      "  --dtype bfloat16 \\",
      "  --gpu-memory-utilization 0.92 \\",
      "  --enable-chunked-prefill \\",
      "  --max-num-seqs 256 \\",
      "  --host 0.0.0.0 --port 8000",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "tensor-parallel-size must divide the GPU count AND model layer count - 4 for Granite-7B fits.",
    "gpu-memory-utilization 0.92 leaves headroom for KV cache spikes; lower if OOMs appear.",
    "enable-chunked-prefill cuts first-token latency under bursty load; on by default in vLLM 0.6+.",
    "max-num-seqs caps concurrency; raise until p99 latency budget breaks, then back off 10%.",
  ]);

  // 10
  newPage(ctx);
  drawHeading(ctx, "10. Chat and OpenAI-compatible inference", 1);
  drawCode(
    ctx,
    [
      "# interactive",
      "ilab model chat --endpoint http://127.0.0.1:8000/v1",
      "",
      "# curl an OpenAI-compatible /chat/completions",
      "curl -s http://127.0.0.1:8000/v1/chat/completions \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '{",
      "    \"model\": \"granite-7b-lab\",",
      "    \"messages\": [",
      "      {\"role\":\"system\",\"content\":\"You are a concise SRE assistant.\"},",
      "      {\"role\":\"user\",\"content\":\"Summarize SRE error budgets in 3 bullets.\"}",
      "    ],",
      "    \"max_tokens\": 256,",
      "    \"temperature\": 0.2",
      "  }'",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# Python client (openai SDK works against vLLM)",
      "from openai import OpenAI",
      "client = OpenAI(base_url='http://127.0.0.1:8000/v1', api_key='not-needed')",
      "r = client.chat.completions.create(",
      "    model='granite-7b-lab',",
      "    messages=[{'role':'user', 'content':'List 3 RAG anti-patterns.'}],",
      "    max_tokens=256, temperature=0.2,",
      ")",
      "print(r.choices[0].message.content)",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "vLLM speaks the OpenAI v1 wire format - any LangChain / OpenAI SDK / curl client works.",
    "Set `api_key='not-needed'` for unauthenticated dev; deploy behind an auth proxy in prod.",
    "Use `temperature=0.0-0.2` for SRE / extractive tasks; 0.7+ only for creative generation.",
    "stream=True for long responses; clients hang otherwise on 8K+ token replies.",
  ]);

  // 11
  newPage(ctx);
  drawHeading(ctx, "11. Custom FastAPI wrapper on top of vLLM", 1);
  drawCode(
    ctx,
    [
      "# api.py",
      "from fastapi import FastAPI, HTTPException",
      "from pydantic import BaseModel",
      "from openai import OpenAI",
      "import os",
      "",
      "app = OpenAI(base_url=os.environ['VLLM_URL'], api_key='x')",
      "api = FastAPI(title='SRE Assistant', version='1.0')",
      "",
      "class Q(BaseModel):",
      "    question: str",
      "    max_tokens: int = 256",
      "",
      "@api.post('/v1/answer')",
      "def answer(q: Q):",
      "    try:",
      "        r = app.chat.completions.create(",
      "            model=os.environ['MODEL_NAME'],",
      "            messages=[",
      "                {'role':'system','content':'Answer in <=3 bullets.'},",
      "                {'role':'user','content': q.question},",
      "            ],",
      "            max_tokens=q.max_tokens, temperature=0.2,",
      "        )",
      "        return {'answer': r.choices[0].message.content}",
      "    except Exception as e:",
      "        raise HTTPException(503, str(e))",
      "",
      "# serve",
      "# uvicorn api:api --host 0.0.0.0 --port 9000 --workers 4",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Front vLLM with a thin FastAPI to enforce auth, rate limits, request templating, and audit logs.",
    "Pydantic models double as request validation and OpenAPI docs - no extra schema work.",
    "uvicorn --workers 4 saturates one CPU node per vLLM endpoint; scale horizontally beyond that.",
    "Add structured logs with trace_id + tenant_id from the auth proxy header.",
  ]);

  // 12
  newPage(ctx);
  drawHeading(ctx, "12. RAG pipeline: ChromaDB + LangChain", 1);
  drawCode(
    ctx,
    [
      "# index documents",
      "from langchain_community.document_loaders import DirectoryLoader",
      "from langchain_text_splitters import RecursiveCharacterTextSplitter",
      "from langchain_community.vectorstores import Chroma",
      "from langchain_huggingface import HuggingFaceEmbeddings",
      "",
      "docs = DirectoryLoader('./runbooks', glob='**/*.md').load()",
      "chunks = RecursiveCharacterTextSplitter(",
      "    chunk_size=800, chunk_overlap=120).split_documents(docs)",
      "",
      "emb = HuggingFaceEmbeddings(",
      "    model_name='sentence-transformers/all-MiniLM-L6-v2')",
      "db = Chroma.from_documents(",
      "    chunks, embedding=emb, persist_directory='./chroma')",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# query with retrieval",
      "from langchain_openai import ChatOpenAI",
      "from langchain.chains import RetrievalQA",
      "",
      "llm = ChatOpenAI(",
      "    base_url='http://127.0.0.1:8000/v1',",
      "    api_key='not-needed', model='granite-7b-lab', temperature=0.1)",
      "",
      "qa = RetrievalQA.from_chain_type(",
      "    llm=llm,",
      "    retriever=db.as_retriever(search_kwargs={'k': 6}),",
      "    return_source_documents=True)",
      "",
      "out = qa.invoke({'query': 'How do we mitigate a CrashLoopBackOff?'})",
      "print(out['result'])",
      "for s in out['source_documents']:",
      "    print(' -', s.metadata.get('source'))",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Chunk 600-1000 chars with 100-150 overlap; smaller fragments lose context, bigger ones drown signal.",
    "Persist the Chroma directory and back it up nightly - re-indexing 100K docs costs hours.",
    "k=4-8 retrieval is the sweet spot; higher k makes the prompt blow past 8K context.",
    "Always return source_documents and surface them in the UI - users trust answers with citations.",
  ]);

  // 13
  newPage(ctx);
  drawHeading(ctx, "13. Multi-agent orchestration with CrewAI", 1);
  drawCode(
    ctx,
    [
      "from crewai import Agent, Task, Crew, Process",
      "from langchain_openai import ChatOpenAI",
      "",
      "llm = ChatOpenAI(base_url='http://127.0.0.1:8000/v1',",
      "                 api_key='x', model='granite-7b-lab', temperature=0.2)",
      "",
      "researcher = Agent(",
      "    role='SRE Researcher',",
      "    goal='Find runbooks relevant to an incident',",
      "    backstory='You know our internal runbook corpus.',",
      "    llm=llm, allow_delegation=False)",
      "",
      "writer = Agent(",
      "    role='Incident Summarizer',",
      "    goal='Draft a clear postmortem outline',",
      "    backstory='You write crisp incident summaries.',",
      "    llm=llm)",
      "",
      "t1 = Task(description='Find runbooks for db connection storms',",
      "          agent=researcher, expected_output='3-5 runbook URLs')",
      "t2 = Task(description='Draft a postmortem outline using t1',",
      "          agent=writer, expected_output='Markdown outline')",
      "",
      "crew = Crew(agents=[researcher, writer], tasks=[t1, t2],",
      "            process=Process.sequential)",
      "print(crew.kickoff())",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Start with sequential process; hierarchical adds orchestration latency and surprise costs.",
    "Give each agent a SINGLE goal - vague goals collapse into looping conversations.",
    "Pin model + temperature per agent; mixing temperatures in a crew degrades repeatability.",
    "Add a tool with explicit allow-list (read-only file access) before letting an agent execute commands.",
  ]);

  // 14
  newPage(ctx);
  drawHeading(ctx, "14. Ansible automation for RHEL AI fleets", 1);
  drawCode(
    ctx,
    [
      "- name: \"Provision RHEL AI node\"",
      "  hosts: rhelai_nodes",
      "  become: true",
      "  tasks:",
      "    - name: Register with subscription-manager",
      "      community.general.redhat_subscription:",
      "        state: present",
      "        activationkey: \"{{ rhsm_activation_key }}\"",
      "        org_id: \"{{ rhsm_org_id }}\"",
      "",
      "    - name: Enable RHEL AI repos",
      "      community.general.rhsm_repository:",
      "        name:",
      "          - rhelai-1.5-for-rhel-9-x86_64-rpms",
      "          - rhelai-1.5-cuda-for-rhel-9-x86_64-rpms",
      "        state: enabled",
      "",
      "    - name: Install ilab + GPU stack",
      "      ansible.builtin.dnf:",
      "        name:",
      "          - ilab",
      "          - nvidia-driver",
      "          - nvidia-fabric-manager",
      "          - cuda-toolkit",
      "          - nvidia-container-toolkit",
      "        state: present",
      "      notify: Reboot for driver",
      "",
      "    - name: Initialize ilab config (idempotent)",
      "      ansible.builtin.command:",
      "        cmd: ilab config init --non-interactive",
      "        creates: \"~{{ ansible_user }}/.config/instructlab/config.yaml\"",
      "      become_user: \"{{ ansible_user }}\"",
      "",
      "  handlers:",
      "    - name: Reboot for driver",
      "      ansible.builtin.reboot:",
      "        msg: \"Reboot for NVIDIA driver\"",
      "        reboot_timeout: 600",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Group hosts by accelerator (h100, a100, l40s) so role variables can switch model size + parallelism.",
    "`creates:` makes `ilab config init` idempotent without bash conditionals.",
    "Reboot handler runs once per play, not once per host; safe for fleet rollouts.",
    "Keep the activation key in Ansible Vault; never in plain group_vars.",
  ]);

  // 15
  newPage(ctx);
  drawHeading(ctx, "15. Model evaluation: BLEU, BERTScore, ilab evaluate", 1);
  drawCode(
    ctx,
    [
      "# ilab built-in evaluation",
      "ilab model evaluate \\",
      "  --model-path ~/.cache/instructlab/models/<trained-checkpoint> \\",
      "  --benchmark mmlu \\",
      "  --output-dir ./evals/mmlu",
      "",
      "# python: BLEU + BERTScore on held-out set",
      "from sacrebleu import corpus_bleu",
      "from bert_score import score as bert_score",
      "",
      "refs = [open('refs.txt').read().splitlines()]",
      "hyps = open('hyps.txt').read().splitlines()",
      "",
      "bleu = corpus_bleu(hyps, refs)",
      "print('BLEU:', bleu.score)",
      "",
      "P, R, F1 = bert_score(hyps, refs[0], lang='en', verbose=False)",
      "print('BERTScore F1:', F1.mean().item())",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Pin the eval benchmark (mmlu / arc / hellaswag) per model version; compare apples-to-apples only.",
    "BERTScore catches paraphrase quality where BLEU mis-scores; report both.",
    "Run evals AS PART of the training pipeline; promote checkpoints by metric, not by hand.",
    "Keep a 'golden' eval set under access control - it must not leak into training data.",
  ]);

  // 16
  newPage(ctx);
  drawHeading(ctx, "16. Observability: vLLM + GPU + Prometheus + Grafana", 1);
  drawCode(
    ctx,
    [
      "# install DCGM exporter (NVIDIA GPU metrics)",
      "sudo dnf install -y datacenter-gpu-manager",
      "podman run -d --name dcgm-exporter \\",
      "  --gpus all -p 9400:9400 \\",
      "  nvcr.io/nvidia/k8s/dcgm-exporter:3.3.5-3.4.0-ubi9",
      "",
      "# vLLM exposes /metrics in Prometheus format on the serve port",
      "curl -s http://127.0.0.1:8000/metrics | head -20",
    ].join("\n"),
  );
  drawCode(
    ctx,
    [
      "# prometheus scrape config",
      "scrape_configs:",
      "  - job_name: vllm",
      "    static_configs:",
      "      - targets: ['vllm-01:8000', 'vllm-02:8000']",
      "  - job_name: dcgm",
      "    static_configs:",
      "      - targets: ['vllm-01:9400', 'vllm-02:9400']",
      "",
      "# alerts",
      "groups:",
      "  - name: ai.slo",
      "    rules:",
      "      - alert: VllmHighFirstTokenLatency",
      "        expr: histogram_quantile(0.95,",
      "          rate(vllm_time_to_first_token_seconds_bucket[5m])) > 1.5",
      "        for: 10m",
      "        labels: { severity: page }",
      "      - alert: GpuHighTempPersistent",
      "        expr: DCGM_FI_DEV_GPU_TEMP > 85",
      "        for: 15m",
      "        labels: { severity: ticket }",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Track p95 first-token latency + tokens/sec per model - both must be in SLOs.",
    "DCGM_FI_DEV_GPU_TEMP > 85 C for 15 min = thermal throttling; check airflow / dust.",
    "vLLM `num_running` saturating max-num-seqs means you need more replicas, not bigger GPUs.",
    "Tag metrics with model_version + tenant - per-tenant SLOs are how you avoid noisy-neighbor pages.",
  ]);

  // 17
  newPage(ctx);
  drawHeading(ctx, "17. Scale-out: data-parallel, tensor-parallel, multi-node", 1);
  drawCode(
    ctx,
    [
      "# multi-node deepspeed with hostfile",
      "cat > hostfile <<EOF",
      "node01 slots=8",
      "node02 slots=8",
      "node03 slots=8",
      "node04 slots=8",
      "EOF",
      "",
      "deepspeed --hostfile hostfile \\",
      "  --num_nodes 4 --num_gpus 8 \\",
      "  train.py --deepspeed ds_zero3.json",
      "",
      "# multi-node vLLM (Ray-backed)",
      "ray start --head --port=6379 --num-gpus 8        # on node01",
      "ray start --address='node01:6379' --num-gpus 8   # on node02",
      "vllm serve <model> \\",
      "  --tensor-parallel-size 8 \\",
      "  --pipeline-parallel-size 2 \\",
      "  --distributed-executor-backend ray",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Data-parallel = scale throughput; tensor-parallel = fit a bigger model; pipeline-parallel = both.",
    "Use NCCL_DEBUG=WARN; silent NCCL hangs are the #1 multi-node failure mode.",
    "InfiniBand or 400G Ethernet for multi-node; gigabit will not move BF16 gradients in time.",
    "Always reserve one node as spare - Ray cluster does not survive a head-node restart cleanly.",
  ]);

  // 18
  newPage(ctx);
  drawHeading(ctx, "18. Governance: SPDX lineage and model cards", 1);
  drawCode(
    ctx,
    [
      "# lineage.spdx.yaml",
      "SPDXVersion: SPDX-2.3",
      "DataLicense: CC0-1.0",
      "DocumentName: granite-7b-lab-v1.4-lineage",
      "Creator: Tool: ilab-lineage-1.0",
      "Created: 2026-05-20T10:30:00Z",
      "Packages:",
      "  - SPDXID: SPDXRef-base-model",
      "    name: ibm-granite-7b-base",
      "    versionInfo: 1.0.0",
      "    downloadLocation: https://huggingface.co/ibm-granite/granite-7b-base",
      "    licenseConcluded: Apache-2.0",
      "  - SPDXID: SPDXRef-teacher",
      "    name: granite-7b-lab",
      "    versionInfo: 1.3.0",
      "    licenseConcluded: Apache-2.0",
      "  - SPDXID: SPDXRef-dataset",
      "    name: ops-platform-taxonomy",
      "    versionInfo: 2026.05.20-1",
      "    licenseConcluded: CC-BY-4.0",
      "Relationships:",
      "  - SPDXRef-base-model FINE_TUNING_OF -> SPDXRef-teacher",
      "  - SPDXRef-dataset USED_FOR -> SPDXRef-base-model",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Generate SPDX lineage in the training pipeline; never hand-edit after a release.",
    "Pin every input by hash - model card without a hash is not auditable.",
    "Mirror lineage docs into your SBOM tooling (Anchore, Snyk) for downstream scanning.",
    "EU AI Act and US EO 14110 both require lineage trails - this is regulatory work, not nice-to-have.",
  ]);

  // 19
  newPage(ctx);
  drawHeading(ctx, "19. Explainability and audit pipelines", 1);
  drawCode(
    ctx,
    [
      "# per-request audit log (json lines)",
      "{",
      "  \"ts\": \"2026-05-20T10:30:00Z\",",
      "  \"request_id\": \"req-abc-123\",",
      "  \"tenant\": \"sre-team\",",
      "  \"model\": \"granite-7b-lab\",",
      "  \"model_version\": \"1.4.0\",",
      "  \"prompt_hash\": \"sha256:9c4e...\",",
      "  \"output_hash\": \"sha256:1d20...\",",
      "  \"tokens_in\": 412,",
      "  \"tokens_out\": 187,",
      "  \"first_token_ms\": 142,",
      "  \"total_ms\": 1894,",
      "  \"retrieved_docs\": [\"runbook/db-conn-storm.md\", \"runbook/pgbouncer.md\"]",
      "}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Log prompt + output HASHES, not contents - keeps PII out of logs while preserving auditability.",
    "Persist retrieved_docs for every RAG response; explainability == citation trail.",
    "Ship logs to immutable object storage with retention matching your industry regulator.",
    "Token-level attention dumps are research-grade; do not ship them in prod audit pipelines.",
  ]);

  // 20
  newPage(ctx);
  drawHeading(ctx, "20. Blue-green and canary model rollouts", 1);
  drawCode(
    ctx,
    [
      "# nginx weighted upstream - 90% to v1.4, 10% to v1.5 canary",
      "upstream models {",
      "    server vllm-v14-01:8000 weight=9;",
      "    server vllm-v14-02:8000 weight=9;",
      "    server vllm-v15-01:8000 weight=1;",
      "}",
      "server {",
      "    listen 443 ssl;",
      "    location /v1/ {",
      "        proxy_pass http://models;",
      "        proxy_set_header X-Model-Version $upstream_addr;",
      "    }",
      "}",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Canary by weight first, not by header routing; weight tests real distribution skew.",
    "Promote only when canary p95 latency, error rate, AND eval score are at parity for 24h.",
    "Roll back by setting canary weight to 0 - zero-downtime, zero-restart.",
    "Tag every response header with the upstream addr - lets you slice metrics by model version.",
  ]);

  // 21
  newPage(ctx);
  drawHeading(ctx, "21. Common errors and one-line fixes", 1);
  drawBullets(ctx, [
    "`CUDA out of memory`: lower `--gpu-memory-utilization` to 0.85 or shrink `--max-model-len`.",
    "`unresolvable CDI devices nvidia.com/gpu=all`: `sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml`.",
    "`ilab init` hangs: kill process, `rm -rf ~/.config/instructlab`, rerun with `--non-interactive`.",
    "vLLM 500 on first request: model still loading; increase Kubernetes probe `initialDelaySeconds` to 120.",
    "Training NaN loss in epoch 1: switch dtype from fp16 to bf16; fp16 loss-scaler fails on Granite.",
    "NCCL hang multi-node: set `NCCL_DEBUG=INFO NCCL_IB_DISABLE=0`; check IB fabric with `ibstatus`.",
    "DCGM exporter returns 0 GPUs: `nvidia-smi` from inside container; missing toolkit CDI mapping.",
    "RAG returns repeated chunks: lower retriever k, raise chunk_overlap, or rebuild the vector store.",
    "vLLM eats all GPU memory across replicas: each replica gets its own GPU; set CUDA_VISIBLE_DEVICES.",
    "Taxonomy diff says 'no valid changes': qna.yaml schema is wrong; `version: 3` is required.",
  ]);

  // 22
  newPage(ctx);
  drawHeading(ctx, "22. Hardware sizing reference", 1);
  drawBullets(ctx, [
    "VRAM per parameter: ~2 bytes for inference in bf16; ~16 bytes for training with optimizer states.",
    "7B model: 14 GB inference, ~100 GB training (one node 8x A100-40 or 4x H100-80).",
    "13B model: 26 GB inference, ~200 GB training (one node 8x H100-80 with ZeRO-3).",
    "70B model: 140 GB inference (requires tensor-parallel 4-8 on H100s), >1 TB to train.",
    "Inference throughput: ~3000 tokens/sec per H100 for 7B at batch 64 with vLLM.",
    "Network: NVLink intra-node, NVSwitch in DGX, 400G IB for multi-node training.",
    "Disk: 1 TB NVMe for the model cache; 3-10 TB for training data + checkpoints.",
    "RAM: 2x VRAM minimum on the host so optimizer offload + dataloader do not swap.",
  ]);

  // 23
  newPage(ctx);
  drawHeading(ctx, "23. Security: tokens, signing, network isolation", 1);
  drawCode(
    ctx,
    [
      "# sign model artifacts with cosign keyless",
      "cosign sign-blob --yes \\",
      "  ~/.cache/instructlab/models/granite-7b-lab.tar.zst \\",
      "  --output-signature granite-7b-lab.sig",
      "",
      "# verify in deployment",
      "cosign verify-blob \\",
      "  --signature granite-7b-lab.sig \\",
      "  --certificate-identity-regexp 'https://github.com/acme/.*' \\",
      "  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\",
      "  ~/.cache/instructlab/models/granite-7b-lab.tar.zst",
      "",
      "# rotate the activation key in one shot",
      "ansible -i hosts rhelai_nodes -m community.general.redhat_subscription \\",
      "  -a 'state=present force_register=true activationkey=NEW_KEY org_id=ORG'",
    ].join("\n"),
  );
  drawBullets(ctx, [
    "Sign every model artifact with cosign keyless; verify on every deploy - tamper-evident pipeline.",
    "Isolate training nodes in a dedicated VLAN; only the registry, S3, and Prometheus reach them.",
    "Use SELinux booleans to allow vLLM to bind only the inference port - block outbound by default.",
    "Rotate activation keys with Ansible; never store keys in env files or container layers.",
  ]);

  // 24
  newPage(ctx);
  drawHeading(ctx, "24. Versioning, releases, and support", 1);
  drawParagraph(
    ctx,
    "Tracks RHEL AI 1.5 and InstructLab + vLLM upstream stable releases. Recipes are validated whenever RHEL AI ships a new minor; updates ship via /library within 30 days of each release.",
  );
  drawBullets(ctx, [
    "Pin RHEL AI minor (1.5) per cluster; bump only after staging passes a full eval suite.",
    "Read upstream vLLM release notes before adopting a new version - flag-renames happen.",
    "Sign in to https://www.copypastelearn.com/library to mint a fresh download link (24h, 3 downloads).",
    "Support: support@copypastelearn.com. Security: security@copypastelearn.com.",
  ]);

  // 25
  newPage(ctx);
  drawHeading(ctx, "25. License", 1);
  drawParagraph(
    ctx,
    "Open Empower B.V. grants you a non-exclusive, non-transferable, non-sublicensable, revocable license to use, modify, and embed the recipes and templates included in this product inside your own infrastructure projects, including projects you build for paying clients.",
  );
  drawParagraph(
    ctx,
    "You may not resell, sublicense, or republish the recipes and templates as a standalone product, remove the copyright notices, or train machine-learning models on the source files without prior written permission.",
  );
  drawParagraph(
    ctx,
    "InstructLab, vLLM, DeepSpeed, ChromaDB, LangChain, and CrewAI are governed by their own open-source licenses (Apache-2.0 / MIT / BSD) - refer to upstream documentation. Red Hat Enterprise Linux AI requires a separate subscription from Red Hat. The full Terms of Service and Refund Policy are at https://www.copypastelearn.com/terms and /refund-policy.",
  );

  drawParagraph(
    ctx,
    "\u00a9 2026 Open Empower B.V. \u2014 De Boelelaan 471, 1082 RK Amsterdam, The Netherlands \u00b7 VAT NL866954958B01 \u00b7 CopyPasteLearn is a trademark of Open Empower B.V.",
  );

  return ctx.pdf.save();
}
