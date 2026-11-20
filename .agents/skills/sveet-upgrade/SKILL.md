---
name: sveet-upgrade
description: Brings improvements from a newer sveet release into a project that started from sveet, without losing the project's own changes. Reads `sveet.version` from package.json, diffs the two sveet releases, and applies the relevant changes with judgement. Use when the user says "update sveet", "upgrade the starter", "pull in sveet changes", or asks what changed in sveet.
---

# Upgrade from upstream sveet

A sveet project is a fork, not a dependency. Upgrading means replaying what changed between two sveet releases onto code that has moved on. Treat each change as a suggestion, not an order.

## 1. Find the two versions

1. `from` = `sveet.version` in `package.json`. If it's missing, ask the user, or estimate it from the first commit date against sveet's tags.
2. Fetch the releases:
   ```sh
   git remote get-url sveet 2>/dev/null || git remote add sveet https://github.com/nerdwerk/sveet.git
   git fetch sveet --tags
   git tag -l 'v*' --sort=-v:refname | head
   ```
3. `to` = the latest tag, unless the user names one. Read sveet's `CHANGELOG.md` between the two (`git show v<to>:CHANGELOG.md`) and summarize it for the user. Breaking changes and manual steps come first. Ask which parts they want.

## 2. Plan

```sh
git diff --stat v<from> v<to>
```

Sort the changed paths:

- **Tooling, usually take**: `scripts/`, `Dockerfile`, `Sandboxfile`, `vite.config.ts`, `eslint.config.js`, `.githooks/`, `.github/`, `src/lib/server/db/client.ts`, `src/lib/server/mail.ts`, `src/env.ts` (merge in their variables), `.agents/skills/sveet-*`, the `AGENTS.md` sections on tooling.
- **Starter content, usually skip**: `README.md`, `src/routes/**` and the example `note` code, `src/lib/app.ts`, `fly.toml` values (but do take new settings and comments), `static/`, `LICENSE`.
- **Dependencies**: compare the `package.json` dependencies. Bump what sveet bumped unless the project pinned it on purpose. Then run `bun install`.
- **Migrations**: never copy sveet's `drizzle/`. If sveet changed `auth.schema.ts` or the auth config, apply that change, then run `bun run auth:schema` and `bun run db:generate`, so the project gets its own migration.

## 3. Apply

1. Make sure the working tree is clean, then create a branch: `git switch -c sveet-v<to>`.
2. For each file you take:
   ```sh
   git diff v<from> v<to> -- <path> | git apply -3
   ```
   On a conflict, or when the project has rewritten the file, read both sides and write the merged result by hand. Keep the project's behavior, and add sveet's fix or improvement.
3. Set `sveet.version` in `package.json` to `<to>`.
4. Run `bun install && bun run format && bun run verify`. Fix whatever the upgrade broke.
5. Commit one change per logical piece, e.g. "Upgrade sveet tooling to v<to>". Merge or open a PR only when the user asks.

## 4. Report

List what you applied, what you skipped and why, and any manual steps left over, such as new `fly secrets`, fly.toml settings or a re-run of `bun run test:setup`.
