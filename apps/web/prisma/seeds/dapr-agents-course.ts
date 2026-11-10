/**
 * Dapr Agents course seed (DRAFT).
 *
 * "Build Durable AI Agents with Dapr Agents" with six lessons: the fourth course of the Agentic AI Academy
 * (after kagent 1.0, the MCP server course and the goose course).
 *
 * Idempotent, same style as the other Academy courses:
 *   - the course upsert has `update: {}`, so re-running never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only. They do not set `status`, `videoPlaybackId` or `durationSeconds`:
 *     lessons are created as DRAFT with no video, and a re-run never overwrites a Mux playback ID added later.
 *
 * To seed only this course, run prisma/seed.dapr.ts. The code snippets are the files and commands of the course lab
 * (screenshare-recorder: lessons/dapr-agents), copied as they are, without the final newline. Lesson sortOrder starts at
 * 0: the first lesson is free to view.
 */

import type { PrismaClient } from "@prisma/client";

export const DAPR_COURSE_SLUG = "build-durable-ai-agents-with-dapr-agents";

export const daprLessons = [
  {
    title: "Install Dapr and make a first model call",
    slug: "install-dapr-and-make-a-first-model-call",
    description: "Install the Dapr CLI and runtime without containers, start the three background services, set up a Python environment with dapr-agents, and call a model through a Dapr conversation component.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "curl -fsSL https://raw.githubusercontent.com/dapr/cli/v1.19.1/install/install.sh \\\n  | DAPR_INSTALL_DIR=$HOME/.local/bin bash -s 1.19.1\ndapr --version\ndapr init --slim --runtime-version 1.19.1\nbash services.sh start\npython3 -m venv .venv && source .venv/bin/activate\npip install dapr-agents==1.1.0\npip list | grep -i dapr\nmkdir resources"
      },
      {
        label: "Start placement, scheduler and Redis (services.sh)",
        language: "bash",
        code: "#!/usr/bin/env bash\n# Usage: bash services.sh start | stop\n# The three background services of this course. All listen on 127.0.0.1 only.\nRUN=\"$PWD/.services\"\nLOCAL=127.0.0.1\n\ncase \"$1\" in\nstart)\n  mkdir -p \"$RUN\"\n  ~/.dapr/bin/placement --listen-address $LOCAL --healthz-listen-address $LOCAL --healthz-port 18091 \\\n    --metrics-listen-address $LOCAL --metrics-port 19091 > \"$RUN/placement.log\" 2>&1 &\n  echo $! > \"$RUN/placement.pid\"\n  ~/.dapr/bin/scheduler --listen-address $LOCAL --healthz-listen-address $LOCAL --healthz-port 18092 \\\n    --metrics-listen-address $LOCAL --metrics-port 19092 --etcd-data-dir \"$RUN/scheduler-data\" \\\n    > \"$RUN/scheduler.log\" 2>&1 &\n  echo $! > \"$RUN/scheduler.pid\"\n  redis-server --bind $LOCAL --port 6379 --save \"\" --appendonly no > \"$RUN/redis.log\" 2>&1 &\n  echo $! > \"$RUN/redis.pid\"\n  sleep 3\n  ;;\nstop)\n  kill $(cat \"$RUN\"/*.pid) 2>/dev/null\n  rm -f \"$RUN\"/*.pid\n  ;;\nesac"
      },
      {
        label: "Conversation component for the model (resources/llm-provider.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Component\nmetadata:\n  name: llm-provider\nspec:\n  type: conversation.openai\n  version: v1\n  metadata:\n    - name: key\n      envRef: LLM_API_KEY\n    - name: endpoint\n      envRef: LLM_ENDPOINT\n    - name: model\n      envRef: LLM_MODEL"
      },
      {
        label: "First model call (llm_call.py)",
        language: "python",
        code: "from dapr_agents.llm import DaprChatClient\n\nllm = DaprChatClient(component_name=\"llm-provider\")\nresponse = llm.generate(\"In one sentence, what is a durable workflow?\")\nprint(response.get_message().content)"
      }
    ],
    resources: [
      {
        title: "Dapr docs: install the Dapr CLI",
        url: "https://docs.dapr.io/getting-started/install-dapr-cli/"
      },
      {
        title: "Dapr docs: initialize Dapr in self-hosted mode",
        url: "https://docs.dapr.io/getting-started/install-dapr-selfhost/"
      },
      {
        title: "Dapr Agents on GitHub",
        url: "https://github.com/dapr/dapr-agents"
      }
    ]
  },
  {
    title: "A durable agent that survives a restart",
    slug: "a-durable-agent-that-survives-a-restart",
    description: "Give an agent a tool, run it as a durable workflow, stop it while the tool is running, start it again and watch the workflow finish. Then read the history in the command line and in Diagrid's Dev Dashboard.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "dapr run --app-id order-agent --resources-path resources --log-level error \\\n  -- python agent.py > agent.log 2>&1 & echo $! > agent.pid\nexport ID=$(curl -s -X POST localhost:8001/agent/run \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"task\": \"Where is order A-1001?\"}' | jq -r .instance_id)\ncurl -s localhost:8001/agent/instances/$ID \\\n  | jq '{status: .runtime_status, answer: (.serialized_output | fromjson | .content)}'\ndapr workflow history --app-id order-agent $ID \\\n  | awk '$1 == \"TaskScheduled\" {print $2, $3}'"
      },
      {
        label: "The tool (tools.py)",
        language: "python",
        code: "import asyncio\nimport time\n\nfrom dapr_agents import tool\n\nORDERS = {\n    \"A-1001\": \"shipped on 3 Nov, arrives on 12 Nov\",\n    \"A-1002\": \"packed, ships tomorrow\",\n}\n\n\n@tool\nasync def check_order(order_id: str) -> str:\n    \"\"\"Look up the status of an order by its ID.\"\"\"\n    with open(\"tool-calls.log\", \"a\") as log:\n        log.write(f\"{time.strftime('%H:%M:%S')} check_order {order_id}\\n\")\n    await asyncio.sleep(12)  # a slow back end\n    return ORDERS.get(order_id, \"no such order\")"
      },
      {
        label: "The durable agent (agent.py)",
        language: "python",
        code: "from dapr_agents import AgentRunner, DurableAgent\nfrom dapr_agents.agents.configs import AgentMemoryConfig, AgentStateConfig\nfrom dapr_agents.llm import DaprChatClient\nfrom dapr_agents.storage.daprstores.stateservice import StateStoreService\n\nfrom tools import check_order\n\nagent = DurableAgent(\n    name=\"OrderAgent\",\n    role=\"Order desk assistant\",\n    instructions=[\"Answer questions about orders.\", \"Use the tool. Never guess a status.\"],\n    tools=[check_order],\n    llm=DaprChatClient(component_name=\"llm-provider\"),\n    state=AgentStateConfig(store=StateStoreService(store_name=\"agent-state\")),\n    memory=AgentMemoryConfig(summarize_on_completion=False),\n)\n\nrunner = AgentRunner()\ntry:\n    runner.serve(agent, host=\"127.0.0.1\", port=8001)\nfinally:\n    runner.shutdown(agent)"
      },
      {
        label: "State store for the workflow history (resources/agent-state.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Component\nmetadata:\n  name: agent-state\nspec:\n  type: state.redis\n  version: v1\n  metadata:\n    - name: redisHost\n      value: 127.0.0.1:6379\n    - name: redisPassword\n      value: \"\"\n    - name: actorStateStore\n      value: \"true\""
      }
    ],
    resources: [
      {
        title: "Dapr docs: Workflow overview",
        url: "https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-overview/"
      },
      {
        title: "Diagrid Dev Dashboard",
        url: "https://docs.dapr.io/developing-applications/local-development/dapr-dev-dashboard/"
      },
      {
        title: "Dapr Agents quickstarts",
        url: "https://github.com/dapr/dapr-agents/tree/main/quickstarts"
      }
    ]
  },
  {
    title: "Workflows that mix model steps and plain steps",
    slug: "workflows-that-mix-model-steps-and-plain-steps",
    description: "Write a workflow by hand with activities, a retry policy and a conditional model step, and run it with the dapr workflow commands.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "dapr run --app-id digest --resources-path resources --log-level error \\\n  -- python workflow.py > workflow.log 2>&1 & echo $! > workflow.pid\ndapr workflow run daily_digest --app-id digest --instance-id digest-1 --input tickets.json\ndapr workflow list --app-id digest\ndapr workflow history --app-id digest digest-1 \\\n  | awk '$1 == \"TaskScheduled\" {print $2}'"
      },
      {
        label: "Sample data (tickets.json)",
        language: "json",
        code: "[\n  {\"id\": \"T-101\", \"title\": \"Refund not received after 10 days\", \"priority\": \"high\", \"status\": \"open\"},\n  {\"id\": \"T-102\", \"title\": \"Wrong size delivered\", \"priority\": \"medium\", \"status\": \"closed\"},\n  {\"id\": \"T-103\", \"title\": \"Parcel marked delivered but missing\", \"priority\": \"high\", \"status\": \"open\"},\n  {\"id\": \"T-104\", \"title\": \"Invoice needs a company name\", \"priority\": \"low\", \"status\": \"open\"},\n  {\"id\": \"T-105\", \"title\": \"Discount code rejected\", \"priority\": \"medium\", \"status\": \"closed\"}\n]"
      },
      {
        label: "The workflow with activities and a retry policy (workflow.py)",
        language: "python",
        code: "import json\nimport threading\nfrom datetime import timedelta\n\nimport dapr.ext.workflow as wf\nfrom dapr_agents.llm import DaprChatClient\n\nwfr = wf.WorkflowRuntime()\nllm = DaprChatClient(component_name=\"llm-provider\")\nRETRY = wf.RetryPolicy(first_retry_interval=timedelta(seconds=2), max_number_of_attempts=3)\n\n\n@wfr.workflow(name=\"daily_digest\")\ndef daily_digest(ctx: wf.DaprWorkflowContext, path: str):\n    tickets = yield ctx.call_activity(load_open_tickets, input=path)\n    draft = yield ctx.call_activity(write_digest, input=tickets, retry_policy=RETRY)\n    missing = yield ctx.call_activity(find_missing_ids, input={\"draft\": draft, \"tickets\": tickets})\n    if missing:\n        draft = yield ctx.call_activity(\n            revise_digest, input={\"draft\": draft, \"missing\": missing}, retry_policy=RETRY\n        )\n    yield ctx.call_activity(save_digest, input=draft)\n    return {\"tickets\": len(tickets), \"revised\": bool(missing)}\n\n\n@wfr.activity(name=\"load_open_tickets\")\ndef load_open_tickets(ctx, path: str) -> list:\n    with open(path) as f:\n        return [t for t in json.load(f) if t[\"status\"] == \"open\"]\n\n\n@wfr.activity(name=\"write_digest\")\ndef write_digest(ctx, tickets: list) -> str:\n    lines = \"\\n\".join(f\"{t['id']}: {t['title']} ({t['priority']})\" for t in tickets)\n    prompt = f\"Write a three-line digest of these open tickets. Mention every ID.\\n{lines}\"\n    return llm.generate(prompt).get_message().content\n\n\n@wfr.activity(name=\"find_missing_ids\")\ndef find_missing_ids(ctx, data: dict) -> list:\n    return [t[\"id\"] for t in data[\"tickets\"] if t[\"id\"] not in data[\"draft\"]]\n\n\n@wfr.activity(name=\"revise_digest\")\ndef revise_digest(ctx, data: dict) -> str:\n    prompt = f\"Rewrite this digest so that it also mentions {data['missing']}:\\n{data['draft']}\"\n    return llm.generate(prompt).get_message().content\n\n\n@wfr.activity(name=\"save_digest\")\ndef save_digest(ctx, draft: str) -> None:\n    with open(\"digest.md\", \"w\") as f:\n        f.write(draft + \"\\n\")\n\n\nif __name__ == \"__main__\":\n    wfr.start()\n    print(\"Workflow runtime started\", flush=True)\n    threading.Event().wait()"
      }
    ],
    resources: [
      {
        title: "Dapr docs: Workflow patterns",
        url: "https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/"
      },
      {
        title: "Dapr docs: Python workflow SDK",
        url: "https://docs.dapr.io/developing-applications/sdks/python/python-workflow/"
      }
    ]
  },
  {
    title: "The agent as an HTTP service",
    slug: "the-agent-as-an-http-service",
    description: "Use the routes of the agent service, poll a task to its end, terminate and purge instances, see how bad requests are rejected, and keep the service on the loopback address.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "dapr run --app-id order-agent --resources-path resources --log-level error \\\n  -- python agent.py > agent.log 2>&1 & echo $! > agent.pid\ncurl -s localhost:8001/openapi.json | jq -r '.paths | keys[]'\npython ask.py \"Where is order A-1002?\"\nexport ID=$(curl -s -X POST localhost:8001/agent/run \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"task\": \"Where is order A-1001?\"}' | jq -r .instance_id)\ncurl -s -X POST localhost:8001/agent/instances/$ID/terminate\ncurl -s localhost:8001/agent/instances/$ID | jq -r .runtime_status\ncurl -s -X POST localhost:8001/agent/instances/$ID/purge\ncurl -s -o /dev/null -w '%{http_code}\\n' localhost:8001/agent/instances/$ID"
      },
      {
        label: "A client that posts a task and polls it (ask.py)",
        language: "python",
        code: "import json\nimport sys\nimport time\nimport urllib.request\n\nBASE = \"http://127.0.0.1:8001/agent\"\n\n\ndef call(path, body=None):\n    data = json.dumps(body).encode() if body else None\n    headers = {\"Content-Type\": \"application/json\"}\n    request = urllib.request.Request(BASE + path, data=data, headers=headers)\n    with urllib.request.urlopen(request) as response:\n        return json.load(response)\n\n\ninstance_id = call(\"/run\", {\"task\": sys.argv[1]})[\"instance_id\"]\nprint(\"started\", instance_id)\nwhile True:\n    state = call(f\"/instances/{instance_id}\")\n    if state[\"runtime_status\"] not in (\"RUNNING\", \"PENDING\"):\n        break\n    time.sleep(2)\nprint(state[\"runtime_status\"])\nprint(json.loads(state[\"serialized_output\"])[\"content\"])"
      }
    ],
    resources: [
      {
        title: "Dapr Agents on GitHub",
        url: "https://github.com/dapr/dapr-agents"
      }
    ]
  },
  {
    title: "Two agents talking through pub/sub",
    slug: "two-agents-talking-through-pub-sub",
    description: "Build a small team: an order agent, a policy agent and a desk that hands tasks to both through Redis pub/sub and a registry. Start all three with one command and follow the workflows in the dashboard.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "dapr run -f dapr.yaml > desk.log 2>&1 & echo $! > desk.pid\ndapr publish --publish-app-id order-agent --pubsub agent-pubsub --topic desk.order.requests \\\n  --data '{\"task\": \"Where is order A-1002?\"}'\ndapr workflow list --app-id order-agent\nexport ID=$(curl -s -X POST localhost:8004/agent/run \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"task\": \"Customer asks: order A-1001 never arrived, can I get a refund?\"}' | jq -r .instance_id)\ncurl -s localhost:8004/agent/instances/$ID \\\n  | jq -r '.serialized_output | fromjson | .content'"
      },
      {
        label: "Redis pub/sub (resources/agent-pubsub.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Component\nmetadata:\n  name: agent-pubsub\nspec:\n  type: pubsub.redis\n  version: v1\n  metadata:\n    - name: redisHost\n      value: 127.0.0.1:6379\n    - name: redisPassword\n      value: \"\""
      },
      {
        label: "Agent registry (resources/agent-registry.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Component\nmetadata:\n  name: agent-registry\nspec:\n  type: state.redis\n  version: v1\n  metadata:\n    - name: redisHost\n      value: 127.0.0.1:6379\n    - name: redisPassword\n      value: \"\"\n    - name: keyPrefix\n      value: none"
      },
      {
        label: "Three agents in one file (team.py)",
        language: "python",
        code: "import asyncio\nimport sys\n\nfrom dapr_agents import AgentRunner, DurableAgent\nfrom dapr_agents.agents.configs import (AgentExecutionConfig, AgentMemoryConfig, AgentPubSubConfig,\n                                        AgentRegistryConfig, AgentStateConfig, OrchestrationMode)\nfrom dapr_agents.llm import DaprChatClient\nfrom dapr_agents.storage.daprstores.stateservice import StateStoreService\nfrom dapr_agents.workflow.utils.core import wait_for_shutdown\n\nfrom tools import check_order\n\nshared = dict(\n    llm=DaprChatClient(component_name=\"llm-provider\"),\n    registry=AgentRegistryConfig(store=StateStoreService(store_name=\"agent-registry\"), team_name=\"desk\"),\n    state=AgentStateConfig(store=StateStoreService(store_name=\"agent-state\")),\n    memory=AgentMemoryConfig(summarize_on_completion=False),\n)\n\n\ndef topic(name: str) -> AgentPubSubConfig:\n    return AgentPubSubConfig(pubsub_name=\"agent-pubsub\", agent_topic=f\"desk.{name}.requests\")\n\n\ndef build(which: str) -> DurableAgent:\n    if which == \"order\":\n        return DurableAgent(\n            name=\"OrderAgent\",\n            role=\"Order desk assistant\",\n            instructions=[\"Answer questions about orders.\", \"Use the tool. Never guess a status.\"],\n            tools=[check_order],\n            pubsub=topic(\"order\"),\n            **shared,\n        )\n    if which == \"policy\":\n        return DurableAgent(\n            name=\"PolicyAgent\",\n            role=\"Refund policy advisor\",\n            instructions=[\n                \"A parcel is refunded in full within 14 days of delivery.\",\n                \"After 14 days the customer gets store credit only.\",\n                \"Answer in two sentences, using the order status you are given.\",\n            ],\n            pubsub=topic(\"policy\"),\n            **shared,\n        )\n    return DurableAgent(\n        name=\"Desk\",\n        pubsub=topic(\"desk\"),\n        execution=AgentExecutionConfig(\n            max_iterations=2, orchestration_mode=OrchestrationMode.ROUNDROBIN\n        ),\n        **shared,\n    )\n\n\nasync def listen(agent: DurableAgent) -> None:\n    runner = AgentRunner()\n    try:\n        runner.subscribe(agent)\n        await wait_for_shutdown()\n    finally:\n        runner.shutdown(agent)\n\n\nif __name__ == \"__main__\":\n    which = sys.argv[1]\n    agent = build(which)\n    if which == \"desk\":\n        runner = AgentRunner()\n        try:\n            runner.serve(agent, host=\"127.0.0.1\", port=8004)\n        finally:\n            runner.shutdown(agent)\n    else:\n        asyncio.run(listen(agent))"
      },
      {
        label: "Multi-app run file (dapr.yaml)",
        language: "yaml",
        code: "version: 1\ncommon:\n  resourcesPath: ./resources\n  logLevel: error\napps:\n  - appID: order-agent\n    appDirPath: ./\n    command: [\"python\", \"team.py\", \"order\"]\n  - appID: policy-agent\n    appDirPath: ./\n    command: [\"python\", \"team.py\", \"policy\"]\n  - appID: desk\n    appDirPath: ./\n    command: [\"python\", \"team.py\", \"desk\"]"
      }
    ],
    resources: [
      {
        title: "Dapr docs: Publish and subscribe",
        url: "https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-overview/"
      },
      {
        title: "Dapr docs: Multi-app run",
        url: "https://docs.dapr.io/developing-applications/local-development/multi-app-dapr-run/multi-app-overview/"
      }
    ]
  },
  {
    title: "See what the agent did, then harden it",
    slug: "see-what-the-agent-did-then-harden-it",
    description: "Print the traces of the agent and the sidecar, move the model key into a secret store that denies direct reads, and add a resiliency policy with retries. Check components, resiliency and configuration in the dashboard.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "dapr run --app-id order-agent --resources-path resources --config config.yaml \\\n  --dapr-http-port 3500 --log-level error -- python agent.py > agent.log 2>&1 & echo $! > agent.pid\nexport ID=$(curl -s -X POST localhost:8001/agent/run \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"task\": \"Where is order A-1002?\"}' | jq -r .instance_id)\nkill $(cat agent.pid); wait $(cat agent.pid)\ncurl -s -o /dev/null -w '%{http_code}\\n' localhost:3500/v1.0/secrets/env-secrets/LLM_API_KEY\npython3 -m http.server 9099 --bind 127.0.0.1 > broken.log 2>&1 & echo $! > broken.pid\nkill $(cat broken.pid agent.pid); bash services.sh stop\ndapr uninstall"
      },
      {
        label: "Sidecar configuration with tracing (config.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Configuration\nmetadata:\n  name: agent-config\nspec:\n  tracing:\n    samplingRate: \"1\"\n    stdout: true"
      },
      {
        label: "The agent with observability on (agent.py)",
        language: "python",
        code: "from dapr_agents import AgentRunner, DurableAgent\nfrom dapr_agents.agents.configs import (AgentMemoryConfig, AgentObservabilityConfig, AgentStateConfig,\n                                        AgentTracingExporter)\nfrom dapr_agents.llm import DaprChatClient\nfrom dapr_agents.storage.daprstores.stateservice import StateStoreService\n\nfrom tools import check_order\n\nagent = DurableAgent(\n    name=\"OrderAgent\",\n    role=\"Order desk assistant\",\n    instructions=[\"Answer questions about orders.\", \"Use the tool. Never guess a status.\"],\n    tools=[check_order],\n    llm=DaprChatClient(component_name=\"llm-provider\"),\n    state=AgentStateConfig(store=StateStoreService(store_name=\"agent-state\")),\n    memory=AgentMemoryConfig(summarize_on_completion=False),\n    agent_observability=AgentObservabilityConfig(\n        enabled=True, tracing_enabled=True, tracing_exporter=AgentTracingExporter.CONSOLE\n    ),\n)\n\nrunner = AgentRunner()\ntry:\n    runner.serve(agent, host=\"127.0.0.1\", port=8001)\nfinally:\n    runner.shutdown(agent)"
      },
      {
        label: "A secret store backed by the environment (resources/env-secrets.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Component\nmetadata:\n  name: env-secrets\nspec:\n  type: secretstores.local.env\n  version: v1"
      },
      {
        label: "Model component with a secret reference (resources/llm-provider.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Component\nmetadata:\n  name: llm-provider\nspec:\n  type: conversation.openai\n  version: v1\n  metadata:\n    - name: key\n      secretKeyRef:\n        name: LLM_API_KEY\n        key: LLM_API_KEY\n    - name: endpoint\n      envRef: LLM_ENDPOINT\n    - name: model\n      envRef: LLM_MODEL\nauth:\n  secretStore: env-secrets"
      },
      {
        label: "Configuration that denies direct secret reads (config.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Configuration\nmetadata:\n  name: agent-config\nspec:\n  tracing:\n    samplingRate: \"1\"\n    stdout: true\n  secrets:\n    scopes:\n      - storeName: env-secrets\n        defaultAccess: deny"
      },
      {
        label: "Resiliency policy with retries (resources/resiliency.yaml)",
        language: "yaml",
        code: "apiVersion: dapr.io/v1alpha1\nkind: Resiliency\nmetadata:\n  name: agent-resiliency\nspec:\n  policies:\n    timeouts:\n      model: 60s\n    retries:\n      model-retry:\n        policy: constant\n        duration: 2s\n        maxRetries: 3\n  targets:\n    components:\n      llm-provider:\n        outbound:\n          timeout: model\n          retry: model-retry"
      }
    ],
    resources: [
      {
        title: "Dapr docs: Resiliency",
        url: "https://docs.dapr.io/operations/resiliency/resiliency-overview/"
      },
      {
        title: "Dapr docs: Secrets",
        url: "https://docs.dapr.io/developing-applications/building-blocks/secrets/secrets-overview/"
      },
      {
        title: "Dapr docs: Tracing",
        url: "https://docs.dapr.io/operations/observability/tracing/tracing-overview/"
      }
    ]
  }
];

