# AGENTS.md

The operating guide for AI agents (and humans) working in this repo. Read it before changing anything.

## What this is

**sveet**: an opinionated, agent-first SvelteKit starter. One stack, one way to do each thing, and skills that walk an agent through the common flows.

<!-- sveet-setup replaces this paragraph with a description of the product. -->

| Layer   | Choice                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------- |
| App     | SvelteKit 3 + Svelte 5 (runes), `@sveltejs/adapter-bun` compiled into a single executable                 |
| Runtime | bun ≥ 1.4.4, for everything: install, dev, build, tests, scripts                                          |
| Data    | SQLite through `bun:sqlite` + Drizzle ORM; migrations committed in `drizzle/`                             |
| Auth    | Better Auth, passwordless magic links                                                                     |
| Mail    | One seam (`src/lib/server/mail.ts`): console in dev, Scaleway TEM when built                              |
| UI      | `@ui-sdk/svelte` components (headless behaviors + `web.css`) themed by tokens, plus Tailwind 4 for layout |
| Tests   | Vitest against in-memory SQLite; Playwright against the built server with a seeded DB per test            |
| Deploy  | Docker → Fly.io, SQLite on a volume, migrations applied on start                                          |
| Sandbox | microsandbox microVM (`bun run sandbox`) for Linux dev/tests and permission-free agent runs               |

## Skills (use them)

Project skills live in `.agents/skills/` (symlinked into `.claude/skills/`). Load the matching one before starting the task:

| Skill                       | When                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `sveet-setup`               | Fresh checkout / `package.json` still named `sveet`: interview the user, personalize                |
| `sveet-feature`             | Building or changing any feature: spec → schema → seed → logic+tests → UI → e2e                     |
| `sveet-deploy`              | Fly launch, deploys, secrets, domains, scaling, production data                                     |
| `sveet-mail`                | Another mail provider, a new kind of mail, mail not arriving                                        |
| `sveet-admin`               | Health checks, superusers, an /admin area                                                           |
| `sveet-upgrade`             | Pull improvements from a newer sveet release                                                        |
| `ui-sdk`                    | Any UI work. Symlinked from `node_modules/@ui-sdk/core`, so it always matches the installed version |
| `svelte-core-bestpractices` | Writing or reviewing any `.svelte` / `.svelte.ts`                                                   |
| `svelte-code-writer`        | Svelte docs lookup and the autofixer from the CLI, when the MCP isn't available                     |

## Golden rules

1. **Bun only.** Scripts run `bun --bun vite …` because `bun:sqlite` only exists inside bun. Never use `npm`/`node`/`npx`. Use `bun`/`bunx`.
2. **`bun run verify` before you hand off.** It runs lint, types and every test (unit + e2e on the built server). It's also the pre-push hook and the first half of `bun run deploy`. If it fails, say so with the output; don't claim done.
3. **Schema changes:** edit `src/lib/server/db/schema.ts` → `bun run db:generate` → `bun run db:reset`. Never hand-edit `drizzle/`. Once something is deployed, migrations are append-only and must be backwards-compatible.
4. **Auth config changes:** edit `src/lib/server/auth-config.ts` → `bun run auth:schema` (regenerates `auth.schema.ts` and restores the timestamp defaults the CLI drops) → `db:generate`. Don't add `@better-auth/cli` as a dependency: it hoists an older `@better-auth/core` that breaks the build. The script fetches it with `bunx`.
5. **Never test against hand-made data.** `bun run db:reset` rebuilds `local.db` from migrations + `seed.ts` (fixed ids, so URLs stay stable). Tests import the same fixtures. When you add a table, extend the seed.
6. **Env vars are declared in `src/env.ts`** and imported from `$app/env/private` / `$app/env/public`. A new variable means: an entry with `description`, a line in `.env.example`, and either `fly.toml` (non-secret) or `fly secrets set` (secret). Secrets never go in git or the image.
7. **Mail only leaves through `src/lib/server/mail.ts`.** Tests swap it with `setMailer(createFakeMailer().mailer)`.
8. **UI comes from `@ui-sdk/svelte`.** Import from entries (`@ui-sdk/svelte/dialog`). Never hand-roll `role="dialog|menu|listbox|tablist|switch|…"`. Change the look via the `--ui-*` tokens in `src/routes/layout.css`, not per component. Check contrast (4.5:1 text, 3:1 controls).
9. **Svelte code goes through the Svelte MCP** (`.mcp.json`): `list-sections` → `get-documentation` for anything non-trivial, and `svelte-autofixer` on every component until it's clean. Runes only. No `$app/stores`, no `$env/*`, no `$lib` (it's `#lib/….ts` in SvelteKit 3).
10. **Internal links use `resolve('/route')`** from `$app/paths`. One exception: URLs that leave the app (e.g. the magic-link `callbackURL`) must be absolute paths, because on the server `resolve()` returns a path relative to the current request.
11. **Happy path first.** Use a library for complex, edge-case-heavy problems; hand-roll small things. Put the fancy version under "Not in scope" in the spec.

## Commands

