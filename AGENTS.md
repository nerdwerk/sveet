# AGENTS.md

How to work in this repo. Read it before changing anything.

## What this is

**sveet**: an opinionated, agent-first SvelteKit starter. One stack, one way to do each thing, as little code as possible.

<!-- sveet-setup replaces this paragraph with a description of the product. -->

| Layer   | Choice                                                                                   |
| ------- | ---------------------------------------------------------------------------------------- |
| App     | SvelteKit 3 + Svelte 5 runes, `adapter-bun` compiled into one executable                 |
| Runtime | bun ≥ 1.4.4 for everything                                                               |
| Data    | SQLite via `bun:sqlite` + Drizzle; migrations committed in `drizzle/`                    |
| Auth    | Better Auth, magic links only                                                            |
| Mail    | `src/lib/server/mail.ts`: console in dev, Scaleway TEM when built                        |
| UI      | `@ui-sdk/svelte` components themed by `--ui-*` tokens, Tailwind 4 for layout             |
| Tests   | Vitest on in-memory SQLite; Playwright on the built server, own seeded DB per test       |
| Deploy  | Docker → Fly.io, SQLite on a volume, migrations on start; **host only**                  |
| Dev env | microsandbox VM (`bun run sandbox`): dev server, tests and agents, no access to the host |

## How sveet writes code: ponytail

Every change follows **ponytail** (`.agents/skills/ponytail`). In opencode it's always on, through the plugin in `opencode.jsonc`. Claude Code and other agents: load the `ponytail` skill at the start of every coding task. Use level `full`.

Take the first rung that works:

1. **Does it need to exist?** Skip what nobody asked for, and name it in one line.
2. **Already here?** `mail.ts`, `openDatabase`, the seed fixtures, existing routes and patterns.
3. **The platform?** SvelteKit form actions, load functions and `$app/*`; plain HTML (`<input type="date">`, `<details>`, `<dialog>`). **ui-sdk components beat both native widgets and hand-rolled ones.**
4. **An installed dependency?** Drizzle, Better Auth, ui-sdk. Never add a dependency for a few lines. Do use a library for complex, edge-case-heavy problems.
5. **One readable line**, otherwise the minimum that works.

The rest of ponytail applies too. Comments explain only the why, in one line. Known limits get a `shortcut: <the limit>, <when to upgrade>` comment. Never cut validation, security, accessibility or error handling that prevents data loss.

**Tests: smart, not everywhere.** These are ponytail's rule plus sveet's e2e bar:

- **Every user-facing feature gets one e2e test of its happy path** (`tests/e2e/`), so the real flow can't break unnoticed.
- **Non-trivial logic gets one small unit test**: a branch that matters, parsing, money, security, permissions. Trivial code gets none.
- Don't write tests that re-test a library or the framework.

## Skills

In `.agents/skills/` (linked into `.claude/skills/`). Load the matching one before you start:

| Skill                                             | When                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `ponytail`                                        | Every coding task                                                          |
| `sveet-setup`                                     | Fresh checkout, `package.json` still named `sveet`: interview, personalize |
| `sveet-feature`                                   | Building or changing a feature                                             |
| `sveet-deploy`                                    | Fly launch, deploys, secrets, domains, production data                     |
| `sveet-mail`                                      | Another mail provider, a new mail, mail not arriving                       |
| `sveet-admin`                                     | Health checks, superusers, /admin                                          |
| `sveet-upgrade`                                   | Pull in a newer sveet release                                              |
| `ui-sdk`                                          | Any UI work (synced from `node_modules/@ui-sdk/core`)                      |
| `svelte-core-bestpractices`, `svelte-code-writer` | Any `.svelte` / `.svelte.ts` work                                          |

## Golden rules

