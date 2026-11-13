import type { HeroDemo } from "@/components/home/hero-terminal";

/**
 * Hero demos. Each output is a recording of a real run of the course lab
 * (trimmed, never edited): do not write an output by hand. `slug` is the
 * course the command comes from; the home page links to it only when that
 * course is published.
 */
export const HERO_DEMOS: (Omit<HeroDemo, "href"> & { slug: string })[] = [
  {
    id: "local-ai",
    slug: "local-ai-on-apple-silicon",
    tab: "Local AI",
    courseTitle: "Local AI on Apple Silicon",
    command: 'ollama run gemma4:e4b "Answer in five words: what is Ollama?" && ollama ps',
    output: [
      "Local AI large language model.",
      "",
      "NAME          ID              SIZE      PROCESSOR    CONTEXT    RUNNER",
      "gemma4:e4b    eb2177adf764    9.4 GB    100% GPU     32768      mlx",
    ],
    explain:
      "A model answering on your own Mac, all of it on the GPU. No API key, no bill per token.",
  },
  {
    id: "kubernetes",
    slug: "kagent-ai-agents-on-kubernetes",
    tab: "Agents on Kubernetes",
    courseTitle: "kagent 1.0: Run AI Agents on Kubernetes",
    command: "kind create cluster --name kagent",
    output: [
      'Creating cluster "kagent" ...',
      " ✓ Ensuring node image (kindest/node:v1.37.0)",
      " ✓ Preparing nodes",
      " ✓ Writing configuration",
      " ✓ Starting control-plane",
      " ✓ Installing CNI",
      " ✓ Installing StorageClass",
      'Set kubectl context to "kind-kagent"',
    ],
    explain:
      "A Kubernetes cluster on your laptop, ready for its first AI agent.",
  },
];
