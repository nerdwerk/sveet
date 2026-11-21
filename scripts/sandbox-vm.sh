#!/usr/bin/env bash
# Inside the VM: one-time setup, plus a supervisor that restarts `dev` and `opencode` when they exit.
set -euo pipefail
cd "$(dirname "$0")/.."

RUN=/scratch/run
LOGS=/scratch/logs
mkdir -p "$RUN" "$LOGS" "$HOME"

# The bun image has no `node`, which some agent CLIs launch through; bun stands in.
mkdir -p "$HOME/.local/bin"
[ -e "$HOME/.local/bin/node" ] || ln -s "$(command -v bun)" "$HOME/.local/bin/node"

# /scratch outlives VM restarts; PID files from an earlier boot mean nothing.
BOOT="$(cat /proc/sys/kernel/random/boot_id)"
if [ "$(cat "$RUN/boot_id" 2> /dev/null)" != "$BOOT" ]; then
	rm -f "$RUN"/*
	echo "$BOOT" > "$RUN/boot_id"
fi

service_cmd() {
	case "$1" in
		dev) echo 'bun --bun vite dev' ;;
		opencode) echo 'OPENCODE_PASSWORD="$(cat /scratch/opencode-password)" opencode serve --hostname 0.0.0.0 --port 4096' ;;
		*) echo "unknown service: $1 (dev, opencode)" >&2; return 1 ;;
	esac
}

alive() { [ -f "$1" ] && kill -0 "$(cat "$1")" 2> /dev/null; }

start() {
	local name=$1 cmd
	cmd=$(service_cmd "$name")
	alive "$RUN/$name.loop" && return 0
	# Own process group per run, so a restart also kills the service's children.
	setsid nohup bash -c "
		while true; do
			setsid bash -c '$cmd' &
			echo \$! > '$RUN/$name.pid'
			wait \$! || true
			echo \"[sandbox] $name exited — restarting in 1s\"
			sleep 1
		done" >> "$LOGS/$name.log" 2>&1 < /dev/null &
	echo $! > "$RUN/$name.loop"
}

restart() {
	local name
	for name in "$@"; do
		if alive "$RUN/$name.pid"; then
			kill -TERM -- "-$(cat "$RUN/$name.pid")" 2> /dev/null || true
			echo "↻ $name restarting"
		else
			start "$name"
			echo "▶ $name started"
		fi
	done
}

setup() {
	echo "→ installing dependencies"
	bun install --frozen-lockfile
	[ -f .env ] || bun scripts/setup.ts
	[ -s /scratch/local.db ] || bun run db:reset
	if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
		echo "→ installing Chromium for e2e tests (one time)"
		bunx playwright install --with-deps chromium > "$LOGS/playwright-install.log" 2>&1
	fi
	if ! command -v opencode > /dev/null; then
		echo "→ installing opencode"
		bun install -g --trust @opencode/cli > "$LOGS/agent-install.log" 2>&1
	fi
	[ -s /scratch/opencode-password ] || head -c 18 /dev/urandom | base64 | tr -d '/+=' > /scratch/opencode-password
	touch /scratch/.ready
}

install_agent() {
	case "$1" in
		opencode) command -v opencode > /dev/null || bun install -g --trust @opencode/cli ;;
		claude) command -v claude > /dev/null || bun install -g @anthropic-ai/claude-code ;;
		codex) command -v codex > /dev/null || bun install -g @openai/codex ;;
		*) echo "unknown agent: $1 (opencode, claude, codex)" >&2; exit 1 ;;
	esac > "$LOGS/agent-install.log" 2>&1
}

case "${1:-}" in
	up)
		[ -f /scratch/.ready ] || setup
		start dev
		start opencode
		;;
	setup) setup ;;
	restart)
		shift
		[ $# -eq 0 ] && set -- dev
		[ "$1" = all ] && set -- dev opencode
		restart "$@"
		;;
	status)
		for name in dev opencode; do
			if alive "$RUN/$name.pid"; then echo "$name: running"; else echo "$name: down"; fi
		done
		;;
	password) cat /scratch/opencode-password ;;
	logs)
		name=${2:-dev}
		service_cmd "$name" > /dev/null
		exec tail -n 50 -f "$LOGS/$name.log"
		;;
	agent)
		agent=${2:-opencode}
		install_agent "$agent"
		shift 2 || shift
		case "$agent" in
			# The terminal UI on the same server as the web UI: one set of sessions.
			opencode) OPENCODE_PASSWORD="$(cat /scratch/opencode-password)" exec opencode --server http://127.0.0.1:4096 "$@" ;;
			claude) exec claude --dangerously-skip-permissions "$@" ;;
			codex) exec codex --dangerously-bypass-approvals-and-sandbox "$@" ;;
		esac
		;;
	acp)
		agent=${2:-opencode}
		install_agent "$agent"
		case "$agent" in
			opencode) exec opencode acp ;;
			claude)
				command -v claude-agent-acp > /dev/null ||
					bun install -g @agentclientprotocol/claude-agent-acp > "$LOGS/agent-install.log" 2>&1
				exec claude-agent-acp
				;;
			*) echo "no ACP bridge for $agent (opencode, claude)" >&2; exit 1 ;;
		esac
		;;
	*)
		echo "usage: sandbox-vm.sh up|setup|restart [dev|opencode|all]|status|password|logs [dev|opencode]|agent [opencode|claude|codex]|acp [opencode|claude]" >&2
		exit 1
		;;
esac
