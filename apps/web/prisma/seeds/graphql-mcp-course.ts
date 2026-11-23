/**
 * Legacy APIs as MCP Tools Through GraphQL (DRAFT).
 *
 * Six lessons. Generated from the verified course (screenshare-recorder, lessons/graphql-mcp): the code snippets are the
 * files typed on camera and the commands of each lesson, copied as they are. Nothing here is published: the course and
 * its lessons are DRAFT, `announced` is false, there is no video. A package import (`pnpm course:import`) adds the
 * videos, transcripts, durations, the final assessment and the Hands-On Lab text to the same lessons (same slugs).
 *
 * Idempotent, same style as the goose and MCP course seeds:
 *   - the course upsert has `update: {}`: a re-run never resets a status or a field edited in the admin;
 *   - lesson upserts refresh the text fields only (never `status`, `videoPlaybackId` or `durationSeconds`).
 */

import type { PrismaClient } from "@prisma/client";

export const GRAPHQL_MCP_COURSE_SLUG = "legacy-apis-mcp-tools-graphql";

export const graphqlMcpLessons = [
  {
    title: "The legacy API and the screen that uses it",
    slug: "the-legacy-api-and-the-screen-that-uses-it",
    description: "Run the Spring PetClinic REST API, look at what its responses contain, and measure how much of it a screen really shows, and how many calls a screen that combines owners and vets needs. The narration is a synthetic voice made from the author's own voice.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "docker run -d --name petclinic --label course=graphql-mcp --platform linux/amd64 \\\n  -p 127.0.0.1:9966:9966 springcommunity/spring-petclinic-rest:4.0.2\nAPI=http://127.0.0.1:9966/petclinic/api\nuntil curl -s -o /dev/null $API/vets; do sleep 2; done\ndocker ps --filter label=course=graphql-mcp --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}'\ncurl -s $API/owners | jq '.[0]'\ncurl -s $API/owners | wc -c\ncurl -s $API/owners | jq -c '[.[] | {firstName, lastName, city, pets: [.pets[].name]}]' | wc -c\ncurl -s $API/owners/6 | wc -c\ncurl -s -o /dev/null -w '%{http_code}\\n' $API/owners/6/pets\ncurl -s $API/vets | wc -c",
      },
    ],
    resources: [
      {
        title: "Spring PetClinic REST on GitHub",
        url: "https://github.com/spring-petclinic/spring-petclinic-rest",
      },
      {
        title: "GraphQL: introduction",
        url: "https://graphql.org/learn/",
      },
      {
        title: "Luca Berton: No Country for Old APIs",
        url: "https://lucaberton.com/blog/amsterdam-jug-graphql-mcp-2026/",
      },
    ],
  },
  {
    title: "One schema in front of the old API",
    slug: "one-schema-in-front-of-the-old-api",
    description: "Build a GraphQL facade with Spring that calls the REST API underneath, and fetch each screen with one query that asks only for the fields it shows.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "application.properties",
        language: "properties",
        code: "spring.application.name=facade\nserver.address=127.0.0.1\nserver.port=8080\npetclinic.url=http://127.0.0.1:9966/petclinic/api",
      },
      {
        label: "schema.graphqls",
        language: "graphql",
        code: "type Query {\n  owners: [Owner!]!\n  owner(id: ID!): Owner\n  vets: [Vet!]!\n}\n\ntype Owner {\n  id: ID!  firstName: String!  lastName: String!\n  address: String  city: String  telephone: String\n  pets: [Pet!]!\n}\n\ntype Pet {\n  id: ID!  name: String!  birthDate: String\n  type: PetType!  visits: [Visit!]!\n}\n\ntype PetType { id: ID!  name: String! }\ntype Visit { id: ID!  date: String  description: String }\n\ntype Vet {\n  id: ID!  firstName: String!  lastName: String!\n  specialties: [Specialty!]!\n}\ntype Specialty { id: ID!  name: String! }",
      },
      {
        label: "PetClinic.java",
        language: "java",
        code: "package demo.facade;\n\nimport java.util.List;\nimport org.springframework.beans.factory.annotation.Value;\nimport org.springframework.stereotype.Component;\nimport org.springframework.web.client.RestClient;\n\n@Component  // the legacy REST API, called as it is\npublic class PetClinic {\n    public record PetType(int id, String name) {}\n    public record Visit(int id, String date, String description) {}\n    public record Pet(int id, String name, String birthDate, PetType type, List<Visit> visits) {}\n    public record Owner(int id, String firstName, String lastName, String address, String city,\n                        String telephone, List<Pet> pets) {}\n    public record Specialty(int id, String name) {}\n    public record Vet(int id, String firstName, String lastName, List<Specialty> specialties) {}\n\n    private final RestClient rest;\n\n    PetClinic(@Value(\"${petclinic.url}\") String url) { rest = RestClient.create(url); }\n\n    List<Owner> owners() { return List.of(rest.get().uri(\"/owners\").retrieve().body(Owner[].class)); }\n    Owner owner(String id) { return rest.get().uri(\"/owners/{id}\", id).retrieve().body(Owner.class); }\n    List<Vet> vets() { return List.of(rest.get().uri(\"/vets\").retrieve().body(Vet[].class)); }\n}",
      },
      {
        label: "ClinicController.java",
        language: "java",
        code: "package demo.facade;\n\nimport java.util.List;\nimport org.springframework.graphql.data.method.annotation.Argument;\nimport org.springframework.graphql.data.method.annotation.QueryMapping;\nimport org.springframework.stereotype.Controller;\n\n@Controller\npublic class ClinicController {\n    private final PetClinic petClinic;\n\n    ClinicController(PetClinic petClinic) { this.petClinic = petClinic; }\n\n    @QueryMapping\n    List<PetClinic.Owner> owners() { return petClinic.owners(); }\n\n    @QueryMapping\n    PetClinic.Owner owner(@Argument String id) { return petClinic.owner(id); }\n\n    @QueryMapping\n    List<PetClinic.Vet> vets() { return petClinic.vets(); }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "cd facade && grep -E 'artifactId|<version>' pom.xml\nmkdir -p src/main/resources/graphql\n./mvnw -q -DskipTests package\njava -jar target/facade-0.0.1-SNAPSHOT.jar > facade.log 2>&1 &\ngrep -E 'Tomcat started|Started' facade.log\ncd .. && cat gql.sh\n./gql.sh '{ owners { firstName lastName city pets { name } } }' | jq -c '.data.owners[0]'\n./gql.sh '{ owners { firstName lastName city pets { name } } }' | wc -c\nQ='{ owner(id: 6) { firstName lastName address city telephone\n  pets { name birthDate type { name } visits { date description } } } }'\n./gql.sh \"$Q\" | jq -c\n./gql.sh \"$Q\" | wc -c\nV='{ owner(id: 6) { firstName lastName pets { name } }\n  vets { firstName lastName specialties { name } } }'\n./gql.sh \"$V\" | wc -c",
      },
    ],
    resources: [
      {
        title: "Spring for GraphQL",
        url: "https://docs.spring.io/spring-graphql/reference/",
      },
      {
        title: "GraphQL: introduction",
        url: "https://graphql.org/learn/",
      },
      {
        title: "Spring PetClinic REST on GitHub",
        url: "https://github.com/spring-petclinic/spring-petclinic-rest",
      },
    ],
  },
  {
    title: "Guard the facade",
    slug: "guard-the-facade",
    description: "Keep the first release read-only, limit how deep a query can go, and make a missing record come back as \"not found\" instead of an internal error, with no stack trace.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "Guards.java",
        language: "java",
        code: "package demo.facade;\n\nimport graphql.GraphQLError;\nimport graphql.GraphqlErrorBuilder;\nimport graphql.analysis.MaxQueryDepthInstrumentation;\nimport graphql.schema.DataFetchingEnvironment;\nimport org.springframework.context.annotation.*;\nimport org.springframework.graphql.execution.*;\nimport org.springframework.web.client.HttpClientErrorException;\n\n@Configuration\npublic class Guards {\n    @Bean  // the deepest screen is owner > pets > visits > date: four levels\n    MaxQueryDepthInstrumentation maxQueryDepth() { return new MaxQueryDepthInstrumentation(4); }\n\n    @Bean  // a 404 from the legacy API is \"not found\" for the client, not an internal error\n    DataFetcherExceptionResolverAdapter notFound() {\n        return new DataFetcherExceptionResolverAdapter() {\n            @Override\n            protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {\n                if (!(ex instanceof HttpClientErrorException.NotFound)) return null;\n                return GraphqlErrorBuilder.newError(env).errorType(ErrorType.NOT_FOUND)\n                        .message(\"not found: \" + env.getField().getName() + \" \" + env.getArguments()).build();\n            }\n        };\n    }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "../gql.sh 'mutation { deleteOwner(id: 6) }' | jq\n../gql.sh '{ owner(id: 999) { firstName } }' | jq\npkill -f facade-0.0.1-SNAPSHOT.jar\n./mvnw -q -DskipTests package\njava -jar target/facade-0.0.1-SNAPSHOT.jar > facade.log 2>&1 &\n../gql.sh '{ owner(id: 999) { firstName } }' | jq\n../gql.sh '{ owner(id: 6) { firstName pets { name visits { date description } } } }' | jq -c\n../gql.sh '{ __schema { types { fields { type { name } } } } }' | jq -c",
      },
    ],
    resources: [
      {
        title: "Spring for GraphQL",
        url: "https://docs.spring.io/spring-graphql/reference/",
      },
      {
        title: "GraphQL: introduction",
        url: "https://graphql.org/learn/",
      },
    ],
  },
  {
    title: "A GraphQL operation is an MCP tool",
    slug: "a-graphql-operation-is-an-mcp-tool",
    description: "See how a named operation maps to a tool's name, description and schemas, write the tool with Spring AI, set honest hints instead of the defaults, and list and call it with curl over MCP.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "application.properties",
        language: "properties",
        code: "spring.application.name=tools\nserver.address=127.0.0.1\nserver.port=8081\nspring.ai.mcp.server.name=petclinic-tools\nspring.ai.mcp.server.protocol=STREAMABLE",
      },
      {
        label: "ToolsApplication.java",
        language: "java",
        code: "package demo.tools;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\nimport org.springframework.context.annotation.Bean;\nimport org.springframework.graphql.client.HttpSyncGraphQlClient;\nimport org.springframework.web.client.RestClient;\n\n@SpringBootApplication\npublic class ToolsApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(ToolsApplication.class, args);\n    }\n\n    @Bean\n    HttpSyncGraphQlClient graphQlClient() {\n        return HttpSyncGraphQlClient.create(RestClient.create(\"http://127.0.0.1:8080/graphql\"));\n    }\n}",
      },
      {
        label: "OwnerTools.java (first version)",
        language: "java",
        code: "package demo.tools;\n\nimport java.util.List;\nimport org.springframework.ai.mcp.annotation.*;\nimport org.springframework.graphql.client.HttpSyncGraphQlClient;\nimport org.springframework.stereotype.Component;\n\n@Component\npublic class OwnerTools {\n    public record PetType(String name) {}\n    public record Pet(String name, PetType type) {}\n    public record Owner(String firstName, String lastName, List<Pet> pets) {}\n\n    private final HttpSyncGraphQlClient graphQlClient;\n    OwnerTools(HttpSyncGraphQlClient graphQlClient) { this.graphQlClient = graphQlClient; }\n\n    @McpTool(name = \"getOwnerDetails\", description = \"One owner with their pets\")\n    Owner getOwnerDetails(@McpToolParam(description = \"Owner id\") String id) {\n        return graphQlClient.document(\"\"\"\n                query GetOwnerDetails($id: ID!) {\n                  owner(id: $id) { firstName lastName pets { name type { name } } }\n                }\"\"\")\n            .variable(\"id\", id).retrieveSync(\"owner\").toEntity(Owner.class);\n    }\n}",
      },
      {
        label: "OwnerTools.java (final)",
        language: "java",
        code: "package demo.tools;\n\nimport java.util.List;\nimport org.springframework.ai.mcp.annotation.*;\nimport org.springframework.graphql.client.HttpSyncGraphQlClient;\nimport org.springframework.stereotype.Component;\n\n@Component\npublic class OwnerTools {\n    public record PetType(String name) {}\n    public record Pet(String name, PetType type) {}\n    public record Owner(String firstName, String lastName, List<Pet> pets) {}\n\n    private final HttpSyncGraphQlClient graphQlClient;\n    OwnerTools(HttpSyncGraphQlClient graphQlClient) { this.graphQlClient = graphQlClient; }\n\n    @McpTool(name = \"getOwnerDetails\", description = \"One owner with their pets\", generateOutputSchema = true,\n            annotations = @McpTool.McpAnnotations(readOnlyHint = true, destructiveHint = false,\n                    idempotentHint = true, openWorldHint = false))\n    Owner getOwnerDetails(@McpToolParam(description = \"Owner id\") String id) {\n        return graphQlClient.document(\"\"\"\n                query GetOwnerDetails($id: ID!) {\n                  owner(id: $id) { firstName lastName pets { name type { name } } }\n                }\"\"\")\n            .variable(\"id\", id).retrieveSync(\"owner\").toEntity(Owner.class);\n    }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "cd tools && grep -E 'artifactId|<version>' pom.xml\n./mvnw -q -DskipTests package\njava -jar target/tools-1.0.jar > tools.log 2>&1 &\ncd .. && cat mcp.sh\nMCP=http://127.0.0.1:8081/mcp\n./mcp.sh $MCP tools/list | jq '.result.tools[]'\npkill -f tools-1.0.jar; ./mvnw -q -DskipTests package\njava -jar target/tools-1.0.jar > tools.log 2>&1 &\ncd ..\n./mcp.sh $MCP tools/list | jq -c '.result.tools[] | .annotations, (.outputSchema.properties | keys)'\n./mcp.sh $MCP tools/call '{\"name\":\"getOwnerDetails\",\"arguments\":{\"id\":\"6\"}}' | jq .result\n./mcp.sh $MCP tools/call '{\"name\":\"getOwnerDetails\",\"arguments\":{\"id\":\"999\"}}' | jq .result",
      },
    ],
    resources: [
      {
        title: "Spring AI: MCP overview",
        url: "https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html",
      },
      {
        title: "Spring AI: MCP server Boot starter",
        url: "https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html",
      },
      {
        title: "Model Context Protocol",
        url: "https://modelcontextprotocol.io/",
      },
    ],
  },
  {
    title: "GATool: the operation file is the tool",
    slug: "gatool-the-operation-file-is-the-tool",
    description: "Publish the same tool as a reviewed GraphQL file with GATool, add a second one, watch a broken query stop the application at startup, and see what the secure defaults ask of you.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "GetOwnerDetails.graphql",
        language: "graphql",
        code: "# Returns one owner with their pets.\nquery GetOwnerDetails($id: ID!) {\n  owner(id: $id) {\n    firstName lastName\n    pets { name type { name } }\n  }\n}",
      },
      {
        label: "application.yaml (first version)",
        language: "yaml",
        code: "server:\n  address: 127.0.0.1\n  port: 8082\nspring:\n  ai:\n    mcp:\n      server:\n        name: petclinic-gatool\n        protocol: STREAMABLE\ngatool:\n  api:\n    url: http://127.0.0.1:8080/graphql\n    schema:\n      location: classpath:petclinic.graphqls",
      },
      {
        label: "application.yaml (final)",
        language: "yaml",
        code: "server:\n  address: 127.0.0.1\n  port: 8082\nspring:\n  ai:\n    mcp:\n      server:\n        name: petclinic-gatool\n        protocol: STREAMABLE\ngatool:\n  api:\n    url: http://127.0.0.1:8080/graphql\n    schema:\n      location: classpath:petclinic.graphqls\n  mcp:\n    security:\n      unsafe:\n        allow-mcp-calls-without-authentication: true",
      },
      {
        label: "ListVets.graphql",
        language: "graphql",
        code: "# Lists the vets with their specialties.\nquery ListVets {\n  vets {\n    firstName lastName\n    specialties { name }\n  }\n}",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "grep -E -A1 'GATool 0.1.0|gatool-mcp' pom.xml\ncp ../facade/src/main/resources/graphql/schema.graphqls src/main/resources/petclinic.graphqls\nmkdir -p src/main/resources/gatool/mcp\n./mvnw -q -DskipTests package\njava -jar target/gatool-tools-1.0.jar > gatool.log 2>&1\nsed -n '/^Description/,/^Action/p' gatool.log\n./mvnw -q -DskipTests package\njava -jar target/gatool-tools-1.0.jar > gatool.log 2>&1 &\ngrep WARN gatool.log\nMCP=http://127.0.0.1:8082/mcp\n../mcp.sh $MCP tools/call '{\"name\":\"getOwnerDetails\",\"arguments\":{\"id\":\"6\"}}' | jq .result\nsed -i '' 's/lastName$/lastName nickname/' src/main/resources/gatool/mcp/GetOwnerDetails.graphql\npkill -f gatool-tools-1.0.jar; ./mvnw -q -DskipTests package\njava -jar target/gatool-tools-1.0.jar > gatool.log 2>&1\nsed -n '/^Description/,/^Action/p' gatool.log\nsed -i '' 's/ nickname//' src/main/resources/gatool/mcp/GetOwnerDetails.graphql\n./mvnw -q -DskipTests package\njava -jar target/gatool-tools-1.0.jar > gatool.log 2>&1 &\n../mcp.sh $MCP tools/list | jq -c '.result.tools[] | {name, description, annotations}'",
      },
    ],
    resources: [
      {
        title: "GATool",
        url: "https://gatool.io/",
      },
      {
        title: "GATool on GitHub",
        url: "https://github.com/api-agent-bridge/gatool",
      },
      {
        title: "Luca Berton: No Country for Old APIs",
        url: "https://lucaberton.com/blog/amsterdam-jug-graphql-mcp-2026/",
      },
    ],
  },
  {
    title: "When the list of tools grows",
    slug: "when-the-list-of-tools-grows",
    description: "See why agents choose worse with more tools and what tool search does about it, run GATool's experimental tools that let a model search the schema and write its own query within limits, and leave with a policy for which to use.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "application-dynamic.yaml",
        language: "yaml",
        code: "gatool:\n  dev:\n    experimental:\n      generate-tools: dynamic-three-step\n      dynamic-operations:\n        max-depth: 4\n        max-fields: 40\n        max-aliases: 5",
      },
      {
        label: "Commands of this lesson",
        language: "bash",
        code: "ls src/main/resources/gatool/mcp\n./mvnw -q -DskipTests package\njava -jar target/gatool-tools-1.0.jar --spring.profiles.active=dynamic > gatool.log 2>&1 &\ngrep -E 'tokens in all|BM25|deploy' gatool.log\nMCP=http://127.0.0.1:8082/mcp\n../mcp.sh $MCP tools/list | jq -r '.result.tools[].name'\ncall() { ../mcp.sh $MCP tools/call \"{\\\"name\\\":\\\"$1\\\",\\\"arguments\\\":$2}\" |\n  jq -r '.result.content[].text'; }\ncall searchSchema '{\"question\":\"Which pets does Jean Coleman have?\"}' | head -6\ncall introspectType '{\"name\":\"Owner\"}'\ncall executeGraphql '{\"document\":\"{ owners { lastName pets { name } } }\"}' | jq -c '.data.owners[5]'\ncall executeGraphql '{\"document\":\"mutation { deleteOwner(id: 6) }\"}'\ncall executeGraphql '{\"document\":\"{ __schema { types { name } } }\"}'\npkill -f gatool-tools-1.0.jar\njava -jar target/gatool-tools-1.0.jar --spring.profiles.active=dynamic \\\n  --gatool.dev.experimental.dynamic-operations.max-depth=3 > gatool.log 2>&1 &\ncall executeGraphql '{\"document\":\"{ owner(id: 6) { pets { visits { date } } } }\"}'\npkill -f gatool-tools-1.0.jar; pkill -f facade-0.0.1-SNAPSHOT.jar\ndocker rm -fv petclinic",
      },
    ],
    resources: [
      {
        title: "GATool on GitHub",
        url: "https://github.com/api-agent-bridge/gatool",
      },
      {
        title: "Model Context Protocol",
        url: "https://modelcontextprotocol.io/",
      },
      {
        title: "Luca Berton: No Country for Old APIs",
        url: "https://lucaberton.com/blog/amsterdam-jug-graphql-mcp-2026/",
      },
    ],
  },
];

