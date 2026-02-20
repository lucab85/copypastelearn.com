# ---------- Stage 1: build ----------
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./

# Copy only the packages the lab service needs
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

COPY services/labs/package.json services/labs/tsconfig.json ./services/labs/

# Install all deps (workspace-aware)
RUN pnpm install --frozen-lockfile

# Build shared package first, then lab service
COPY services/labs/src ./services/labs/src
RUN pnpm --filter @copypastelearn/shared build && \
    pnpm --filter @copypastelearn/labs build

# Prune dev dependencies
RUN pnpm --filter @copypastelearn/labs --prod deploy /app/pruned

# ---------- Stage 2: runtime ----------
FROM node:20-slim AS runtime

LABEL org.opencontainers.image.source="https://github.com/copypastelearn/copypastelearn.com"
LABEL org.opencontainers.image.description="CopyPasteLearn Lab Service"

# We do NOT install Docker inside the container.
# The host Docker socket is mounted at runtime via -v /var/run/docker.sock
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/pruned/node_modules ./node_modules
COPY --from=builder /app/services/labs/dist ./dist
COPY --from=builder /app/services/labs/package.json ./

# Copy shared dist into node_modules so imports resolve
COPY --from=builder /app/packages/shared/dist ./node_modules/@copypastelearn/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@copypastelearn/shared/package.json

# Copy lab definition images (Dockerfiles for sandbox containers)
COPY services/labs/images ./images

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

USER node

CMD ["node", "dist/index.js"]
