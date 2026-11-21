# syntax=docker/dockerfile:1
# Pinned: a cached floating tag can keep an old runtime. Bump with engines.bun and CI.
FROM oven/bun:1.4.4 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Just the compiled server and its migrations; it migrates on start.
FROM debian:trixie-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/data/sqlite.db
COPY --from=builder /app/build/server ./server
COPY --from=builder /app/drizzle ./drizzle
EXPOSE 3000
CMD ["./server"]
