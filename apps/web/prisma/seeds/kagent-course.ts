/**
 * kagent course seed (DRAFT).
 *
 * "kagent 1.0: Run AI Agents on Kubernetes" with six lessons.
 *
 * Idempotent, same style as the courses in prisma/seed.ts:
 *   - the course upsert has `update: {}`, so re-running never resets a status
 *     or a field that was edited in the admin after the first run;
 *   - lesson upserts refresh the text fields only. They do not set `status`,
 *     `videoPlaybackId` or `durationSeconds`: lessons are created as DRAFT with
 *     no video, and a re-run never overwrites a Mux playback ID that was added
 *     later.
 *
 * Wired from prisma/seed.ts (`pnpm db:seed`). To seed only this course, run
 * prisma/seed.kagent.ts instead.
 *
 * The YAML snippets are the manifests of the course lab, copied as they are
 * (screenshare-recorder: lessons/kagent/lab). Lesson sortOrder starts at 0: the first lesson is free to view.
 */

import type { PrismaClient } from "@prisma/client";

export const KAGENT_COURSE_SLUG = "kagent-ai-agents-on-kubernetes";

export const kagentLessons = [
  {
    title: "Install kagent 1.0 on a local Kubernetes cluster",
    slug: "install-kagent-on-kind",
    description: "Create a kind cluster on Kubernetes 1.37, install the kagent CLI and the kagent 1.0 release candidate, and check every component that the installer creates.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "CLI config (kagent-config.yaml)",
        language: "yaml",
        code: "install:\n  kagent:\n    valuesFiles: [kagent-values.yaml]"
      },
      {
        label: "Helm values (kagent-values.yaml)",
        language: "yaml",
        code: "config:\n  server:\n    grpcReflection: true"
      }
    ],
    resources: [
      {
        title: "kagent docs: Installation",
        url: "https://kagent.dev/docs/kagent/1.x/setup/installation/"
      },
      {
        title: "kagent on GitHub",
        url: "https://github.com/kagent-dev/kagent"
      }
    ]
  },
  {
    title: "Your first agent",
    slug: "your-first-agent",
    description: "Apply a Harness, an AgentTemplate and an Agent, wait for the Agent to become ready, then open a Session and talk to it.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "Harness (harness.yaml)",
        language: "yaml",
        code: "apiVersion: api.kagent.dev/v1alpha3\nkind: Harness\nmetadata:\n  name: my-first-harness\n  namespace: kagent\nspec:\n  kagent: {}\n  workload:\n    # kagent's native runtime image, pinned by digest\n    image: ghcr.io/kagent-dev/kagent/golang-adk@sha256:51859027b42b704c8f443876ef5155ace2f411752f297e5cb43e04d9b91545b7\n  substrate:\n    workerPoolRef:\n      name: kagent-default\n    snapshotPolicy:\n      # The bucket that the Agent Substrate chart creates in its bundled object store.\n      location: s3://ate-snapshots/kagent/"
      },
      {
        label: "AgentTemplate (template.yaml)",
        language: "yaml",
        code: "apiVersion: api.kagent.dev/v1alpha3\nkind: AgentTemplate\nmetadata:\n  name: my-first-template\n  namespace: kagent\nspec:\n  description: My first kagent agent\n  modelConfig:\n    # Default config created by the kagent install\n    name: default-model-config\n  systemPrompt: You are a concise, helpful assistant."
      },
      {
        label: "Agent (agent.yaml)",
        language: "yaml",
        code: "apiVersion: api.kagent.dev/v1alpha3\nkind: Agent\nmetadata:\n  name: my-first-agent\n  namespace: kagent\nspec:\n  template:\n    ref:\n      name: my-first-template\n  harnessRef:\n    name: my-first-harness"
      }
    ],
    resources: [
      {
        title: "kagent docs: Your first agent",
        url: "https://kagent.dev/docs/kagent/1.x/get-started/your-first-agent/"
      }
    ]
  },
  {
    title: "Give your agent tools with MCP",
    slug: "give-your-agent-tools-with-mcp",
    description: "List the tools of the built-in MCP server, bind two of them to your AgentTemplate and watch the agent answer from live cluster data.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "AgentTemplate with MCP tools (template.yaml)",
        language: "yaml",
        code: "apiVersion: api.kagent.dev/v1alpha3\nkind: AgentTemplate\nmetadata:\n  name: my-first-template\n  namespace: kagent\nspec:\n  description: My first kagent agent\n  modelConfig:\n    name: default-model-config\n  systemPrompt: |-\n    You are a concise, helpful assistant with read access to a Kubernetes cluster.\n    Use your tools to answer questions about what is running in the cluster.\n    When a question cannot be answered from the tools that you have, say so.\n  tools:\n    - mcp:\n        server:\n          kind: RemoteMCPServer\n          name: kagent-tool-server\n        tools:\n          - k8s_get_resources\n          - k8s_get_pod_logs"
      }
    ],
    resources: [
      {
        title: "kagent docs: Your first MCP tool",
        url: "https://kagent.dev/docs/kagent/1.x/get-started/your-first-mcp-tool/"
      }
    ]
  },
  {
    title: "Keep agents in a box with egress policies",
    slug: "egress-policies",
    description: "See what an agent may reach by default, grant one destination with an EgressPolicy, and check that kagent admitted it.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "EgressPolicy (egress-policy.yaml)",
        language: "yaml",
        code: "apiVersion: api.kagent.dev/v1alpha3\nkind: EgressPolicy\nmetadata:\n  name: npm-registry\n  namespace: kagent\nspec:\n  destinations:\n    - origin: https://registry.npmjs.org"
      },
      {
        label: "Select the policy on the agent",
        language: "bash",
        code: "kubectl patch agent my-first-agent -n kagent --type merge \\\n  -p '{\"spec\":{\"egressPolicyRefs\":[{\"name\":\"npm-registry\"}]}}'"
      }
    ],
    resources: [
      {
        title: "kagent docs: Egress policies",
        url: "https://kagent.dev/docs/kagent/1.x/agents/egress-policies/"
      }
    ]
  },
  {
    title: "Trace your agents with OpenTelemetry",
    slug: "trace-agents-with-opentelemetry",
    description: "Deploy the lightweight OTel stack, turn on tracing in kagent and read the spans of one agent request.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "Jaeger values (jaeger-values.yaml)",
        language: "yaml",
        code: "provisionDataStore:\n  cassandra: false\nallInOne:\n  enabled: true\nstorage:\n  type: memory\nagent:\n  enabled: false\ncollector:\n  enabled: false\nquery:\n  enabled: false"
      },
      {
        label: "Send kagent traces to the collector (kagent-telemetry.yaml)",
        language: "yaml",
        code: "config:\n  telemetry:\n    traces:\n      endpoint: http://otel-collector.telemetry.svc.cluster.local:4317\n      protocol: grpc\n  runtimeDefaults:\n    telemetry:\n      traces:\n        endpoint: http://otel-collector.telemetry.svc.cluster.local:4317\n        protocol: grpc"
      },
      {
        label: "Upgrade the kagent release",
        language: "bash",
        code: "helm upgrade kagent oci://ghcr.io/kagent-dev/kagent/helm/kagent \\\n  --version 1.0.0-rc3 \\\n  --namespace kagent --reuse-values \\\n  --values kagent-telemetry.yaml"
      }
    ],
    resources: [
      {
        title: "kagent docs: Lightweight OTel stack",
        url: "https://kagent.dev/docs/kagent/1.x/observability/lightweight-otel-stack/"
      },
      {
        title: "kagent docs: Tracing",
        url: "https://kagent.dev/docs/kagent/1.x/observability/tracing/"
      }
    ]
  },
  {
    title: "Suspend, resume and debug",
    slug: "suspend-resume-and-debug",
    description: "Understand what happens to an agent between turns, read the Agent conditions to find why one is not ready, and plan upgrades.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "A template that points at a missing MCP server (template.yaml)",
        language: "yaml",
        code: "apiVersion: api.kagent.dev/v1alpha3\nkind: AgentTemplate\nmetadata:\n  name: my-first-template\n  namespace: kagent\nspec:\n  description: My first kagent agent\n  modelConfig:\n    name: default-model-config\n  systemPrompt: |-\n    You are a concise, helpful assistant with read access to a Kubernetes cluster.\n    Use your tools to answer questions about what is running in the cluster.\n    When a question cannot be answered from the tools that you have, say so.\n  tools:\n    - mcp:\n        server:\n          kind: RemoteMCPServer\n          name: kagent-tools\n        tools:\n          - k8s_get_resources\n          - k8s_get_pod_logs"
      }
    ],
    resources: [
      {
        title: "kagent docs: Debug",
        url: "https://kagent.dev/docs/kagent/1.x/operations/debug/"
      },
      {
        title: "kagent docs: Suspend and resume",
        url: "https://kagent.dev/docs/kagent/1.x/about/substrate-runtime/suspend-and-resume/"
      }
    ]
  },
];

