---
title: "Energy-Efficient AI Infrastructure"
slug: "energy-efficient-ai-infrastructure"
date: "2025-12-14"
author: "Luca Berton"
description: "Build sustainable AI infrastructure with energy-efficient GPU scheduling, green computing practices, carbon-aware workloads, and cooling optimization."
category: "DevOps"
tags: ["green computing", "energy efficiency", "sustainable ai", "carbon-aware", "gpu optimization"]
---

AI training and inference consume massive energy. A single GPT-4 training run uses approximately 50 GWh — equivalent to powering 4,600 US homes for a year. Sustainable AI infrastructure is an engineering imperative.

## The Energy Problem

AI energy consumption is growing exponentially:

- **Training**: Large model training can cost $10M+ in electricity alone
- **Inference**: At scale, inference dominates total energy — 90%+ of compute after deployment
- **Cooling**: Data centers spend 30-40% of energy on cooling
- **Embodied carbon**: Manufacturing GPUs and servers has significant carbon footprint

## Carbon-Aware Workloads

Schedule compute when and where the grid is cleanest:

```python
import requests
from datetime import datetime

def get_carbon_intensity(region: str) -> float:
    """Get current grid carbon intensity (gCO2/kWh)."""
    resp = requests.get(
        f"https://api.electricitymap.org/v3/carbon-intensity/latest",
        params={"zone": region},
        headers={"auth-token": ELECTRICITY_MAP_TOKEN}
    )
    return resp.json()["carbonIntensity"]

def choose_training_region(regions: list[str]) -> str:
    """Pick the region with lowest carbon intensity."""
    intensities = {r: get_carbon_intensity(r) for r in regions}
    return min(intensities, key=intensities.get)

# Route training to greenest region
region = choose_training_region(["DE", "FR", "NO", "SE"])
# Norway/Sweden (hydro) typically 10-30 gCO2/kWh
# Germany (coal mix) can be 300-500 gCO2/kWh
```

## Kubernetes Green Scheduling

```yaml
# Carbon-aware Kubernetes scheduler
apiVersion: v1
kind: ConfigMap
metadata:
  name: carbon-scheduler-config
data:
  policy: |
    regions:
      - name: eu-north-1   # Sweden (hydro/wind)
        priority: 1
      - name: eu-west-1    # Ireland (wind)
        priority: 2
      - name: eu-central-1 # Germany (mixed)
        priority: 3
    rules:
      - type: training
        schedule: prefer-low-carbon
        defer_hours: 6  # Wait up to 6h for clean energy
      - type: inference
        schedule: latency-first  # Can't defer real-time
```

## Efficient Model Serving

Reduce inference energy per request:

| Optimization | Energy Savings | Implementation |
|-------------|---------------|----------------|
| Quantization (INT8) | 50-75% | Post-training quantization |
| Model distillation | 60-90% | Train smaller model |
| Batching | 30-50% | Group requests |
| Caching | 40-70% | Semantic response cache |
| Model routing | 50-80% | Small model handles easy queries |
| Speculative decoding | 20-40% | Draft model + verify |

## Cooling Innovation

Data center cooling is the largest non-compute cost:

- **Liquid cooling** — Direct-to-chip liquid cooling reduces cooling energy 40%
- **Immersion cooling** — Submerge servers in dielectric fluid for 90%+ cooling efficiency
- **Free cooling** — Use outside air when ambient temperature allows
- **Waste heat reuse** — Heat buildings, greenhouses, or district heating systems

## Measuring and Reporting

Track these sustainability metrics:

- **PUE** (Power Usage Effectiveness) — Total facility power / IT equipment power (target: < 1.2)
- **CUE** (Carbon Usage Effectiveness) — Total carbon / IT equipment energy
- **WUE** (Water Usage Effectiveness) — Water consumption / IT equipment energy
- **Energy per inference** — Joules per model prediction
- **Carbon per training run** — Total CO2e for training a model

## Best Practices

1. **Right-size GPU allocation** — Don't reserve H100s for workloads that fit on T4s
2. **Auto-scale to zero** — Shut down inference endpoints during off-hours
3. **Use ARM where possible** — Graviton/Ampere CPUs for non-GPU workloads (30% less energy)
4. **Choose efficient model architectures** — Mixture of Experts (MoE) use less compute per token
5. **Monitor idle GPU time** — Idle GPUs waste $2-3/hour each

## FAQ

**Does green AI compromise performance?**
Rarely. Quantization and caching improve latency while saving energy. Carbon-aware scheduling adds slight delays for batch jobs.

**How do I calculate my AI carbon footprint?**
Use tools like ML CO2 Impact, CodeCarbon, or cloud provider sustainability dashboards. Track GPU hours × grid carbon intensity.

**What's the business case for sustainable AI?**
Energy costs are 30-50% of AI infrastructure spend. Efficiency gains directly reduce costs while meeting ESG commitments.
