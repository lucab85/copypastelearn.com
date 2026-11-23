/**
 * Feature Flags Without Lock-In: OpenFeature in Java (DRAFT).
 *
 * Six lessons. Generated from the verified course (screenshare-recorder, lessons/openfeature): the code snippets are the
 * files typed on camera and the commands of each lesson, copied as they are. Nothing here is published: the course and
 * its lessons are DRAFT, `announced` is false, there is no video. A package import (`pnpm course:import`) adds the
 * videos, transcripts, durations, the final assessment and the Hands-On Lab text to the same lessons (same slugs).
 *
 * Idempotent, same style as the goose and MCP course seeds:
 *   - the course upsert has `update: {}`: a re-run never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only (never `status`, `videoPlaybackId` or `durationSeconds`).
 */

import type { PrismaClient } from "@prisma/client";

export const OPENFEATURE_COURSE_SLUG = "openfeature-feature-flags-java";

export const openFeatureLessons = [
  {
    title: "A flag is configuration with a lifecycle",
    slug: "a-flag-is-configuration-with-a-lifecycle",
    description: "See why a repurposed flag can cost a company, sort flags into four kinds, and evaluate a flag through the OpenFeature Java SDK with flagd reading a JSON file. Then change the flag in the file, not in the code. The narration is a synthetic voice made from the author's own voice.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "flags.json",
        language: "json",
        code: "{\n  \"$schema\": \"https://flagd.dev/schema/v0/flags.json\",\n  \"flags\": {\n    \"v2_enabled\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"on\"\n    }\n  }\n}",
      },
      {
        label: "Checkout.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.contrib.providers.flagd.Config;\nimport dev.openfeature.contrib.providers.flagd.FlagdOptions;\nimport dev.openfeature.contrib.providers.flagd.FlagdProvider;\nimport dev.openfeature.sdk.Client;\nimport dev.openfeature.sdk.OpenFeatureAPI;\n\npublic class Checkout {\n    public static void main(String[] args) {\n        FlagdProvider provider = new FlagdProvider(FlagdOptions.builder()\n                .resolverType(Config.Resolver.FILE)\n                .offlineFlagSourcePath(\"flags.json\")\n                .build());\n\n        OpenFeatureAPI api = OpenFeatureAPI.getInstance();\n        api.setProviderAndWait(provider);\n\n        Client client = api.getClient(\"checkout\");\n        boolean on = client.getBooleanValue(\"v2_enabled\", false);\n        System.out.println(on ? \"checkout: new flow (v2)\" : \"checkout: old flow (v1)\");\n        api.shutdown();\n    }\n}",
      },
      {
        label: "run",
        language: "bash",
        code: "#!/bin/bash\n# Compile, then run one class: ./run Checkout\nset -e\nmvn -q compile dependency:build-classpath -Dmdep.outputFile=cp.txt\njava -cp \"target/classes:$(cat cp.txt)\" \"demo.$1\" \"${@:2}\"",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "java -version 2>&1 | grep Runtime\nmvn -v | head -1\nfind . -type f\ngrep -E '<(artifactId|version)>' pom.xml\nmkdir -p src/main/java/demo\nchmod +x run\n./run Checkout\nsed -i '' 's/\"defaultVariant\": \"on\"/\"defaultVariant\": \"off\"/' flags.json\n./run Checkout\ngrep -rn v2_enabled src flags.json",
      },
    ],
    resources: [
      {
        title: "OpenFeature",
        url: "https://openfeature.dev/",
      },
      {
        title: "OpenFeature: introduction",
        url: "https://openfeature.dev/docs/reference/intro",
      },
      {
        title: "flagd",
        url: "https://flagd.dev/",
      },
      {
        title: "Martin Fowler: Feature Toggles",
        url: "https://martinfowler.com/articles/feature-toggles.html",
      },
      {
        title: "Luca Berton: Fun with Flags, OpenFeature at the Amsterdam JUG",
        url: "https://lucaberton.com/blog/amsterdam-jug-flagsmith-openfeature-2026/",
      },
      {
        title: "Udienza: Simon Schrottner, OpenFeature and AI at runtime",
        url: "https://www.udienza.com/episodes/simon-schrottner",
      },
    ],
  },
  {
    title: "The default is mandatory",
    slug: "the-default-is-mandatory",
    description: "Break a flag four ways: an unreachable provider, a mistyped key, a wrong type and an evaluation error. Read the evaluation details each time, and watch the default keep the service answering.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "flags.json",
        language: "json",
        code: "{\n  \"$schema\": \"https://flagd.dev/schema/v0/flags.json\",\n  \"flags\": {\n    \"v2_enabled\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"on\"\n    },\n    \"checkout_theme\": {\n      \"state\": \"ENABLED\", \"variants\": { \"light\": \"light\", \"dark\": \"dark\" }, \"defaultVariant\": \"dark\"\n    },\n    \"broken_rule\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\",\n      \"targeting\": { \"if\": [true, \"missing\"] }\n    },\n    \"legacy_banner\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\"\n    }\n  }\n}",
      },
      {
        label: "Details.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.contrib.providers.flagd.*;\nimport dev.openfeature.sdk.*;\n\npublic class Details {\n    public static void main(String[] args) {\n        String key = args[0];\n        boolean rpc = args.length > 1 && args[1].equals(\"rpc\");\n        OpenFeatureAPI api = OpenFeatureAPI.getInstance();\n        if (rpc) {   // a flagd server on port 8013: none is running, so do not wait for it\n            api.setProvider(new FlagdProvider(FlagdOptions.builder().resolverType(Config.Resolver.RPC)\n                    .host(\"localhost\").port(8013).deadline(500).build()));\n        } else {     // flagd's provider reads flags.json itself\n            api.setProviderAndWait(new FlagdProvider(FlagdOptions.builder()\n                    .resolverType(Config.Resolver.FILE).offlineFlagSourcePath(\"flags.json\").build()));\n        }\n        Client client = api.getClient(\"checkout\");\n        FlagEvaluationDetails<Boolean> d = client.getBooleanDetails(key, false);\n        System.out.printf(\"value=%s variant=%s reason=%s error=%s%n\",\n                d.getValue(), d.getVariant(), d.getReason(), d.getErrorCode());\n        System.exit(0);\n    }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "./run Checkout\n./run Details v2_enabled\n./run Details v2_enable\n./run Details checkout_theme\n./run Details broken_rule\n./run Details v2_enabled rpc\ngrep -n getBooleanDetails src/main/java/demo/Details.java\ngrep -n getBooleanValue src/main/java/demo/Checkout.java",
      },
    ],
    resources: [
      {
        title: "OpenFeature Java SDK",
        url: "https://openfeature.dev/docs/reference/sdks/server/java",
      },
      {
        title: "OpenFeature specification",
        url: "https://openfeature.dev/specification/",
      },
      {
        title: "flagd",
        url: "https://flagd.dev/",
      },
    ],
  },
  {
    title: "Change the provider, not the code",
    slug: "change-the-provider-not-the-code",
    description: "Run Flagsmith on your Mac with Docker Compose, create the same flag in its dashboard, and switch the provider in one class. The evaluation calls stay the same, and a toggle in the dashboard changes the running service at its next request, with no restart.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "Providers.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.contrib.providers.flagd.Config;\nimport dev.openfeature.contrib.providers.flagd.FlagdOptions;\nimport dev.openfeature.contrib.providers.flagd.FlagdProvider;\nimport dev.openfeature.contrib.providers.flagsmith.FlagsmithProvider;\nimport dev.openfeature.contrib.providers.flagsmith.FlagsmithProviderOptions;\nimport dev.openfeature.sdk.FeatureProvider;\n\n/** The only place that knows where the flags come from. */\npublic final class Providers {\n    static FeatureProvider fromEnvironment() {\n        return switch (System.getenv().getOrDefault(\"FLAG_PROVIDER\", \"flagd\")) {\n            case \"flagsmith\" -> new FlagsmithProvider(FlagsmithProviderOptions.builder()\n                    .apiKey(System.getenv(\"FLAGSMITH_ENVIRONMENT_KEY\"))\n                    .baseUri(\"http://127.0.0.1:8000/api/v1/\")\n                    .build());\n            default -> new FlagdProvider(FlagdOptions.builder()\n                    .resolverType(Config.Resolver.FILE)\n                    .offlineFlagSourcePath(\"flags.json\")\n                    .build());\n        };\n    }\n}",
      },
      {
        label: "Service.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.sdk.Client;\nimport dev.openfeature.sdk.OpenFeatureAPI;\n\npublic class Service {\n    public static void main(String[] args) throws InterruptedException {\n        OpenFeatureAPI api = OpenFeatureAPI.getInstance();\n        api.setProviderAndWait(Providers.fromEnvironment());\n        Client client = api.getClient(\"checkout\");\n        System.out.println(\"provider: \" + api.getProviderMetadata().getName());\n        for (int i = 1; ; i++) {\n            boolean on = client.getBooleanValue(\"v2_enabled\", false);\n            System.out.printf(\"request %d: %s%n\", i, on ? \"new flow (v2)\" : \"old flow (v1)\");\n            Thread.sleep(2000);\n        }\n    }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "docker compose version\ngrep -nE 'image:|127.0.0.1' flagsmith/compose.yaml\ndocker compose -f flagsmith/compose.yaml up -d --wait\ndocker compose -f flagsmith/compose.yaml ps -a --format 'table {{.Service}}\\t{{.Status}}'\nnano -w pom.xml\n<dependency>\n      <groupId>dev.openfeature.contrib.providers</groupId>\n      <artifactId>flagsmith</artifactId>\n      <version>0.0.13</version>\n    </dependency>\n<dependencyManagement>\n    <dependencies>\n      <!-- flagd and the Flagsmith client bring different Jackson versions: one for all -->\n      <dependency>\n        <groupId>com.fasterxml.jackson</groupId>\n        <artifactId>jackson-bom</artifactId>\n        <version>2.22.3</version>\n        <type>pom</type>\n        <scope>import</scope>\n      </dependency>\n    </dependencies>\n  </dependencyManagement>\n./run Service\necho ${#FLAGSMITH_ENVIRONMENT_KEY}\nFLAG_PROVIDER=flagsmith ./run Service\ngrep -rn getBooleanValue src",
      },
    ],
    resources: [
      {
        title: "Flagsmith documentation",
        url: "https://docs.flagsmith.com/",
      },
      {
        title: "OpenFeature Java SDK",
        url: "https://openfeature.dev/docs/reference/sdks/server/java",
      },
      {
        title: "OpenFeature",
        url: "https://openfeature.dev/",
      },
      {
        title: "Udienza: Simon Schrottner, OpenFeature and AI at runtime",
        url: "https://www.udienza.com/episodes/simon-schrottner",
      },
    ],
  },
  {
    title: "Targeting with evaluation context",
    slug: "targeting-with-evaluation-context",
    description: "Set context globally, per client and per call, write a flagd rule that targets a region and then ten percent of the other users, and predict which value wins from the merge order.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "flags.json",
        language: "json",
        code: "{\n  \"$schema\": \"https://flagd.dev/schema/v0/flags.json\",\n  \"flags\": {\n    \"v2_enabled\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\",\n      \"targeting\": {\n        \"if\": [\n          { \"==\": [{ \"var\": \"region\" }, \"eu\"] },\n          \"on\",\n          { \"fractional\": [[\"on\", 10], [\"off\", 90]] }\n        ]\n      }\n    },\n    \"checkout_theme\": {\n      \"state\": \"ENABLED\", \"variants\": { \"light\": \"light\", \"dark\": \"dark\" }, \"defaultVariant\": \"dark\"\n    },\n    \"broken_rule\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\",\n      \"targeting\": { \"if\": [true, \"missing\"] }\n    },\n    \"legacy_banner\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\"\n    }\n  }\n}",
      },
      {
        label: "Context.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.sdk.*;\n\npublic class Context {\n    public static void main(String[] args) {\n        OpenFeatureAPI api = OpenFeatureAPI.getInstance();\n        api.setProviderAndWait(Providers.fromEnvironment());\n        api.setEvaluationContext(new MutableContext().add(\"region\", \"us\"));\n        Client client = api.getClient(\"checkout\");\n        show(client, \"global region=us, user-42\", new MutableContext(\"user-42\"));\n        client.setEvaluationContext(new MutableContext().add(\"region\", \"eu\"));\n        show(client, \"client region=eu, user-42\", new MutableContext(\"user-42\"));\n        show(client, \"invocation region=us, user-42\", new MutableContext(\"user-42\").add(\"region\", \"us\"));\n        client.setEvaluationContext(new MutableContext());\n        int on = 0;\n        for (int i = 0; i < 1000; i++)\n            if (client.getBooleanValue(\"v2_enabled\", false, new MutableContext(\"user-\" + i))) on++;\n        System.out.printf(\"region=us, 1000 users: %d get v2 (rule: 10%%)%n\", on);\n        System.exit(0);\n    }\n    static void show(Client client, String label, MutableContext call) {\n        var d = client.getBooleanDetails(\"v2_enabled\", false, call);\n        System.out.printf(\"%-32s -> %s (variant %s, %s)%n\",\n                label, d.getValue(), d.getVariant(), d.getReason());\n    }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "./run Checkout\n./run Context\ngrep -n EvaluationContext src/main/java/demo/Context.java\n./run Context\ngrep -n '\"var\"' flags.json",
      },
    ],
    resources: [
      {
        title: "OpenFeature specification",
        url: "https://openfeature.dev/specification/",
      },
      {
        title: "flagd",
        url: "https://flagd.dev/",
      },
      {
        title: "OpenFeature Java SDK",
        url: "https://openfeature.dev/docs/reference/sdks/server/java",
      },
    ],
  },
  {
    title: "Hooks and OpenTelemetry",
    slug: "hooks-and-opentelemetry",
    description: "Write a small hook for each stage of an evaluation, then add OpenTelemetry's traces and metrics hooks, and find every evaluation, with its flag key and variant, in Jaeger.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "LoggingHook.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.sdk.*;\nimport java.util.Map;\nimport java.util.Optional;\n\n/** Prints each stage of a flag evaluation. */\npublic class LoggingHook implements Hook<Boolean> {\n    public Optional<EvaluationContext> before(HookContext<Boolean> ctx, Map<String, Object> hints) {\n        System.out.println(\"  before:  \" + ctx.getFlagKey());\n        return Optional.empty();\n    }\n\n    public void after(HookContext<Boolean> ctx, FlagEvaluationDetails<Boolean> details,\n                      Map<String, Object> hints) {\n        System.out.println(\"  after:   \" + details.getValue() + \" (\" + details.getVariant() + \")\");\n    }\n\n    public void error(HookContext<Boolean> ctx, Exception error, Map<String, Object> hints) {\n        System.out.println(\"  error:   \" + error.getMessage());\n    }\n\n    public void finallyAfter(HookContext<Boolean> ctx, FlagEvaluationDetails<Boolean> details,\n                             Map<String, Object> hints) {\n        System.out.println(\"  finally: \" + ctx.getFlagKey());\n    }\n}",
      },
      {
        label: "Telemetry.java",
        language: "java",
        code: "package demo;\n\nimport io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;\nimport io.opentelemetry.sdk.OpenTelemetrySdk;\nimport io.opentelemetry.sdk.metrics.SdkMeterProvider;\nimport io.opentelemetry.sdk.resources.Resource;\nimport io.opentelemetry.sdk.testing.exporter.InMemoryMetricReader;\nimport io.opentelemetry.sdk.trace.SdkTracerProvider;\nimport io.opentelemetry.sdk.trace.export.BatchSpanProcessor;\n\n/** OpenTelemetry for the service checkout: spans to Jaeger over OTLP, metrics in memory. */\nfinal class Telemetry {\n    static final InMemoryMetricReader METRICS = InMemoryMetricReader.create();\n\n    static OpenTelemetrySdk start() {\n        var name = Resource.getDefault().toBuilder().put(\"service.name\", \"checkout\").build();\n        var otlp = OtlpGrpcSpanExporter.builder().setEndpoint(\"http://127.0.0.1:4317\").build();\n        return OpenTelemetrySdk.builder()\n                .setTracerProvider(SdkTracerProvider.builder().setResource(name)\n                        .addSpanProcessor(BatchSpanProcessor.builder(otlp).build()).build())\n                .setMeterProvider(SdkMeterProvider.builder().setResource(name)\n                        .registerMetricReader(METRICS).build())\n                .buildAndRegisterGlobal();\n    }\n}",
      },
      {
        label: "Traced.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.contrib.hooks.otel.*;\nimport dev.openfeature.sdk.*;\nimport io.opentelemetry.api.common.Attributes;\n\npublic class Traced {\n    public static void main(String[] args) {\n        var otel = Telemetry.start();\n        OpenFeatureAPI api = OpenFeatureAPI.getInstance();\n        api.setProviderAndWait(Providers.fromEnvironment());\n        api.addHooks(new LoggingHook(), new MetricsHook(otel),\n                new TracesHook(TracesHookOptions.builder().extraAttributes(Attributes.empty()).build()));\n        Client client = api.getClient(\"checkout\");\n        for (int i = 1; i <= 3; i++) {   // three requests, each in its own span\n            var span = otel.getTracer(\"checkout\").spanBuilder(\"GET /checkout\").startSpan();\n            try (var scope = span.makeCurrent()) {\n                var on = client.getBooleanValue(\"v2_enabled\", false, new MutableContext(\"user-\" + i));\n                System.out.printf(\"request %d: %s%n\", i, on ? \"v2\" : \"v1\");\n            } finally { span.end(); }\n        }\n        client.getBooleanValue(\"v2_enable\", false);   // a typo, to see the error stage\n        Telemetry.METRICS.collectAllMetrics().forEach(m -> System.out.printf(\"%-40s %d%n\", m.getName(),\n                m.getLongSumData().getPoints().stream().mapToLong(p -> p.getValue()).sum()));\n        otel.close();   // sends the spans to Jaeger\n    }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "docker run -d --name jaeger -p 127.0.0.1:16686:16686 -p 127.0.0.1:4317:4317 jaegertracing/jaeger:2.23.0\nnano -w pom.xml\n<dependency>\n      <groupId>dev.openfeature.contrib.hooks</groupId>\n      <artifactId>otel</artifactId>\n      <version>3.3.1</version>\n    </dependency>\n    <dependency>\n      <groupId>io.opentelemetry</groupId>\n      <artifactId>opentelemetry-sdk</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>io.opentelemetry</groupId>\n      <artifactId>opentelemetry-exporter-otlp</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>io.opentelemetry</groupId>\n      <artifactId>opentelemetry-sdk-testing</artifactId>\n    </dependency>\n<!-- one version for every OpenTelemetry library -->\n      <dependency>\n        <groupId>io.opentelemetry</groupId>\n        <artifactId>opentelemetry-bom</artifactId>\n        <version>1.68.0</version>\n        <type>pom</type>\n        <scope>import</scope>\n      </dependency>\n./run Traced\ngrep -n spanBuilder src/main/java/demo/Traced.java",
      },
    ],
    resources: [
      {
        title: "OpenFeature OpenTelemetry hook for Java",
        url: "https://github.com/open-feature/java-sdk-contrib/tree/main/hooks/open-telemetry",
      },
      {
        title: "OpenTelemetry: feature flag semantic conventions",
        url: "https://opentelemetry.io/docs/specs/semconv/feature-flags/",
      },
      {
        title: "Jaeger documentation",
        url: "https://www.jaegertracing.io/docs/",
      },
    ],
  },
  {
    title: "Find and remove an obsolete flag",
    slug: "find-and-remove-an-obsolete-flag",
    description: "Give flags an owner and an expiry, ask Jaeger's query API whether anyone still evaluates a flag, and remove it from the code before you remove it from the provider.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "flags.json",
        language: "json",
        code: "{\n  \"$schema\": \"https://flagd.dev/schema/v0/flags.json\",\n  \"flags\": {\n    \"v2_enabled\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\",\n      \"targeting\": {\n        \"if\": [\n          { \"==\": [{ \"var\": \"region\" }, \"eu\"] },\n          \"on\",\n          { \"fractional\": [[\"on\", 10], [\"off\", 90]] }\n        ]\n      },\n      \"metadata\": { \"owner\": \"team-checkout\", \"expires\": \"2027-01-31\", \"kind\": \"release\" }\n    },\n    \"checkout_theme\": {\n      \"state\": \"ENABLED\", \"variants\": { \"light\": \"light\", \"dark\": \"dark\" }, \"defaultVariant\": \"dark\"\n    },\n    \"broken_rule\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\",\n      \"targeting\": { \"if\": [true, \"missing\"] }\n    },\n    \"legacy_banner\": {\n      \"state\": \"ENABLED\", \"variants\": { \"on\": true, \"off\": false }, \"defaultVariant\": \"off\",\n      \"metadata\": { \"owner\": \"team-web\", \"expires\": \"2026-06-30\", \"kind\": \"release\" }\n    }\n  }\n}",
      },
      {
        label: "Owners.java",
        language: "java",
        code: "package demo;\n\nimport dev.openfeature.sdk.FlagEvaluationDetails;\nimport dev.openfeature.sdk.OpenFeatureAPI;\n\npublic class Owners {\n    public static void main(String[] args) {\n        OpenFeatureAPI api = OpenFeatureAPI.getInstance();\n        api.setProviderAndWait(Providers.fromEnvironment());\n        for (String key : args) {\n            FlagEvaluationDetails<Boolean> d = api.getClient().getBooleanDetails(key, false);\n            var m = d.getFlagMetadata();\n            System.out.printf(\"%-14s owner=%s expires=%s kind=%s%n\", key,\n                    m.getString(\"owner\"), m.getString(\"expires\"), m.getString(\"kind\"));\n        }\n        System.exit(0);\n    }\n}",
      },
      {
        label: "evaluated",
        language: "bash",
        code: "#!/bin/bash\n# How many traces of the last hour evaluated the flag $1? Asks Jaeger's query API.\nfrom=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)\nto=$(date -u +%Y-%m-%dT%H:%M:%SZ)\ncurl -s -G http://127.0.0.1:16686/api/v3/traces \\\n  --data-urlencode \"query.service_name=checkout\" \\\n  --data-urlencode \"query.start_time_min=$from\" \\\n  --data-urlencode \"query.start_time_max=$to\" \\\n  --data-urlencode \"query.attributes={\\\"feature_flag.key\\\":\\\"$1\\\"}\" |\n  jq '[.result.resourceSpans[]?.scopeSpans[].spans[].traceId] | unique | length'",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "curl -s 127.0.0.1:16686/api/v3/services | jq -c\njq '.flags | keys' flags.json\n./run Owners v2_enabled legacy_banner\nchmod +x evaluated\n./evaluated v2_enabled\n./evaluated legacy_banner\ngrep -rn legacy_banner src\njq 'del(.flags.legacy_banner)' flags.json > flags.tmp && mv flags.tmp flags.json\n./run Owners legacy_banner\ndocker compose -f flagsmith/compose.yaml down -v\ndocker rm -fv jaeger\ndocker ps -a --format '{{.Names}}'",
      },
    ],
    resources: [
      {
        title: "Jaeger documentation",
        url: "https://www.jaegertracing.io/docs/",
      },
      {
        title: "Martin Fowler: Feature Toggles",
        url: "https://martinfowler.com/articles/feature-toggles.html",
      },
      {
        title: "Luca Berton: Fun with Flags, OpenFeature at the Amsterdam JUG",
        url: "https://lucaberton.com/blog/amsterdam-jug-flagsmith-openfeature-2026/",
      },
    ],
  },
];

