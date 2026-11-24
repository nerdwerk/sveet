#!/usr/bin/env bash
# Releases sveet from a pushed-or-pushable main: gates, tag v<sveet.version>, push, publish @nerdwerk/sv.
# Safe to re-run: an existing tag on HEAD and an already published version are skipped.
set -euo pipefail
cd "$(dirname "$0")/../.."
fail() {
	echo "✗ $*" >&2
	exit 1
}

version=$(bun -e 'console.log((await Bun.file("package.json").json()).sveet.version)')
addon=$(bun -e 'console.log((await Bun.file("packages/sv/package.json").json()).version)')
tag="v$version"

[ "$addon" = "$version" ] || fail "packages/sv/package.json is $addon but sveet.version is $version: bump both"
grep -q "^## \[$version\]" CHANGELOG.md || fail "CHANGELOG.md has no '## [$version]' section"
[ "$(git branch --show-current)" = main ] || fail "switch to main first"
[ -z "$(git status --porcelain --untracked-files=no)" ] || fail "commit or stash your changes first"
git fetch -q --tags --force origin main
[ "$(git rev-list --count HEAD..origin/main)" = 0 ] || fail "main is behind origin: git pull first"
bunx npm whoami > /dev/null || fail "log in to npm first: bunx npm login"

existing=$(git rev-parse -q --verify "refs/tags/$tag^{commit}" || true)
if [ -n "$existing" ] && [ "$existing" != "$(git rev-parse HEAD)" ]; then
	fail "$tag already points at $(git log --oneline -1 "$existing"), not HEAD. If that's wrong: git tag -d $tag && git push origin :refs/tags/$tag"
fi

echo "→ releasing $tag from $(git log --oneline -1)"
bun run verify
(cd packages/sv && bun install --frozen-lockfile && ./test.sh)

[ -n "$existing" ] || git tag -a "$tag" -m "sveet $version"
git push --atomic --no-verify origin main "$tag" # verify just ran

if [ "$(bunx npm view "@nerdwerk/sv@$version" version 2> /dev/null)" = "$version" ]; then
	echo "@nerdwerk/sv@$version is already on npm"
else
	(cd packages/sv && bunx npm publish --access public)
fi
echo "✓ released $tag: template on GitHub, @nerdwerk/sv@$version on npm"
