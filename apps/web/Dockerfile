# ---------- Stage 1: dependencies ----------
FROM node:20-slim AS deps

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# ---------- Stage 2: build ----------
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Generate Prisma client
RUN pnpm --filter @copypastelearn/web db:generate

# Build shared, then web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @copypastelearn/shared build && \
    pnpm --filter @copypastelearn/web build

# ---------- Stage 3: runtime ----------
FROM node:20-slim AS runtime

LABEL org.opencontainers.image.source="https://github.com/copypastelearn/copypastelearn.com"
LABEL org.opencontainers.image.description="CopyPasteLearn Web App"

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

USER node

CMD ["node", "apps/web/server.js"]
