#!/bin/sh
set -e

echo "→ applying migrations to ${DATABASE_PATH}"
bun run ./migrate.js

echo "→ starting server on :${PORT}"
exec bun ./build/index.js
