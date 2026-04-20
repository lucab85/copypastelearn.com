---
title: "AI Infrastructure Cost Optimization"
slug: "ai-infrastructure-cost-optimization"
date: "2025-12-23"
author: "Luca Berton"
description: "Reduce AI infrastructure costs with GPU scheduling, model optimization, spot instances, and intelligent routing strategies for ML workloads."
category: "AI Tools"
tags: ["ai costs", "gpu optimization", "ml infrastructure", "cost management", "model serving"]
---

AI infrastructure costs can spiral quickly. A single H100 GPU costs $2-3/hour in the cloud. Training runs and inference at scale easily reach six or seven figures monthly.

## Where the Money Goes

Typical AI infrastructure cost breakdown:

- **Training compute** — 40-60% (GPU hours for model training)
- **Inference serving** — 20-35% (GPU/CPU for production predictions)
- **Storage** — 10-15% (datasets, model checkpoints, logs)
- **Networking** — 5-10% (data transfer, especially multi-region)
- **Human overhead** — Often underestimated (MLOps engineering time)

## GPU Scheduling Optimization

Maximize GPU utilization to reduce waste:

```yaml
# Kubernetes GPU time-slicing
apiVersion: v1
kind: ConfigMap
metadata:
  name: gpu-sharing-config
data:
  any: |-
    version: v1
    sharing:
      timeSlicing:
        resources:
        - name: nvidia.com/gpu
          replicas: 4
```

Time-slicing lets 4 workloads share one GPU — ideal for inference and development.

### Multi-Instance GPU (MIG)

For H100/A100 GPUs, MIG provides hardware isolation:

```bash
# Create MIG instances
nvidia-smi mig -i 0 -cgi 9,9,9 -C

# Verify
nvidia-smi mig -i 0 -lgi
```

Each MIG instance gets dedicated memory and compute — better isolation than time-slicing.

## Model Optimization Techniques

Smaller models = cheaper inference:

| Technique | Size Reduction | Speed Improvement | Accuracy Loss |
|-----------|---------------|-------------------|---------------|
| Quantization (INT8) | 2-4x | 2-3x | < 1% |
| Quantization (INT4) | 4-8x | 3-5x | 1-3% |
| Pruning | 2-10x | 2-5x | 1-5% |
| Distillation | 3-10x | 3-10x | 2-5% |
| LoRA adapters | N/A | Faster FT | Minimal |

## Intelligent Model Routing

Route requests to the cheapest model that can handle them:

```python
def route_request(prompt: str, complexity: str) -> str:
    if complexity == "simple":
        # Small model: $0.001/request
        return call_model("llama-3-8b", prompt)
    elif complexity == "medium":
        # Medium model: $0.01/request
        return call_model("llama-3-70b", prompt)
    else:
        # Large model: $0.10/request
        return call_model("gpt-4o", prompt)
```

A classifier routes 80% of requests to cheap models, saving 70%+ on inference costs.

## Spot Instances for Training

Use spot/preemptible instances for fault-tolerant training:

```python
# PyTorch checkpoint for spot instance resilience
def save_checkpoint(model, optimizer, epoch, path):
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, path)

# Resume from checkpoint after interruption
checkpoint = torch.load(path)
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
```

Implement checkpointing every 10-30 minutes to minimize lost work on preemption.

## Caching and Batching

Reduce redundant computation:

- **Semantic caching** — Cache responses for similar prompts (save 30-50% on repeated queries)
- **Request batching** — Batch inference requests for better GPU utilization
- **KV cache optimization** — Reduce memory usage for long-context inference
- **CDN for embeddings** — Cache embedding vectors for frequently accessed documents

## Cost Monitoring Dashboard

Track these metrics:

- **Cost per inference request** — By model, by endpoint
- **GPU utilization percentage** — Target 80%+ during business hours
- **Spot vs. on-demand ratio** — Higher spot = lower costs
- **Model efficiency** — Tokens per second per dollar
- **Idle GPU hours** — Waste that can be eliminated with better scheduling

## FAQ

**What's a reasonable AI infrastructure budget?**
Depends on scale. Startups: $5K-50K/month. Mid-market: $50K-500K/month. Enterprise: $500K-10M+/month.

**Should I use cloud GPUs or buy hardware?**
Cloud for variable workloads and experimentation. Own hardware when sustained utilization exceeds 60% (breakeven typically 12-18 months).

**How much can optimization actually save?**
Typically 40-70% reduction through quantization, routing, caching, and spot instances combined.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
