# =============================================================================
# Mino Relay — Multi-stage Dockerfile (Bun runtime)
#
# Build:  docker build -f docker/Relay.Dockerfile -t mino-relay .
# Run:    docker run -p 8787:8787 mino-relay
# =============================================================================

FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/relay/package.json ./apps/relay/

RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1 AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/relay/node_modules ./apps/relay/node_modules
COPY tsconfig.base.json ./
COPY apps/relay/ ./apps/relay/

RUN cd apps/relay && bun run build

FROM oven/bun:1-slim AS runtime

LABEL org.opencontainers.image.title="Mino Relay"
LABEL org.opencontainers.image.description="Managed relay service for private Mino servers"
LABEL org.opencontainers.image.source="https://github.com/TomSzenessy/MinoAI"
LABEL org.opencontainers.image.url="https://mino.ink"

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/relay/node_modules ./apps/relay/node_modules
COPY --from=build /app/apps/relay/dist ./apps/relay/dist
COPY apps/relay/package.json ./apps/relay/

ENV NODE_ENV=production
ENV RELAY_PORT=8787
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:8787/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["bun", "run", "apps/relay/dist/index.js"]