1. **Bun only.** Scripts run `bun --bun vite …` because `bun:sqlite` only exists in bun. Never use npm, node or npx.
2. **Done means `bun run verify` passed** (lint, types, unit tests, e2e tests on the built server). Report the output, not an expectation.
3. **Schema:** edit `src/lib/server/db/schema.ts` → `bun run db:generate` → `bun run db:reset`. Never hand-edit `drizzle/`. After the first deploy, migrations are append-only and must be backwards-compatible.
4. **Auth config:** edit `src/lib/server/auth-config.ts` → `bun run auth:schema` → `db:generate`. Never add `@better-auth/cli` as a dependency.
5. **Data:** never test against hand-made data. The seed (`seed.ts`, fixed ids) is the fixture for dev and tests; extend it when you add a table.
6. **Env vars** live in `src/env.ts` and are imported from `$app/env/private` (or `/public`). Add each to `.env.example`, and to `fly.toml` or `fly secrets`. Secrets never go in git.
7. **Mail** only leaves through `mail.ts`; tests use `createFakeMailer()`.
8. **UI** comes from `@ui-sdk/svelte` entries (`@ui-sdk/svelte/dialog`). Never hand-roll `role="dialog|menu|listbox|…"`. Restyle via the tokens in `src/routes/layout.css`. Check contrast.
9. **Svelte:** use the Svelte MCP (`list-sections` → `get-documentation`; run `svelte-autofixer` until clean). Runes only. SvelteKit 3: `#lib/….ts` (not `$lib`), `$app/env` (not `$app/environment` or `$env/*`).
10. **Links** use `resolve('/route')`. A URL that leaves the app, like the magic-link `callbackURL`, uses a plain absolute path: on the server, `resolve()` returns a path relative to the request.
11. **Production is the user's call.** Never deploy, run `fly` against a real app, or touch production data yourself.

## Commands

| Command                       | Does                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `bun run sandbox [cmd]`       | Dev VM: `up` (default), `status`, `restart [dev\|opencode\|all]`, `logs`, `agent`, `shell`, `acp`, `zed`, `stop`, `rm` |
| `bun run dev`                 | Dev server (already running in the sandbox)                                                                            |
| `bun run verify`              | Lint + types + unit + e2e                                                                                              |
| `bun run test:unit --run [f]` | Vitest only                                                                                                            |
| `bun run test:e2e [filter]`   | Build, then Playwright                                                                                                 |
| `bun run db:generate`         | Migration from `schema.ts`                                                                                             |
| `bun run db:migrate`          | Apply migrations, keep the data                                                                                        |
| `bun run db:reset`            | Empty the DB in place, migrate, seed (no dev server restart needed)                                                    |
| `bun run auth:schema`         | Regenerate Better Auth's tables                                                                                        |
| `bun run build` / `start`     | Compile `build/server` / run it                                                                                        |
| `bun run deploy`              | Host only: `verify`, then `fly deploy`                                                                                 |
| `bun run deps:update`         | In-range updates, committed if `verify` passes                                                                         |
| `bun run setup`               | First run on the host: `.env` + seeded DB                                                                              |
| `bun run hooks:install`       | Run `verify` before every push                                                                                         |

## Where things live

- `src/env.ts`: every env var
- `src/hooks.server.ts`: `init` (mailer; migrations when built), `handle` (session)
- `src/lib/app.ts`: app name and tagline
- `src/lib/server/auth-config.ts`: Better Auth options shared by the app (`auth.ts`), the tests and the CLI (`auth-schema.config.ts`)
- `src/lib/server/mail.ts`: `Mailer`, `renderMagicLink`, the Scaleway mailer, `mailerFromEnv`, `createFakeMailer`
- `src/lib/server/db/`: `schema.ts` (yours), `auth.schema.ts` (generated), `client.ts` (`openDatabase`, `applyMigrations`; no SvelteKit imports), `index.ts` (the app's `db`), `seed.ts`, `test-db.ts` (`createTestDb`), and the CLIs `migrate.ts`, `reset-cli.ts`, `seed-cli.ts`
- `src/routes/`: `layout.css` (the theme), `login/`, `account/`
- `tests/e2e/`: `fixtures.ts` (the `app` fixture and `signIn`), `*.e2e.ts`
- `scripts/`: `sandbox.sh` (host + VM), `sandbox-vm.sh` (in the VM), `setup.ts`, `test-e2e.ts`, `auth-schema.ts`, `deploy.sh`, `update-deps.sh`
- `specs/`: feature specs from `sveet-feature` (created on first use)

## Sandbox

You're in it when `SVEET_SANDBOX=1`. Inside:

- **The dev server is already running** on :5173, and it's restarted automatically after a crash. Don't start another. Restart it with `bun run sandbox restart`; its log, including sign-in links, is `/scratch/logs/dev.log`.
- **`db:reset` needs no restart.**
- **No deploys and no `git push`.** There's no flyctl, Fly token or SSH key in the VM. Prepare the change, run `verify`, and give the user the commands to run on the host.
- The public internet is reachable. The host and the LAN are not.

How it's built: the repo is mounted at the same absolute path as on the host, so ACP paths match. `node_modules` and `/scratch` are VM-owned disks, because host mounts can't execute binaries. `/scratch` holds the build (`BUILD_DIR`), SQLite (`DATABASE_PATH`), logs, the Playwright browser and `HOME` (agent logins). `opencode serve` runs on :4096; its password is in `/scratch/opencode-password`.