| Command                        | Does                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `bun run setup`                | First run: `.env` with a fresh secret, then `db:reset`             |
| `bun run dev`                  | Dev server on :5173 (sign-in links print to this console)          |
| `bun run build` / `start`      | Compile `build/server` (one executable) / run it                   |
| `bun run verify`               | Lint + types + unit + e2e: the gate for push, deploy and hand-off  |
| `bun run test:unit --run [f]`  | Vitest only (fast; in-memory SQLite)                               |
| `bun run test:e2e [filter]`    | Build, then Playwright (fresh seeded DB + server per test)         |
| `bun run test:setup`           | Install Chromium once (again after Playwright upgrades)            |
| `bun run db:generate`          | SQL migration from `schema.ts`                                     |
| `bun run db:migrate`           | Apply migrations to `DATABASE_PATH`                                |
| `bun run db:seed` / `db:reset` | Apply the seed / wipe + migrate + seed                             |
| `bun run db:studio`            | Drizzle Studio                                                     |
| `bun run auth:schema`          | Regenerate the Better Auth tables                                  |
| `bun run deploy`               | `verify`, then `fly deploy`                                        |
| `bun run deps:update`          | In-range updates; commits only if `verify` passes                  |
| `bun run sandbox [cmd]`        | microVM: `shell` (default), `dev`, `verify`, `agent`, `stop`, `rm` |
| `bun run hooks:install`        | Enable the pre-push `verify` hook for this clone                   |
| `bun run lint` / `format`      | Prettier + ESLint / Prettier write                                 |

## Where things live

- `src/env.ts`: every environment variable, validated at start (stand-ins while building)
- `src/hooks.server.ts`: `init` picks the mailer and (when built) applies migrations; `handle` loads the session
- `src/lib/app.ts`: app name and tagline (layout, titles, mail)
- `src/lib/server/auth-config.ts`: the shared Better Auth options; `auth.ts`: the app instance; `auth-schema.config.ts`: the CLI entry
- `src/lib/server/mail.ts`: `Mailer`, `render…` functions, providers, `mailerFromEnv`, test fakes
- `src/lib/server/db/`: `schema.ts` (yours), `auth.schema.ts` (generated), `client.ts` (`openDatabase`, `applyMigrations`; no SvelteKit imports, so CLIs can use it), `index.ts` (the app's `db`), `seed.ts` + `seed-cli.ts`, `test-db.ts` (`createTestDb`), `migrate.ts`
- `src/routes/`: `+layout.svelte`, `layout.css` (**all theme tokens**), `login/` (magic link), `account/` (protected page + the example notes)
- `tests/e2e/`: `fixtures.ts` (`app` fixture: own DB + built server per test; `signIn` helper), `*.e2e.ts`
- `scripts/`: `setup.ts`, `test-e2e.ts`, `auth-schema.ts`, `sandbox.sh`, `update-deps.sh`
- `drizzle/`: committed migrations, the source of truth for the database
- `specs/`: feature specs written by the `sveet-feature` flow (create it on first use)
- `.agents/skills/`: project skills; `skills-lock.json` pins the vendored Svelte skills (`bunx skills update`)

## Theming

`src/routes/layout.css` declares `@layer ui-sdk`, imports Tailwind and ui-sdk's `web.css`, and sets the `--ui-*` tokens (`light-dark()` for both schemes). `@theme inline` exposes the same tokens to Tailwind as `background`, `foreground`, `muted`, `primary`, `border`, `input`, `ring` and `destructive`. Restyle by editing tokens. ui-sdk parts expose `data-slot` / state attributes (`data-open`, `data-pressed`, `data-variant="solid"` on buttons) for targeted styling. See `node_modules/@ui-sdk/core/skills/ui-sdk/references/styles.md`.

## Testing

- **Unit (Vitest, `pool: 'threads'`, because bun lacks Node's fork IPC):** `*.test.ts` next to the code. `createTestDb()` for a migrated `:memory:` DB, seed fixtures for data, fakes for mail. `expect.requireAssertions` is on.
- **E2E (Playwright):** runs against the production build, never `vite dev`. Each test gets a temp DB (migrated + seeded) and its own server port, so tests run in parallel and never touch `local.db`. Read mails through `app.magicLink(email)`, which parses the console mailer's output.

## Deploy

`bun run deploy` → `verify` → `fly deploy`. The Dockerfile compiles `build/server` in `oven/bun`, then ships it with `drizzle/` on `debian:trixie-slim`: no bun and no `node_modules` at runtime, and bun's bundled CA roots cover outbound HTTPS. On start, the server applies pending migrations to `/data/sqlite.db` (Fly volume). One machine. Scale up, not out. Details and first launch: the `sveet-deploy` skill.

## Sandbox (microsandbox)

`bun run sandbox` boots the `Sandboxfile` microVM (Apple Silicon or Linux/KVM; `brew install superradcompany/tap/microsandbox`). The repo is bind-mounted at `/app`. `node_modules` and `/scratch` (build output and SQLite) are VM-owned ext4 disks, because host-mounted files can't be executed or reliably memory-mapped in the VM. That's why `BUILD_DIR` and `DATABASE_PATH` point at `/scratch` there. `bun run sandbox agent` runs Claude Code with `--dangerously-skip-permissions` inside the VM. An `ANTHROPIC_API_KEY` on the host is passed as a microsandbox secret, so the VM only ever sees a placeholder. The dev server is published on `localhost:5173`.
