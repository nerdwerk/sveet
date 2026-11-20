#!/usr/bin/env bash
# `bun run sandbox [command]` — this project in a microsandbox microVM.
#
#   bun run sandbox            create (first time) + set up, then open a shell
#   bun run sandbox dev        dev server on http://localhost:5173
#   bun run sandbox verify     lint + check + all tests, in Linux
#   bun run sandbox agent      Claude Code with --dangerously-skip-permissions
#   bun run sandbox shell      a shell in the running sandbox
#   bun run sandbox stop|rm    stop it, or delete it (and its disks)
#
# Needs `msb` (brew install superradcompany/tap/microsandbox) on Apple Silicon
# or Linux with KVM. ANTHROPIC_API_KEY, if set on the host, is handed over as a
# microsandbox secret: the VM only ever sees a placeholder, and the real key is
# substituted on the way to api.anthropic.com. Without it, log in inside.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v msb > /dev/null || {
	echo "msb not found — brew install superradcompany/tap/microsandbox" >&2
	exit 1
}

NAME="${SANDBOX_NAME:-$(bun -e 'console.log(require("./package.json").name)')}-sandbox"
COMMAND="${1:-shell}"
[ $# -gt 0 ] && shift

exists() { msb inspect "$NAME" > /dev/null 2>&1; }

create() {
	local secret=()
	[ -n "${ANTHROPIC_API_KEY:-}" ] && secret=(--secret "ANTHROPIC_API_KEY@api.anthropic.com")
	echo "→ creating sandbox $NAME"
	msb create --conf Sandboxfile --name "$NAME" \
		-v "$(pwd -P):/app" \
		--mount-owned /app/node_modules:kind=disk,size=8G \
		--mount-owned /scratch:kind=disk,size=8G \
		-p 5173:5173 \
		${secret[@]+"${secret[@]}"}
	msb exec "$NAME" -- setup
}

case "$COMMAND" in
	stop) exec msb stop "$NAME" ;;
	rm) msb stop "$NAME" > /dev/null 2>&1 || true; exec msb rm "$NAME" ;;
esac

if exists; then
	msb start "$NAME" > /dev/null 2>&1 || true
else
	create
fi

case "$COMMAND" in
	shell) exec msb exec -t "$NAME" -- bash ;;
	setup | dev | verify) exec msb exec -t "$NAME" -- "$COMMAND" "$@" ;;
	agent) exec msb exec -t "$NAME" -- agent "$@" ;;
	*) exec msb exec -t "$NAME" -- "$COMMAND" "$@" ;;
esac
