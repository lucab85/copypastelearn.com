# Research: CopyPasteLearn MVP Platform

**Branch**: `001-mvp-platform` | **Date**: 2026-02-19

## Technology Evaluation

### Next.js App Router (selected)

**Why**: Server-first rendering model aligns with Constitution Principle I (fast perceived performance, minimal hydration for marketing pages). Route groups enable clean separation between public `(marketing)` and authenticated `(app)` sections. Server actions provide secure server-side mutations without building a separate API layer. React Server Components reduce client bundle size.

**Alternatives considered**:
- **Remix**: Strong server-rendering story but smaller ecosystem and community. Clerk/Mux integrations are more mature for Next.js.
- **Astro + React islands**: Excellent for content sites, but the interactive lab terminal and dashboard require more client-side interactivity than Astro's island model comfortably provides.
- **SvelteKit**: Excellent DX but would require retraining and finding Svelte-compatible alternatives for Clerk, Mux player, and xterm.js.

**Decision**: Next.js App Router is the best fit given the Clerk/Mux ecosystem alignment, server-first rendering, and shadcn/ui availability.

### Clerk for Auth + Billing (selected)

**Why**: Constitution Principle III mandates managed services. Clerk provides authentication (email/password, social, MFA), user management, and billing (Clerk Billing with Stripe) in a single SDK. This eliminates building custom auth flows, session management, billing portals, and webhook orchestration.

**Alternatives considered**:
- **Auth0 + Stripe (direct)**: More flexible but two separate integrations to maintain; no built-in billing portal. Higher integration complexity.
- **Supabase Auth + Stripe**: Supabase Auth is tied to Supabase Postgres; less flexible if we want to use Neon or another managed Postgres. No billing integration.
- **Custom (NextAuth.js + Stripe)**: Maximum flexibility but violates Principle III; significant build and maintenance effort for auth flows and billing.

**Decision**: Clerk + Clerk Billing minimizes integration surface area. Single SDK for auth and billing.

### Mux for Video (selected)

**Why**: Purpose-built video hosting/streaming with a React player component (`@mux/mux-player-react`). Provides playback IDs, adaptive bitrate streaming, viewer analytics, and thumbnail generation. No need to manage transcoding pipelines or CDN configuration.

**Alternatives considered**:
- **Cloudflare Stream**: Competitive pricing but less mature React SDK and no built-in viewer analytics dashboard.
- **AWS MediaConvert + CloudFront**: Full control but violates Principle III; significant operational overhead for video pipeline.
- **Vimeo OTT**: More suited to standalone video platforms; less API-first than Mux.

**Decision**: Mux offers the best developer experience for embed-and-play with analytics. React component drops directly into lesson pages.

### Prisma + Managed Postgres (selected)

**Why**: Prisma provides type-safe database access, declarative schema management, and migrations. Managed Postgres (Neon or Supabase) eliminates database operations. Constitution Principle V specifies Prisma + Postgres.

**Alternatives considered**:
- **Drizzle ORM**: Lighter weight, closer to raw SQL. Community growing but less mature migration tooling and documentation than Prisma.
- **Kysely**: Type-safe query builder, excellent for complex queries, but no schema management or migrations built-in.

**Decision**: Prisma's schema-first approach, migration system, and strong TypeScript integration make it the safest choice for a small team shipping fast. Can evaluate Drizzle later if Prisma's query performance becomes a bottleneck.

### xterm.js for Terminal (selected)

**Why**: Industry-standard browser terminal emulator used by VS Code, Theia, and most browser-based IDEs. Handles ANSI escape codes, terminal resizing, and input/output streaming. Mature, well-documented, and battle-tested.

**Alternatives considered**:
- **Custom textarea + ANSI parser**: Far too much effort for MVP; would not match the quality of xterm.js.
- **Hterm (Chrome OS terminal)**: Less actively maintained; smaller community.

**Decision**: xterm.js is the clear choice. No reasonable alternative for MVP.

### Docker (single-host) for Lab Runtime (selected for MVP)

**Why**: Simplest path to isolated ephemeral containers. Dockerode (Node.js Docker API client) provides container create, start, exec, attach, stop, and remove. A single VM with Docker is easy to provision, monitor, and debug.

**Alternatives considered**:
- **Kubernetes (namespaces + jobs)**: More scalable and resilient, but adds significant operational complexity (cluster setup, NetworkPolicies, RBAC, node pools). Overkill for 3–5 labs with low initial user count.
- **Firecracker microVMs**: Strongest isolation but requires custom tooling and a Linux bare-metal or nitro host. Too complex for MVP.
- **Kata Containers**: Better isolation than Docker but smaller ecosystem and harder to debug. Consideration for post-MVP hardening.

**Decision**: Docker on a single VM for MVP. The orchestrator interface is abstract so Kubernetes (or Firecracker) can be swapped in later without changing the Lab Service API.

### Fastify for Lab Service API (selected)

**Why**: Lightweight, fast, schema-first Node.js HTTP framework with built-in WebSocket support via `@fastify/websocket`. Lower overhead than Express for JSON-heavy APIs. First-class TypeScript support.

**Alternatives considered**:
- **Express**: More widely known but lacks built-in schema validation, slower for JSON serialization, and WebSocket requires additional middleware (`express-ws` or `ws` + manual upgrade).
- **Hono**: Ultra-lightweight but less mature WebSocket and plugin ecosystem.

**Decision**: Fastify provides the right balance of performance, plugin ecosystem (WebSocket, SSE, auth), and TypeScript support for the Lab Service.

## Security Research

### Container Isolation (Docker, MVP)

- **Network**: Docker custom bridge network with `--internal` flag for default-deny egress. Per-lab allowlists via iptables rules or Docker network configurations.
- **Capabilities**: Drop all Linux capabilities; add back only what specific labs require (rare for MVP).
- **Filesystem**: Read-only root filesystem where possible; writable `/tmp` only. No host mounts.
- **User**: Run as non-root user (configurable UID in lab image).
- **Resources**: `--memory`, `--cpus`, `--pids-limit` flags per container.
- **Exec timeout**: Each `docker exec` call wrapped with a timeout to prevent hangs.

### Output Sanitization

- Strip ANSI escape sequences that could inject invisible characters.
- Regex-based removal of patterns matching internal IPs, hostnames, Docker socket paths, environment variable secrets.
- Configurable deny-list per lab definition for lab-specific sensitive strings.
- Truncation: cap output length to prevent memory exhaustion in the browser.

## Performance Considerations

### Marketing Pages (LCP < 2s)

- Server-rendered with minimal/no client JavaScript.
- Use Next.js `(marketing)` route group with static generation where possible.
- Images optimized via `next/image` with responsive sizes.
- No Clerk or Mux scripts loaded on marketing pages.

### Lesson Pages (resume < 3s)

- Video player: lazy-load Mux player component; show skeleton until ready.
- Progress fetch: server action loads saved position before rendering player; `startTime` prop on Mux player.
- Transcript: load as secondary content after video player is interactive.

### Lab Provisioning (< 60s)

- Pre-pull images on the Docker host to avoid download time on first launch.
- Container creation is fast (< 1s); the startup time of the lab image dominates.
- Health check polling (internal, not user-facing) to detect when the lab environment is ready to accept commands.
- SSE status stream keeps the learner informed during provisioning.