export async function seedDaprCourse(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { slug: DAPR_COURSE_SLUG },
    update: {},
    create: {
      title: "Build Durable AI Agents with Dapr Agents",
      slug: DAPR_COURSE_SLUG,
      description:
        "Build AI agents that survive restarts: Dapr Agents runs each agent as a durable workflow, saves every step, and lets a team of agents talk through pub/sub. Runs on your laptop, no containers.",
      difficulty: "INTERMEDIATE",
      status: "DRAFT",
      sortOrder: 9,
      outcomes: [
        "Install Dapr in self-hosted mode without containers and start the services that durable workflows need",
        "Call a model through a Dapr conversation component instead of a vendor SDK",
        "Run an agent as a durable workflow, stop it in the middle of a tool call and watch it finish after a restart",
        "Write workflows by hand with activities, retries and conditional model steps",
        "Serve an agent over HTTP, and connect several agents with pub/sub and a registry",
        "Read what an agent did with the workflow history, traces and the Dev Dashboard, and harden it with a secret store and a resiliency policy",
      ],
      prerequisites: [
        "Comfortable with Python and the command line",
        "Python 3.11 to 3.14, curl, jq and Redis installed",
        "Access to an OpenAI-compatible model endpoint that supports tool calling",
      ],
      estimatedDuration: 30,
    },
  });

  for (const lessonData of daprLessons) {
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
    `  ✓ Course "${course.title}" (DRAFT) with ${daprLessons.length} lessons`
  );
}
