# Changelog

All notable changes to sveet. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/). Projects record the release they started from in `package.json` → `sveet.version`, and the `sveet-upgrade` skill reads this file to bring changes over.

## [Unreleased]

## [1.0.1] - 2026-11-24

### Changed

- New sticker-style logo at `static/sveet-logo.png` (replaces `static/sveet_logo.png`).
- README: the sandbox is optional, Scaleway and Fly.io are swappable defaults, and a clearer "Is it for you?".

### Fixed

- `sveet-setup` pointed at the old logo filename.

## [1.0.0] - 2026-11-20

The agent-first release, shaped by building and running [onelink.ninja](https://onelink.ninja) on sveet.

### Breaking changes and manual steps from 0.x

- **SvelteKit 3.** `svelte.config.js` is gone (config lives in `vite.config.ts`). `$lib` → `#lib/….ts` (`imports` in package.json). `$env/*` → `src/env.ts` + `$app/env/private`. `$app/environment` → `$app/env`. `tsconfig.json` extends `$app/tsconfig`. TypeScript 6 for tooling, with TS 7 (`@typescript/native`) behind `svelte-check --tsgo`.
- **`adapter-node` → `adapter-bun`**, compiled into one executable at `build/server` (`bun run start`). The Docker runtime is `debian:trixie-slim` + that binary + `drizzle/`, with no bun and no `node_modules`.
- **Migrations run on server start** (`init` in `hooks.server.ts`); `docker-entrypoint.sh` and the bundled `migrate.js` are gone.
- **Auth is passwordless.** Email + password is off. Magic links are on, sent through the new mail seam. Production refuses to start without mail credentials unless `MAIL_TRANSPORT=console`.
- **shadcn-svelte → ui-sdk.** `components.json`, `src/lib/components/ui/`, `tailwind-variants` and `tw-animate-css` are removed. The theme lives in `--ui-*` tokens in `layout.css`, mapped to Tailwind via `@theme inline`.
- **Migrations restarted** at a single `0000` baseline. 0.x projects keep their own `drizzle/` and only apply schema differences.
- The Fly volume is named `data` (was `sveet_data`).

### Added

- `src/lib/server/mail.ts`: one `Mailer` seam with a console mailer (dev/tests), a Scaleway TEM mailer (EU), `mailerFromEnv` and test fakes.
- Deterministic seed (`db:seed`, `db:reset` = wipe + migrate + seed); `createTestDb()` for in-memory, migrated SQLite in Vitest.
- Playwright against the **production build**, with a fresh seeded database and server per test (`tests/e2e/fixtures.ts`).
- `bun run verify` (lint + types + all tests), `bun run deploy` (verify, then `fly deploy`), a pre-push hook (`bun run hooks:install`) and CI running the same gate.
- `bun run deps:update`: in-range updates, committed only when `verify` passes.
- `bun run auth:schema` restores the timestamp defaults the Better Auth CLI drops.
- **The sandbox is the default way to work.** `bun run sandbox` boots a microsandbox VM (`Sandboxfile`, `scripts/sandbox.sh` + `scripts/sandbox-vm.sh`) that runs the dev server and **opencode** (`opencode serve` + web UI on :4096, password-protected) under a small supervisor that restarts crashed services. Other commands: `restart`, `logs`, `agent [opencode|claude|codex]` (no permission prompts), `acp [opencode|claude]` for editors, `zed` (prints the Zed `agent_servers` config), `shell`, `stop`, `rm`. The repo is mounted at the same path as on the host; `node_modules` and `/scratch` (build, SQLite, logs, logins) are VM-owned disks.
- **sv support**: `@nerdwerk/sv`, a community add-on for the Svelte CLI (`npx sv create my-app --template minimal --types ts --add @nerdwerk --install bun`). It packs this repo’s files at build time, so `sv create` and `bun create` produce the same project. Its release gate (`packages/sv/test.sh`) runs `sveet`’s full `verify` in a freshly created project.
- `Brewfile` for host prerequisites (bun, microsandbox, flyctl).
- `bun run deploy` refuses to run inside the sandbox: production stays a human decision on the host.
- `bun run db:reset` empties the database in place, so a running dev server picks up fresh data without a restart.
- **ponytail** (vendored skill + opencode plugin): agents write the least code that works. AGENTS.md maps its ladder onto sveet and sets the test bar: an e2e test per user-facing feature, unit tests only for non-trivial logic.
- `opencode.jsonc` with the Svelte MCP and the ponytail plugin; opencode reads `AGENTS.md` and `.agents/skills` itself.
- **Skills**: `sveet-setup`, `sveet-feature`, `sveet-deploy`, `sveet-mail`, `sveet-admin`, `sveet-upgrade`, plus `ui-sdk` (synced from the package) and the official `svelte-core-bestpractices` and `svelte-code-writer`.
- `bun create nerdwerk/sveet my-app` runs `bun run setup` automatically.
- Fly defaults from production: `ADDRESS_HEADER=Fly-Client-IP` and Better Auth's `fly-client-ip` (per-visitor rate limits), raised concurrency limits, a pinned bun image (1.4.4, CVE-2026-111497).

### Removed

- devbox, Renovate (replaced by `deps:update`), shadcn-svelte and its skill, the demo routes, `@types/node`, `clsx`, `tailwind-merge`, `@lucide/svelte`, `cn()`, `.cursor/`, `.npmrc` and `.editorconfig`.
- Sign-in mail is plain text (the `sveet-mail` skill adds HTML on request). The template ships no example data model: the account page only shows the email and signs out.

## [0.1.0] - 2026-06-14

### Added

- Initial sveet: SvelteKit 2 + Svelte 5, Drizzle + libSQL, Better Auth (email + password), shadcn-svelte + Tailwind 4, bun + devbox, Docker → Fly.io, Svelte MCP, and `AGENTS.md`.

[Unreleased]: https://github.com/nerdwerk/sveet/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/nerdwerk/sveet/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/nerdwerk/sveet/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/nerdwerk/sveet/releases/tag/v0.1.0
