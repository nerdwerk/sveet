# sveet and the Svelte CLI (`sv`)

**Status:** planned. Today, `bun create nerdwerk/sveet my-app` is the supported way to start.

## Why it isn't one command yet

`sv create` only knows its built-in templates (`minimal`, `demo`, `library`, `addon`). The one official extension point is a **community add-on**: an npm package that `sv create --add …` or `sv add …` runs against a freshly scaffolded project. Community add-ons are still marked _experimental_ in the sv docs, and their API may change.

The official add-ons don't cover sveet's stack either. `sv add drizzle` offers `better-sqlite3`, `libsql` and `turso`, but not `bun:sqlite`. `sv add better-auth` sets up email and password, not magic links. So a sveet add-on couldn't only compose official add-ons. It has to lay sveet's files over the minimal template.

## Target experience

```bash
bunx sv create my-app --template minimal --types ts --add @nerdwerk/sveet --install bun
```

or, in an existing SvelteKit 3 project, `bunx sv add @nerdwerk/sveet`.

## What's needed

1. **An npm scope you own**: e.g. `@nerdwerk` (free on npmjs.com for public packages). The add-on is published as `@nerdwerk/sv`, which `sv` also resolves from the short form `@nerdwerk`.
2. **A `packages/sv/` workspace in this repo**, scaffolded with `bunx sv create --template addon packages/sv`. It contains:
   - `defineAddon({ id: 'sveet', options, setup, run, nextSteps })`.
   - **Options** that mirror the `sveet-setup` interview where a prompt is enough: app display name, deploy target (Fly / Docker / none), Fly region, mail (Scaleway / console), and whether to keep the example notes. The judgment calls stay with the setup skill.
   - **`run`** writes the template files with `sv.file(…)`. It uses `@sveltejs/sv-utils` transforms (not overwrites) for `package.json` scripts and dependencies, plus `vite.config.ts`, so the add-on also works in a project that isn't pristine.
3. **One source of truth.** The add-on must not hold a second copy of the template. Its build step (`tsdown`, as the add-on template uses) embeds the repo's own files (`src/`, `scripts/`, `tests/`, `drizzle/`, `Dockerfile`, `fly.toml`, `Sandboxfile`, `.agents/skills/`, `AGENTS.md`…) into the bundle at publish time. The bundle carries everything, because add-on `dependencies` aren't installed at runtime.
4. **Tests** with `sv/testing` (`createSetupTest`): scaffold a minimal project, apply the add-on, then run `bun install && bun run verify` in it. This is the release gate for publishing.
5. **Release flow**: tag `vX.Y.Z` here, publish `@nerdwerk/sv@X.Y.Z` from CI, and keep `peerDependencies.sv` at the minimum sv version tested. Add the `sv-add` keyword so it appears in the sv add-on search on npmx.

## Open decisions

- The npm scope and package name (`@nerdwerk/sv` vs `@sveet/sv`).
- Whether `sv add @nerdwerk/sveet` into an existing project is in scope, or only `sv create … --add`. The first needs merge logic for routes, `hooks.server.ts` and the auth config.
- Whether to submit sveet for the sv docs' community list once community add-ons leave experimental.