export async function seedGraphqlMcpCourse(prisma: PrismaClient) {
  const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
  const course = await prisma.course.upsert({
    where: { slug: GRAPHQL_MCP_COURSE_SLUG },
    update: {},
    create: {
      title: "Legacy APIs as MCP Tools Through GraphQL",
      slug: GRAPHQL_MCP_COURSE_SLUG,
      description:
        "Agents will call your services, and most of those services are old REST and SOAP APIs that nobody wants to rewrite. Generating one tool per endpoint fails too: agents choose worse when the list of tools grows. This course takes the path Željko Kozina showed at the Amsterdam Java User Group, as Luca Berton wrote it up on lucaberton.com: put a GraphQL facade in front of the old API, design tools from the screens people already use, and publish each GraphQL operation as an MCP tool.\n\nYou build it in Java with Spring, on the Spring PetClinic REST API: first the facade, then tools written by hand with Spring AI, then tools that are only a reviewed GraphQL file with GATool. You call every tool yourself, so you see exactly what an agent sends and gets back.\n\nThe narration is a synthetic voice made from the author's own voice.",
      difficulty: "INTERMEDIATE",
      track: "AI_AGENTS",
      status: "DRAFT",
      announced: false,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      thumbnailUrl: "/images/courses/legacy-apis-mcp-tools-graphql.svg",
      outcomes: [
        "Read the calls a legacy screen makes, and see what they cost an agent",
        "Put a GraphQL facade in front of a REST API, and fetch a whole screen with one query",
        "Keep the facade safe: read-only operations, depth limits and clean errors",
        "Turn a named GraphQL operation into an MCP tool with Spring AI",
        "Publish trusted GraphQL documents as MCP tools with GATool, and catch broken ones at startup",
        "Keep the list of tools small, and know when tool search or dynamic tools are worth it",
      ],
      prerequisites: [
        "A Mac with Apple silicon, Docker through Colima, and a Java 25 JDK",
        "Basic Java and Spring Boot: a controller, application properties, running with Maven",
        "What an MCP server is, at the level of the course \"Build and Secure an MCP Server\"",
      ],
      estimatedDuration: 28,
    },
  });

  for (const lessonData of graphqlMcpLessons) {
    await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
      update: { ...lessonData },
      create: { ...lessonData, courseId: course.id, status: "DRAFT" },
    });
  }

  console.log(`  ✓ Course "${course.title}" (DRAFT) with ${graphqlMcpLessons.length} lessons`);
}
