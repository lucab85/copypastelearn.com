/**
 * OpenTelemetry course seed (DRAFT).
 *
 * "Observe and Debug AI Agents with OpenTelemetry" with six lessons: the fifth course of the Agentic AI Academy.
 *
 * Idempotent, same style as the other Academy courses:
 *   - the course upsert has `update: {}`, so re-running never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only. They do not set `status`, `videoPlaybackId` or `durationSeconds`:
 *     lessons are created as DRAFT with no video, and a re-run never overwrites a Mux playback ID added later.
 *
 * To seed only this course, run prisma/seed.otel.ts. The code snippets are the files and commands of the course lab
 * (screenshare-recorder: lessons/otel-agents), copied as they are, without the final newline. Lesson sortOrder starts at
 * 0: the first lesson is free to view.
 */

import type { PrismaClient } from "@prisma/client";

export const OTEL_COURSE_SLUG = "observe-and-debug-ai-agents-with-opentelemetry";

export const otelLessons = [
  {
    title: "One model call as a trace",
    slug: "one-model-call-as-a-trace",
    description: "Set up the OpenTelemetry Python SDK, make one model call and record it as a span named and described by the GenAI conventions. Print the span to a file and read it with jq.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "python3 -m venv .venv && source .venv/bin/activate\npip install -q openai==3.49.0 opentelemetry-sdk==1.45.2 \\\n  opentelemetry-exporter-otlp-proto-http==1.45.2\npip list | grep -iE '^(openai|opentelemetry)'\npython call.py\njq '{name, kind, status: .status.status_code, attributes}' spans.jsonl"
      },
      {
        label: "The tracer set-up and one model call as a span (telemetry.py)",
        language: "python",
        code: "\"\"\"Tracing for the release agent: the set-up, and one model call as one span.\"\"\"\nimport json\nimport os\n\nfrom openai import OpenAI\nfrom opentelemetry import trace\nfrom opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter\nfrom opentelemetry.sdk.resources import Resource\nfrom opentelemetry.sdk.trace import TracerProvider\nfrom opentelemetry.sdk.trace.export import (BatchSpanProcessor, ConsoleSpanExporter,\n                                            SimpleSpanProcessor)\nfrom opentelemetry.trace import SpanKind\n\nMODEL = os.environ[\"LLM_MODEL\"]\nCAPTURE = os.environ.get(\"OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT\") == \"true\"\nOTLP = (\"OTEL_EXPORTER_OTLP_ENDPOINT\", \"OTEL_EXPORTER_OTLP_TRACES_ENDPOINT\")\nclient = OpenAI()\ntracer = trace.get_tracer(\"release-agent\")\n\n\ndef setup(service: str = \"release-agent\") -> TracerProvider:\n    provider = TracerProvider(resource=Resource.create({\"service.name\": service}))\n    if any(os.environ.get(name) for name in OTLP):\n        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))\n    else:\n        out = open(\"spans.jsonl\", \"w\")\n        console = ConsoleSpanExporter(out=out, formatter=lambda s: s.to_json(indent=None) + \"\\n\")\n        provider.add_span_processor(SimpleSpanProcessor(console))\n    trace.set_tracer_provider(provider)\n    return provider\n\n\ndef _parts(m: dict) -> list:\n    if m.get(\"tool_calls\"):\n        return [{\"type\": \"tool_call\", \"id\": c[\"id\"], \"name\": c[\"function\"][\"name\"],\n                 \"arguments\": c[\"function\"][\"arguments\"]} for c in m[\"tool_calls\"]]\n    if m[\"role\"] == \"tool\":\n        return [{\"type\": \"tool_call_response\", \"id\": m[\"tool_call_id\"], \"response\": m[\"content\"]}]\n    return [{\"type\": \"text\", \"content\": m[\"content\"]}]\n\n\ndef _messages(items: list) -> str:\n    return json.dumps([{\"role\": m[\"role\"], \"parts\": _parts(m)} for m in items])\n\n\ndef chat(messages: list, tools: list | None = None) -> dict:\n    \"\"\"One model call. The span name is the operation, then the model, as the conventions say.\"\"\"\n    with tracer.start_as_current_span(f\"chat {MODEL}\", kind=SpanKind.CLIENT) as span:\n        span.set_attributes({\"gen_ai.operation.name\": \"chat\",\n                             \"gen_ai.provider.name\": \"openai\",\n                             \"gen_ai.request.model\": MODEL})\n        extra = {\"tools\": tools} if tools else {}\n        response = client.chat.completions.create(model=MODEL, messages=messages, **extra)\n        choice = response.choices[0]\n        message = choice.message.model_dump(exclude_none=True)\n        usage = response.usage\n        tokens_in, tokens_out = (usage.prompt_tokens, usage.completion_tokens) if usage else (0, 0)\n        if tokens_in + tokens_out == 0:  # this endpoint reports no usage: estimate, and mark it\n            tokens_in, tokens_out = len(json.dumps(messages)) // 4, len(json.dumps(message)) // 4\n            span.set_attribute(\"app.usage.estimated\", True)\n        span.set_attributes({\"gen_ai.response.id\": response.id,\n                             \"gen_ai.response.model\": response.model,\n                             \"gen_ai.response.finish_reasons\": [choice.finish_reason],\n                             \"gen_ai.usage.input_tokens\": tokens_in,\n                             \"gen_ai.usage.output_tokens\": tokens_out})\n        if CAPTURE:  # opt-in: prompts and answers can hold personal data\n            span.set_attributes({\"gen_ai.input.messages\": _messages(messages),\n                                 \"gen_ai.output.messages\": _messages([message])})\n        return message"
      },
      {
        label: "The program that makes the call (call.py)",
        language: "python",
        code: "from telemetry import chat, setup\n\nprovider = setup()\nquestion = \"In one sentence: why should a release agent be observable?\"\nreply = chat([{\"role\": \"user\", \"content\": question}])\nprint(reply[\"content\"])\nprovider.shutdown()"
      }
    ],
    resources: [
      {
        title: "OpenTelemetry GenAI semantic conventions",
        url: "https://opentelemetry.io/docs/specs/semconv/gen-ai/"
      },
      {
        title: "OpenTelemetry Python",
        url: "https://opentelemetry.io/docs/languages/python/"
      }
    ]
  },
  {
    title: "An agent loop as a trace tree",
    slug: "an-agent-loop-as-a-trace-tree",
    description: "Trace a small tool-calling agent: one span for the run, one for each model call and one for each tool call. Keep the context across threads, record errors on spans, and draw the tree from the parent links.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "python agent.py \"Is checkout safe to release? Compare it with search.\"\npython tree.py\npython agent.py \"What is the build status of payments?\"\njq -c 'select(.status.status_code == \"ERROR\")\n  | {name, description: .status.description, events: [.events[].name]}' spans.jsonl"
      },
      {
        label: "Two tools with made-up data (tools.py)",
        language: "python",
        code: "\"\"\"Two tools for the release agent. The data is fake, so every run sees the same facts.\"\"\"\nimport time\n\nBUILDS = {\"checkout\": {\"version\": \"1.8.2\", \"status\": \"passed\"},\n          \"search\": {\"version\": \"2.1.0\", \"status\": \"failed\"}}\nERROR_RATES = {\"checkout\": 0.4, \"search\": 3.1}\n\n\ndef _find(table: dict, service: str) -> dict:\n    if service not in table:\n        raise LookupError(f\"unknown service: {service}\")\n    return table[service]\n\n\ndef get_build(service: str) -> dict:\n    time.sleep(0.3)  # a call to the build system\n    return {\"service\": service, **_find(BUILDS, service)}\n\n\ndef get_error_rate(service: str) -> dict:\n    time.sleep(0.3)  # a call to the metrics system\n    return {\"service\": service, \"errors_percent\": _find(ERROR_RATES, service)}\n\n\ndef _schema(name: str, description: str) -> dict:\n    service = {\"type\": \"object\", \"properties\": {\"service\": {\"type\": \"string\"}},\n               \"required\": [\"service\"]}\n    return {\"type\": \"function\",\n            \"function\": {\"name\": name, \"description\": description, \"parameters\": service}}\n\n\nTOOLS = {f.__name__: f for f in (get_build, get_error_rate)}\nSCHEMAS = [_schema(\"get_build\", \"Latest build of a service: version and status.\"),\n           _schema(\"get_error_rate\", \"Share of failed requests of a service, in percent.\")]"
      },
      {
        label: "The agent loop with spans (agent.py)",
        language: "python",
        code: "\"\"\"The release agent: ask the model, run its tools, repeat. Every step is a span.\"\"\"\nimport contextvars\nimport json\nimport sys\nfrom concurrent.futures import ThreadPoolExecutor\n\nfrom opentelemetry.trace import Status, StatusCode\n\nimport tools\nfrom telemetry import CAPTURE, chat, setup, tracer\n\nSYSTEM = (\"You are a release agent. For each service you are asked about, call get_build and \"\n          \"get_error_rate. Then answer in two sentences.\")\nMAX_STEPS = 6\n\n\ndef run_tool(call: dict) -> dict:\n    name, args = call[\"function\"][\"name\"], json.loads(call[\"function\"][\"arguments\"])\n    with tracer.start_as_current_span(f\"execute_tool {name}\") as span:\n        span.set_attributes({\"gen_ai.operation.name\": \"execute_tool\",\n                             \"gen_ai.tool.name\": name,\n                             \"gen_ai.tool.call.id\": call[\"id\"]})\n        try:\n            result = json.dumps(tools.TOOLS[name](**args))\n        except Exception as exc:  # the agent handles the error, so only a record shows it\n            span.record_exception(exc)\n            span.set_status(Status(StatusCode.ERROR, str(exc)))\n            span.set_attribute(\"error.type\", type(exc).__name__)\n            result = f\"error: {exc}\"\n        if CAPTURE:\n            span.set_attribute(\"gen_ai.tool.call.result\", result)\n    return {\"role\": \"tool\", \"tool_call_id\": call[\"id\"], \"content\": result}\n\n\ndef run(task: str) -> str:\n    messages = [{\"role\": \"system\", \"content\": SYSTEM}, {\"role\": \"user\", \"content\": task}]\n    with tracer.start_as_current_span(\"invoke_agent release-agent\") as span:\n        span.set_attributes({\"gen_ai.operation.name\": \"invoke_agent\",\n                             \"gen_ai.agent.name\": \"release-agent\"})\n        for _ in range(MAX_STEPS):\n            message = chat(messages, tools.SCHEMAS)\n            messages.append(message)\n            if not message.get(\"tool_calls\"):\n                return message[\"content\"]\n            with ThreadPoolExecutor() as pool:  # a new thread starts without the current span\n                jobs = [pool.submit(contextvars.copy_context().run, run_tool, call)\n                        for call in message[\"tool_calls\"]]\n                messages.extend(job.result() for job in jobs)\n        return \"I stopped after too many steps.\"\n\n\nif __name__ == \"__main__\":\n    setup()\n    print(run(\" \".join(sys.argv[1:])))"
      },
      {
        label: "Draw the trace as a tree (tree.py)",
        language: "python",
        code: "\"\"\"Draw the trace in spans.jsonl as a tree: every span points to its parent.\"\"\"\nimport json\nfrom datetime import datetime\n\nspans = [json.loads(line) for line in open(\"spans.jsonl\")]\nchildren = {}\nfor span in spans:\n    children.setdefault(span[\"parent_id\"], []).append(span)\n\n\ndef seconds(span: dict) -> float:\n    start, end = (datetime.fromisoformat(span[key]) for key in (\"start_time\", \"end_time\"))\n    return (end - start).total_seconds()\n\n\ndef show(parent_id, depth=0):\n    for span in sorted(children.get(parent_id, []), key=lambda s: s[\"start_time\"]):\n        mark = \"  ERROR\" if span[\"status\"][\"status_code\"] == \"ERROR\" else \"\"\n        print(f\"{'  ' * depth}{span['name']}  {seconds(span):.2f}s{mark}\")\n        show(span[\"context\"][\"span_id\"], depth + 1)\n\n\nshow(None)"
      }
    ],
    resources: [
      {
        title: "OpenTelemetry traces concepts",
        url: "https://opentelemetry.io/docs/concepts/signals/traces/"
      },
      {
        title: "W3C Trace Context",
        url: "https://www.w3.org/TR/trace-context/"
      }
    ]
  },
  {
    title: "Send the traces to Jaeger and read them",
    slug: "send-the-traces-to-jaeger-and-read-them",
    description: "Run Jaeger in a container, send the traces to it over OTLP with one environment variable, summarise them with a script, and read the same traces in the Jaeger web interface.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "docker run -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/jaeger:2.23.0\nexport OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318\npython agent.py \"Is checkout safe to release? Compare it with search.\"\npython agent.py \"What is the build status of payments?\"\ncurl -s localhost:16686/api/v3/services | jq -c .\npython jaeger.py"
      },
      {
        label: "Summarise the traces from Jaeger (jaeger.py)",
        language: "python",
        code: "\"\"\"Summarize the newest traces of the release agent in Jaeger, without the browser.\"\"\"\nimport json\nimport time\nimport urllib.error\nimport urllib.parse\nimport urllib.request\nfrom datetime import datetime, timedelta, timezone\n\n\ndef fetch():\n    now = datetime.now(timezone.utc)\n    query = urllib.parse.urlencode({\n        \"query.service_name\": \"release-agent\", \"query.num_traces\": 10,\n        \"query.start_time_min\": (now - timedelta(days=1)).isoformat(),\n        \"query.start_time_max\": (now + timedelta(minutes=1)).isoformat()})\n    try:\n        with urllib.request.urlopen(f\"http://localhost:16686/api/v3/traces?{query}\") as reply:\n            chunks = json.load(reply)[\"result\"][\"resourceSpans\"]\n    except urllib.error.HTTPError as error:\n        if error.code != 404:      # Jaeger answers 404 when it holds no trace at all\n            raise\n        chunks = []\n    found = {}\n    for chunk in chunks:\n        for scope in chunk[\"scopeSpans\"]:\n            for span in scope[\"spans\"]:\n                attrs = span.get(\"attributes\", [])\n                span[\"attrs\"] = {a[\"key\"]: next(iter(a[\"value\"].values())) for a in attrs}\n                found.setdefault(span[\"traceId\"], []).append(span)\n    return found\n\n\ndef has_root(spans):\n    return any(not s.get(\"parentSpanId\") for s in spans)\n\n\n# The root span ends last: a trace just sent can be listed before its root has arrived, so wait for it.\nfor _ in range(20):\n    traces = fetch()\n    if all(has_root(spans) for spans in traces.values()):\n        break\n    time.sleep(1)\n\n\ndef seconds(span):\n    return (int(span[\"endTimeUnixNano\"]) - int(span[\"startTimeUnixNano\"])) / 1e9\n\n\ndef started(item):\n    return min(s[\"startTimeUnixNano\"] for s in item[1])\n\n\nprint(f\"{len(traces)} trace(s) of release-agent\")\nfor trace_id, spans in sorted(traces.items(), key=started):\n    chats = [s for s in spans if s[\"name\"].startswith(\"chat \")]\n    tools = [s for s in spans if s[\"name\"].startswith(\"execute_tool \")]\n    tokens = [int(s[\"attrs\"].get(\"gen_ai.usage.input_tokens\", 0)) for s in chats]\n    errors = sum(1 for s in spans if s[\"status\"].get(\"code\") == 2)\n    root = next(s for s in spans if not s.get(\"parentSpanId\"))\n    print(f\"{trace_id[:8]}  {seconds(root):5.1f}s  chats={len(chats)}  tools={len(tools)}  \"\n          f\"slowest tool={max([seconds(s) for s in tools] or [0]):.1f}s  \"\n          f\"max input tokens={max(tokens or [0])}  errors={errors}\")\n    messages = json.loads(chats[0][\"attrs\"].get(\"gen_ai.input.messages\", \"[]\")) if chats else []\n    prompt = [m[\"parts\"][0][\"content\"] for m in messages if m[\"role\"] == \"user\"]\n    print(f\"  prompt: {prompt[0][:80]}\" if prompt else \"  prompt: not recorded\")"
      }
    ],
    resources: [
      {
        title: "Jaeger documentation",
        url: "https://www.jaegertracing.io/docs/"
      },
      {
        title: "OTLP exporter configuration",
        url: "https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/"
      }
    ]
  },
  {
    title: "Metrics from the same agent",
    slug: "metrics-from-the-same-agent",
    description: "Turn the spans of the agent into token counters and duration histograms with a span processor, send them to Prometheus and ask questions about them in the Prometheus query page.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "patch -p1 < metrics.patch\ndocker run -d --name prometheus -p 9090:9090 prom/prometheus:v3.16.0 \\\n  --config.file=/etc/prometheus/prometheus.yml --web.enable-otlp-receiver\nexport OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces\nexport OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:9090/api/v1/otlp/v1/metrics\npython agent.py \"Is checkout safe to release? Compare it with search.\"\npython agent.py \"What is the build status of payments?\""
      },
      {
        label: "Spans turned into metrics (metrics.py)",
        language: "python",
        code: "\"\"\"Metrics for the release agent, derived from its spans, named by the GenAI conventions.\"\"\"\nfrom opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter\nfrom opentelemetry.sdk.metrics import MeterProvider\nfrom opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader\nfrom opentelemetry.sdk.trace import SpanProcessor\n\nBUCKETS = [0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.28, 2.56, 5.12, 10.24, 20.48, 40.96, 81.92]\nLABELS = (\"gen_ai.operation.name\", \"gen_ai.provider.name\", \"gen_ai.request.model\")\n\n\nclass SpanMetrics(SpanProcessor):\n    \"\"\"Every finished span is also a measurement.\"\"\"\n\n    def __init__(self, meter):\n        counter, histogram = meter.create_counter, meter.create_histogram\n        self.tokens_in = counter(\"gen_ai.client.inference.usage.input_tokens\", unit=\"{token}\")\n        self.tokens_out = counter(\"gen_ai.client.inference.usage.output_tokens\", unit=\"{token}\")\n        self.inference = histogram(\"gen_ai.client.inference.duration\", unit=\"s\",\n                                   explicit_bucket_boundaries_advisory=BUCKETS)\n        self.tool = histogram(\"gen_ai.execute_tool.duration\", unit=\"s\",\n                              explicit_bucket_boundaries_advisory=BUCKETS)\n\n    def on_end(self, span):\n        seconds = (span.end_time - span.start_time) / 1e9\n        attrs = span.attributes\n        if attrs.get(\"gen_ai.operation.name\") == \"chat\":\n            labels = {key: attrs[key] for key in LABELS}\n            modality = {**labels, \"gen_ai.token.modality\": \"text\"}\n            self.tokens_in.add(attrs[\"gen_ai.usage.input_tokens\"], modality)\n            self.tokens_out.add(attrs[\"gen_ai.usage.output_tokens\"], modality)\n            self.inference.record(seconds, labels)\n        elif attrs.get(\"gen_ai.operation.name\") == \"execute_tool\":\n            labels = {\"gen_ai.tool.name\": attrs[\"gen_ai.tool.name\"]}\n            if \"error.type\" in attrs:\n                labels[\"error.type\"] = attrs[\"error.type\"]\n            self.tool.record(seconds, labels)\n\n\ndef attach(provider):\n    \"\"\"Export every 5 seconds over OTLP, with the same resource as the traces.\"\"\"\n    reader = PeriodicExportingMetricReader(OTLPMetricExporter(), export_interval_millis=5000)\n    meters = MeterProvider(metric_readers=[reader], resource=provider.resource)\n    provider.add_span_processor(SpanMetrics(meters.get_meter(\"release-agent\")))"
      },
      {
        label: "The patch that wires the metrics into the agent (metrics.patch)",
        language: "diff",
        code: "--- a/telemetry.py\n+++ b/telemetry.py\n@@ -27,6 +27,10 @@\n         console = ConsoleSpanExporter(out=out, formatter=lambda s: s.to_json(indent=None) + \"\\n\")\n         provider.add_span_processor(SimpleSpanProcessor(console))\n     trace.set_tracer_provider(provider)\n+    if os.environ.get(\"OTEL_EXPORTER_OTLP_METRICS_ENDPOINT\"):\n+        import metrics\n+\n+        metrics.attach(provider)\n     return provider\n \n "
      }
    ],
    resources: [
      {
        title: "Prometheus: using OpenTelemetry",
        url: "https://prometheus.io/docs/guides/opentelemetry/"
      },
      {
        title: "OpenTelemetry metrics concepts",
        url: "https://opentelemetry.io/docs/concepts/signals/metrics/"
      }
    ]
  },
  {
    title: "The Collector between the agent and Jaeger",
    slug: "the-collector-between-the-agent-and-jaeger",
    description: "Put an OpenTelemetry Collector between the agent and Jaeger: redact email addresses from prompts, keep only the traces worth keeping with tail sampling, and batch what is sent. The agent does not change.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "docker run --rm -v \"$PWD/collector.yaml:/etc/otelcol-contrib/config.yaml:ro\" \\\n  otel/opentelemetry-collector-contrib:0.165.0 validate \\\n  --config=/etc/otelcol-contrib/config.yaml; echo exit code $?\ndocker run -d --name jaeger --network otel -p 16686:16686 jaegertracing/jaeger:2.23.0\ndocker run -d --name collector --network otel -p 4318:4318 \\\n  -v \"$PWD/collector.yaml:/etc/otelcol-contrib/config.yaml:ro\" \\\n  otel/opentelemetry-collector-contrib:0.165.0\nexport OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \\\n  OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true\npython agent.py \"Is checkout safe to release? Send the verdict to dana.rossi@example.com.\"\npython agent.py \"What is the build status of payments? Send it to dana.rossi@example.com.\"\npython jaeger.py"
      },
      {
        label: "Collector with redaction, tail sampling and batching (collector.yaml)",
        language: "yaml",
        code: "receivers:\n  otlp:\n    protocols:\n      http:\n        endpoint: 0.0.0.0:4318\n\nprocessors:\n  redaction:\n    allow_all_keys: true\n    blocked_values:\n      - '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}'\n    summary: info\n  tail_sampling:\n    decision_wait: 30s\n    policies:\n      - name: errors\n        type: status_code\n        status_code:\n          status_codes: [ERROR]\n      - name: big-prompts\n        type: numeric_attribute\n        numeric_attribute:\n          key: gen_ai.usage.input_tokens\n          min_value: 3000\n  batch:\n    timeout: 2s\n\nexporters:\n  otlp_grpc/jaeger:\n    endpoint: jaeger:4317\n    tls:\n      insecure: true\n\nservice:\n  pipelines:\n    traces:\n      receivers: [otlp]\n      processors: [redaction, tail_sampling, batch]\n      exporters: [otlp_grpc/jaeger]"
      }
    ],
    resources: [
      {
        title: "OpenTelemetry Collector",
        url: "https://opentelemetry.io/docs/collector/"
      },
      {
        title: "Tail sampling processor",
        url: "https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/tailsamplingprocessor"
      },
      {
        title: "Redaction processor",
        url: "https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/redactionprocessor"
      }
    ]
  },
  {
    title: "Debug a misbehaving agent from its traces",
    slug: "debug-a-misbehaving-agent-from-its-traces",
    description: "Find four faults in a misbehaving agent from its traces in Jaeger: a slow tool, a retry loop, a prompt that keeps growing and an error the agent swallowed. Fix them with a patch and compare the traces before and after.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "Commands of the lesson",
        language: "bash",
        code: "docker run -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/jaeger:2.23.0\nexport OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \\\n  OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true\npython agent.py \"Is billing safe to release? Check its build, error rate and logs.\"\npython jaeger.py\npatch -p1 < fix.patch"
      },
      {
        label: "The patch that fixes the agent (fix.patch)",
        language: "diff",
        code: "--- a/agent.py\n+++ b/agent.py\n@@ -4,12 +4,14 @@\n import sys\n from concurrent.futures import ThreadPoolExecutor\n \n+from opentelemetry.trace import Status, StatusCode\n+\n import tools\n from telemetry import CAPTURE, chat, setup, tracer\n \n SYSTEM = (\"You are a release agent. For each service you are asked about, call get_build, \"\n-          \"get_error_rate and fetch_logs. If a tool result is unknown, call that tool again \"\n-          \"until it returns data. Then answer in two sentences.\")\n+          \"get_error_rate and fetch_logs. If a tool fails, say so and do not call it again. \"\n+          \"Then answer in two sentences.\")\n MAX_STEPS = 6\n \n \n@@ -21,8 +23,11 @@\n                              \"gen_ai.tool.call.id\": call[\"id\"]})\n         try:\n             result = json.dumps(tools.TOOLS[name](**args))\n-        except Exception:\n-            result = \"unknown\"\n+        except Exception as exc:\n+            span.record_exception(exc)\n+            span.set_status(Status(StatusCode.ERROR, str(exc)))\n+            span.set_attribute(\"error.type\", type(exc).__name__)\n+            result = f\"error: {exc}\"\n         if CAPTURE:\n             span.set_attribute(\"gen_ai.tool.call.result\", result[:300])\n     return {\"role\": \"tool\", \"tool_call_id\": call[\"id\"], \"content\": result}\n--- a/tools.py\n+++ b/tools.py\n@@ -4,8 +4,8 @@\n BUILDS = {\"checkout\": {\"version\": \"1.8.2\", \"status\": \"passed\"},\n           \"search\": {\"version\": \"2.1.0\", \"status\": \"failed\"}}\n ERROR_RATES = {\"checkout\": 0.4, \"search\": 3.1, \"billing\": 1.2}\n-WINDOW_HOURS = 720\n-LOG_LINES = 200\n+WINDOW_HOURS = 24\n+LOG_LINES = 20\n \n \n def _find(table: dict, service: str) -> dict:"
      }
    ],
    resources: [
      {
        title: "Jaeger documentation",
        url: "https://www.jaegertracing.io/docs/"
      },
      {
        title: "OpenTelemetry GenAI semantic conventions",
        url: "https://opentelemetry.io/docs/specs/semconv/gen-ai/"
      }
    ]
  }
];

