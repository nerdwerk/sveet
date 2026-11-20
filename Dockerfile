# syntax=docker/dockerfile:1

# Pinned, not `1`: a cached floating tag can quietly keep an old runtime.
# 1.4.4 carries the Brotli fix for CVE-2026-111497. Bump with `engines.bun`.
FROM oven/bun:1.4.4 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# adapter-bun compiles the app, its dependencies and the bun runtime into one
# executable at build/server. Secrets come from `fly secrets` at runtime;
# src/env.ts substitutes harmless stand-ins while building.
RUN bun run build

# The runtime is the executable, the committed migrations and a shell for
# `fly ssh console`. No bun, no node_modules. The server applies pending
# migrations on start (hooks.server.ts → init).
FROM debian:trixie-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/sqlite.db
COPY --from=builder /app/build/server ./server
COPY --from=builder /app/drizzle ./drizzle
EXPOSE 3000
CMD ["./server"]
