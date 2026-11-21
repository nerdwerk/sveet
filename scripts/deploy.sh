#!/usr/bin/env bash
# Shipping to production stays a human decision, made on the host.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -n "${SVEET_SANDBOX:-}" ]; then
	echo "✋ Deploys don't run inside the sandbox. Run \`bun run deploy\` on your host." >&2
	exit 1
fi
bun run verify
exec fly deploy "$@"
