# Releasing sveet

Maintainers only. This folder and `packages/` are removed from projects created with `bun create`, and the sv add-on never includes them.

A release has two artifacts that must match:

- **the template**: this repo at tag `vX.Y.Z` (used by `bun create nerdwerk/sveet` and `sveet-upgrade`)
- **the sv add-on**: `@nerdwerk/sv@X.Y.Z` on npm (used by `sv create --add @nerdwerk`). At build time it packs this repo's tracked files, so it holds no second copy of the template.

## Steps

1. In a commit or PR: add a `## [X.Y.Z]` section to `CHANGELOG.md` and set the version in **both** `package.json` → `sveet.version` and `packages/sv/package.json` → `version`. Merge it to `main`.
2. On `main` in your usual checkout, run:
   ```sh
   packages/sv/release.sh   # needs `bunx npm login` as a member of the nerdwerk org
   ```
   It checks the versions, changelog, branch and npm login first, runs `verify` and the add-on test (`sv create --add` with the local add-on, then `verify` in the new project), then tags `vX.Y.Z`, pushes `main` and the tag, and publishes `@nerdwerk/sv`. If something fails halfway, fix it and run it again: it skips what's already done.
3. Smoke-test the published package with both commands from the README, in an empty folder.

## Known issue: first run under bunx

`sv` installs community add-ons into its own `node_modules`, then imports them by name. If that folder didn't exist when the process started, bun's module resolver doesn't see it, and a fresh `bunx sv … --add @nerdwerk` fails with "Cannot find package '@nerdwerk/sv'". Node (`npx`) is fine, and so is a second bunx run. The README's bun command preinstalls the add-on next to sv (`bunx -p sv -p @nerdwerk/sv sv …`) to sidestep it. This is worth reporting upstream: a fix in sv would be to import the add-on by file URL instead of by package name.
