#!/usr/bin/env bash
# `bun run sandbox [command]` — the project's dev VM (microsandbox). The same
# command works on the host and inside the VM.
#
#   (none) | up          create on first run, start, run dev + opencode, print URLs
#   status               URLs, password, what's running
#   restart [dev|opencode|all]   restart a service (default: dev)
#   logs [dev|opencode]  follow a service's log
#   shell                a shell inside the VM
#   agent [opencode|claude|codex]  a terminal agent inside the VM, no permission prompts
#   acp [opencode|claude]          ACP over stdio, for editors (see `zed`)
#   zed                  print the Zed settings that run the agent inside the VM
#   stop | rm            stop the VM, or delete it with its disks (logins included)
#
# Host requirements: microsandbox (see Brewfile). Pure bash on purpose: it must
# run before anything is installed. Deploys stay on the host; see scripts/deploy.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$ROOT"

COMMAND="${1:-up}"
[ $# -gt 0 ] && shift

if [ -n "${SVEET_SANDBOX:-}" ]; then
	case "$COMMAND" in
		restart | status | logs | password) exec bash scripts/sandbox-vm.sh "$COMMAND" "$@" ;;
		*) echo "You're inside the sandbox already. Here: restart, status, logs. Run '$COMMAND' on the host." >&2; exit 1 ;;
	esac
fi

command -v msb > /dev/null || {
	echo "microsandbox (msb) not found — brew bundle, or brew install superradcompany/tap/microsandbox" >&2
	exit 1
}

PROJECT="$(sed -n 's/^[[:space:]]*"name":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -1)"
NAME="${SANDBOX_NAME:-${PROJECT:-app}-sandbox}"

vm() { msb exec --no-stdin -w "$ROOT" "$NAME" -- bash scripts/sandbox-vm.sh "$@"; }
exists() { msb inspect "$NAME" < /dev/null > /dev/null 2>&1; }

ensure_up() {
	if ! exists; then
		echo "→ creating sandbox $NAME (first run takes a few minutes)" >&2
		msb create --conf Sandboxfile --name "$NAME" -w "$ROOT" \
			-v "$ROOT:$ROOT" \
			--mount-owned "$ROOT/node_modules:kind=disk,size=8G" \
			--mount-owned /scratch:kind=disk,size=16G \
			-p 5173:5173 -p 4096:4096 < /dev/null > /dev/null
	else
		msb start "$NAME" < /dev/null > /dev/null 2>&1 || true
	fi
	vm up >&2
}

banner() {
	local password
	password="$(vm password)"
	cat << EOF

  🍭 $NAME is running

  App       http://localhost:5173
  Agent     http://localhost:4096   user: opencode   password: $password

  bun run sandbox restart     restart the dev server (also: opencode, all)
  bun run sandbox logs        follow the dev server log (also: opencode)
  bun run sandbox agent       opencode in this terminal (also: claude, codex)
  bun run sandbox shell       a shell inside the VM
  bun run sandbox zed         use the VM's agent from Zed (ACP)
  bun run sandbox stop        stop the VM; \`bun run sandbox\` brings it back

  Your code is live-mounted. Deploys run here on the host: bun run deploy
EOF
	vm status | sed 's/^/  /'
}

case "$COMMAND" in
	up)
		ensure_up
		banner
		;;
	status)
		exists || { echo "No sandbox yet — run: bun run sandbox" >&2; exit 1; }
		banner
		;;
	restart) ensure_up && vm restart "$@" ;;
	logs) ensure_up && exec msb exec -t -w "$ROOT" "$NAME" -- bash scripts/sandbox-vm.sh logs "$@" ;;
	shell) ensure_up && exec msb exec -t -w "$ROOT" "$NAME" -- bash -l ;;
	agent) ensure_up && exec msb exec -t -w "$ROOT" "$NAME" -- bash scripts/sandbox-vm.sh agent "$@" ;;
	acp)
		# stdout carries the protocol; everything else goes to stderr.
		ensure_up
		exec msb exec --stream -w "$ROOT" "$NAME" -- bash scripts/sandbox-vm.sh acp "$@"
		;;
	zed)
		cat << EOF
Add to Zed's settings (zed: open settings) — agent_servers is a global setting,
so the name includes the project:

  "agent_servers": {
    "opencode ($NAME)": {
      "command": "$ROOT/scripts/sandbox.sh",
      "args": ["acp", "opencode"]
    },
    "Claude Code ($NAME)": {
      "command": "$ROOT/scripts/sandbox.sh",
      "args": ["acp", "claude"]
    }
  }

Then pick it in the agent panel. Zed starts the VM if it isn't running. Sign in
to a provider once first, with: bun run sandbox agent   (opencode: /connect)
EOF
		;;
	stop) exec msb stop "$NAME" ;;
	rm)
		msb stop "$NAME" > /dev/null 2>&1 || true
		exec msb rm "$NAME"
		;;
	*)
		sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
		exit 1
		;;
esac