export async function seedOtelCourse(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { slug: OTEL_COURSE_SLUG },
    update: {},
    create: {
      title: "Observe and Debug AI Agents with OpenTelemetry",
      slug: OTEL_COURSE_SLUG,
      description:
        "Make an AI agent observable with OpenTelemetry: trace every model and tool call, send the traces to Jaeger, measure tokens and latency, protect prompts with a Collector, and debug a misbehaving agent from its traces.",
      difficulty: "INTERMEDIATE",
      status: "DRAFT",
      sortOrder: 10,
      outcomes: [
        "Record a model call as an OpenTelemetry span with the GenAI attributes",
        "Trace an agent loop as a tree of agent, model and tool spans, across threads",
        "Send traces to Jaeger over OTLP and read them in its web interface",
        "Turn spans into token and latency metrics and query them in Prometheus",
        "Put a Collector in front of Jaeger to redact personal data, sample and batch",
        "Find a slow tool, a retry loop, a growing prompt and a swallowed error from the traces alone",
      ],
      prerequisites: [
        "Comfortable with Python and the command line",
        "Python 3.11 to 3.14, curl and jq installed, and Docker or Podman running",
        "An OpenAI-compatible model endpoint that supports tool calling (a few calls per lesson)",
      ],
      estimatedDuration: 30,
    },
  });

  for (const lessonData of otelLessons) {
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
    `  ✓ Course "${course.title}" (DRAFT) with ${otelLessons.length} lessons`
  );
}
