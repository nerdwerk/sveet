#!/usr/bin/env bash
# Update dependencies within their semver ranges (minor/patch only, no majors),
# and commit the result if `bun run verify` passes (lint, types, all tests).
#
# Flow:
#   1. Stash local changes if the working tree is dirty (incl. untracked files)
#   2. bun update (respects ranges in package.json, never crosses majors)
#   3. bun run lint
#   4. If lint passes: commit package.json + bun.lock; otherwise revert them
#   5. Re-apply the stash
set -uo pipefail

cd "$(dirname "$0")/.."

DATE="$(date +%Y-%m-%d)"
TITLE="Automatic Dependency Update ${DATE}"
STASHED=0
STATUS=0

restore_stash() {
	if [ "$STASHED" -eq 1 ]; then
		echo "==> Re-applying stash"
		if ! git stash pop; then
			echo "!! Stash pop had conflicts. Your changes remain in the stash (git stash list)." >&2
			STATUS=1
		fi
	fi
}

if [ -n "$(git status --porcelain)" ]; then
	echo "==> Working tree not clean, stashing changes"
	git stash push --include-untracked -m "update-deps: auto stash ${DATE}" || {
		echo "!! Could not stash changes, aborting." >&2
		exit 1
	}
	STASHED=1
fi

echo "==> Updating dependencies (minor/patch only)"
if ! bun update; then
	echo "!! bun update failed" >&2
	git checkout -- package.json bun.lock 2>/dev/null
	restore_stash
	exit 1
fi

if git diff --quiet -- package.json bun.lock; then
	echo "==> No dependency changes, nothing to commit"
	restore_stash
	exit "$STATUS"
fi

echo "==> Running verify"
if bun run verify; then
	git add package.json bun.lock
	git commit -m "$TITLE"
	echo "==> Committed: $TITLE"
else
	echo "!! Verify failed, reverting dependency update" >&2
	git checkout -- package.json bun.lock
	bun install >/dev/null 2>&1
	STATUS=1
fi

restore_stash
exit "$STATUS"
