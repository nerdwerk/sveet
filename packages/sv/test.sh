#!/usr/bin/env bash
# Release gate: create a project with sv + this add-on, then run sveet's own verify in it.
set -euo pipefail
cd "$(dirname "$0")"
bun run build
APP="$(cd "$(mktemp -d)" && pwd -P)/app"
bunx sv create "$APP" --template minimal --types ts --add "file:$PWD" --no-download-check --install bun
cd "$APP"
bun run setup
bunx playwright install chromium > /dev/null
bun run verify
echo "✓ sv create --add @nerdwerk produced a passing sveet project at $APP"
