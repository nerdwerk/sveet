# Releasing sveet

Maintainers only. This folder and `packages/` are removed from projects created with `bun create`, and the sv add-on never includes them.

A release has two artifacts that must match:

- **the template**: this repo at tag `vX.Y.Z` (used by `bun create nerdwerk/sveet` and `sveet-upgrade`)
- **the sv add-on**: `@nerdwerk/sv@X.Y.Z` on npm (used by `sv create --add @nerdwerk`). At build time it packs this repo's tracked files, so it holds no second copy of the template.

## Steps

1. Update `CHANGELOG.md` and set the version in **both** `package.json` → `sveet.version` and `packages/sv/package.json` → `version`. The add-on build refuses to run if they differ.
2. Commit, then run the gates:
   ```sh
   bun run verify
   cd packages/sv && bun install && bun run test   # sv create --add <local add-on>, then verify in the new project
   ```
3. Tag and push: `git tag vX.Y.Z && git push origin main vX.Y.Z`.
4. Publish the add-on from a clean checkout of the tag (`prepublishOnly` rebuilds it):
   ```sh
   cd packages/sv && bunx npm publish --access public   # needs `bunx npm login` as a member of the nerdwerk org
   ```
5. Smoke-test the published package with both commands from the README, in an empty folder.

## Known issue: first run under bunx

`sv` installs community add-ons into its own `node_modules`, then imports them by name. If that folder didn't exist when the process started, bun's module resolver doesn't see it, and a fresh `bunx sv … --add @nerdwerk` fails with "Cannot find package '@nerdwerk/sv'". Node (`npx`) is fine, and so is a second bunx run. The README's bun command preinstalls the add-on next to sv (`bunx -p sv -p @nerdwerk/sv sv …`) to sidestep it. This is worth reporting upstream: a fix in sv would be to import the add-on by file URL instead of by package name.
