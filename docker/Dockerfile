# =============================================================================
# Mino Server — Multi-stage Dockerfile (Bun runtime)
#
# Build:  docker build -f docker/Dockerfile -t mino-server .
# Run:    docker run -p 3000:3000 -v mino-data:/data mino-server
#
# Stages:
#   1. deps     — Install production dependencies
#   2. build    — TypeScript compilation (shared + server)
#   3. runtime  — Slim image with only what's needed to run
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy workspace config first (cacheable layer)
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install dependencies using Bun (faster than pnpm in Docker)
RUN bun install --frozen-lockfile || bun install

# ---------------------------------------------------------------------------
# Stage 2: Build TypeScript
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Commit-scoped build arg to prevent stale source cache reuse across publish runs.
ARG BUILD_COMMIT=dev
RUN echo "Building server image from commit: ${BUILD_COMMIT}"

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/server/ ./apps/server/
COPY apps/web/ ./apps/web/
COPY docs/ ./docs/
COPY docstart/ ./docstart/

# Fail fast with a clear message if the docs catch-all route export is not present.
RUN test -f 'apps/web/app/docs/[...slug]/page.tsx' \
  && grep -n "generateStaticParams" 'apps/web/app/docs/[...slug]/page.tsx'

# Build shared package first (server depends on it)
RUN cd packages/shared && bun run build

# Build static web app for Cloudflare + built-in UI
RUN cd apps/web && MINO_WEB_OUTPUT=export bun run build

# Build server
RUN cd apps/server && bun run build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM oven/bun:1-slim AS runtime

LABEL org.opencontainers.image.title="Mino Server"
LABEL org.opencontainers.image.description="Agent-first, markdown-based knowledge platform"
LABEL org.opencontainers.image.source="https://github.com/TomSzenessy/MinoAI"
LABEL org.opencontainers.image.url="https://mino.ink"

# Ensure TLS works for outbound HTTPS (slim images may lack CA certs)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only what's needed to run
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/server/src ./apps/server/src
COPY --from=build /app/apps/web/out ./apps/web/out
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Create data directory mount point
RUN mkdir -p /data/notes /data/plugins

# Server listens on port 3000
EXPOSE 3000

# Health check — use Bun fetch (avoids relying on curl in slim image)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:3000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# Set production mode
ENV NODE_ENV=production
ENV MINO_DATA_DIR=/data
ENV MINO_WEB_DIST=/app/apps/web/out

# Start the server
CMD ["bun", "run", "apps/server/src/index.ts"]
