/**
 * The courses of the Agentic AI Academy, in the order to take them. Pages
 * link a course only when it is PUBLISHED in the database, so nothing ever
 * points to a 404.
 */
export const ACADEMY_COURSES = [
  {
    slug: "kagent-ai-agents-on-kubernetes",
    title: "kagent 1.0: Run AI Agents on Kubernetes",
    summary:
      "Install kagent, build a Kubernetes-native agent, give it MCP tools, contain it with egress policies and trace everything it does.",
    topics: ["Agent Substrate sandboxes", "MCP tools", "Egress policies", "OpenTelemetry tracing"],
  },
  {
    slug: "build-and-secure-an-mcp-server",
    title: "Build and Secure an MCP Server",
    summary:
      "Build a real MCP server in Python with the official SDK, serve it over HTTP, add authentication and hardening, then deploy it to a kagent cluster.",
    topics: ["Typed tools, resources, prompts", "Streamable HTTP", "Authentication", "Deploy to Kubernetes"],
  },
  {
    slug: "coding-agents-in-production-goose-agents-md",
    title: "Run Coding Agents in Production with goose and AGENTS.md",
    summary:
      "Install goose, teach it your project's rules with AGENTS.md, then run it the way a team does: recipes, CI, guardrails and a record of what it did.",
    topics: ["AGENTS.md", "Recipes", "GitHub Actions", "Guardrails with hooks"],
  },
  {
    slug: "build-durable-ai-agents-with-dapr-agents",
    title: "Build Durable AI Agents with Dapr Agents",
    summary:
      "Build an agent that survives restarts, combines model calls with workflow steps, and communicates with other agents.",
    topics: ["Durable workflows", "HTTP services", "Pub/sub", "Activity history"],
  },
  {
    slug: "observe-and-debug-ai-agents-with-opentelemetry",
    title: "Observe and Debug AI Agents with OpenTelemetry",
    summary:
      "Trace agent runs and model calls, route telemetry through a collector, and diagnose failures in Jaeger.",
    topics: ["Model-call traces", "Jaeger", "Agent metrics", "OpenTelemetry Collector"],
  },
];
