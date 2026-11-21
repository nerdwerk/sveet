#!/usr/bin/env bash
# `bun run deploy` — verify, then ship to Fly. Deliberately refuses to run inside
# the sandbox: agents there can build and test anything, but shipping to
# production stays a human decision made on the host.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "${SVEET_SANDBOX:-}" ]; then
	echo "✋ Deploys don't run inside the sandbox. Run \`bun run deploy\` on your host." >&2
	exit 1
fi
command -v fly > /dev/null || {
	echo "flyctl not found — brew install flyctl (or see the sveet-deploy skill for other targets)" >&2
	exit 1
}
bun run verify
exec fly deploy "$@"
