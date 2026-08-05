# syntax=docker/dockerfile:1

# ---- builder ----
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
# Bundle the runtime migrator into a single file so the runtime image needs
# no node_modules at all (bun:sqlite is a builtin, nothing native to link).
RUN bun build src/lib/server/db/migrate.ts --target=bun --outfile=migrate.js

# ---- runtime ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# SQLite file on the mounted Fly volume.
ENV DATABASE_PATH=/data/sqlite.db

# Build output + the committed migrations + the bundled migrator. That's all.
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/migrate.js ./migrate.js
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
