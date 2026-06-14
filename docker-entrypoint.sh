#!/bin/sh
set -e

echo "→ applying migrations to ${DATABASE_URL}"
bun run ./src/lib/server/db/migrate.ts

echo "→ starting server on :${PORT}"
exec bun ./build/index.js