export async function seedKagentCourse(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { slug: KAGENT_COURSE_SLUG },
    update: {},
    create: {
      title: "kagent 1.0: Run AI Agents on Kubernetes",
      slug: KAGENT_COURSE_SLUG,
      description:
        "Install kagent 1.0, build a Kubernetes-native AI agent, give it MCP tools, contain it with egress policies and trace everything it does.",
      difficulty: "INTERMEDIATE",
      status: "DRAFT",
      sortOrder: 6,
      outcomes: [
        "Install kagent 1.0 and Agent Substrate on a local Kubernetes cluster",
        "Define an agent with a Harness, an AgentTemplate and an Agent, and talk to it through a Session",
        "Bind MCP tools to an agent and read what the model can call",
        "Control what an agent can reach with egress policies",
        "Trace agent requests with OpenTelemetry",
        "Suspend, resume and debug agents when something goes wrong",
      ],
      prerequisites: [
        "Comfortable with kubectl and YAML",
        "Docker or Podman installed",
        "An API key for a model provider (OpenAI or Anthropic)",
      ],
      estimatedDuration: 35,
    },
  });

  for (const lessonData of kagentLessons) {
    await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course.id, slug: lessonData.slug },
      },
      update: { ...lessonData },
      create: {
        ...lessonData,
        courseId: course.id,
        status: "DRAFT",
      },
    });
  }

  console.log(
    `  ✓ Course "${course.title}" (DRAFT) with ${kagentLessons.length} lessons`
  );
}