export async function seedOpenFeatureCourse(prisma: PrismaClient) {
  const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
  const course = await prisma.course.upsert({
    where: { slug: OPENFEATURE_COURSE_SLUG },
    update: {},
    create: {
      title: "Feature Flags Without Lock-In: OpenFeature in Java",
      slug: OPENFEATURE_COURSE_SLUG,
      description:
        "A feature flag starts as a glorified conditional and ends as production configuration with a lifecycle. This course builds that lifecycle in Java with OpenFeature, the CNCF standard for feature flags: one evaluation API, a safe default on every call, providers you can swap, evaluation context for targeting, and hooks that send every evaluation to OpenTelemetry. It follows Simon Schrottner's talk at the Amsterdam Java User Group, as Luca Berton wrote it up on lucaberton.com, and his Udienza interview.\n\nYou type every command yourself, break a flag on purpose to see the default win, move the same flag from flagd to self-hosted Flagsmith without touching the calls, and find a flag nobody evaluates any more before you delete it.\n\nThe narration is a synthetic voice made from the author's own voice.",
      difficulty: "INTERMEDIATE",
      track: "FOUNDATIONS",
      status: "DRAFT",
      announced: false,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      thumbnailUrl: "/images/courses/openfeature-feature-flags-java.svg",
      outcomes: [
        "Tell release, ops, experiment and permission flags apart, and how long each should live",
        "Evaluate flags through the OpenFeature Java SDK, and rely on the mandatory default when anything goes wrong",
        "Swap the flag provider from flagd to Flagsmith without changing the evaluation calls",
        "Target users and regions with evaluation context, and predict the result from the merge order",
        "Send every flag evaluation to OpenTelemetry with a hook",
        "Find obsolete flags from telemetry and remove them safely",
      ],
      prerequisites: [
        "A Mac with Apple silicon, Docker through Colima, and a Java 25 JDK",
        "Basic Java: classes, methods and running a program from the terminal",
        "No feature-flag product is needed: the course runs flagd and Flagsmith locally",
      ],
      estimatedDuration: 31,
    },
  });

  for (const lessonData of openFeatureLessons) {
    await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
      update: { ...lessonData },
      create: { ...lessonData, courseId: course.id, status: "DRAFT" },
    });
  }

  console.log(`  ✓ Course "${course.title}" (DRAFT) with ${openFeatureLessons.length} lessons`);
}
