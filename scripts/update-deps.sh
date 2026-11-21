#!/usr/bin/env bash
# In-range updates (no majors), committed only if verify passes.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -z "$(git status --porcelain)" ] || { echo "Commit or stash your changes first." >&2; exit 1; }

bun update
if git diff --quiet -- package.json bun.lock; then echo "Nothing to update."; exit 0; fi
if bun run verify; then
	git commit -m "Dependency update $(date +%F)" -- package.json bun.lock
else
	git checkout -- package.json bun.lock && bun install
	echo "!! verify failed — update reverted" >&2
	exit 1
fi
