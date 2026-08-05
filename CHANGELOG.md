# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- **Database driver: libSQL → `bun:sqlite`.** Drizzle now talks to a plain SQLite
  file through bun's built-in driver (WAL mode, foreign keys on). `@libsql/client`
  and its native binary are gone, and so is the Turso escape hatch.
- **`DATABASE_URL` → `DATABASE_PATH`.** It's a filesystem path now, not a URL, so
  `file:local.db` becomes `local.db` and `file:/data/sqlite.db` becomes
  `/data/sqlite.db`. Update `.env`, `fly.toml`, and any Fly secrets.
- **`dev`, `build` and `preview` now run as `bun --bun vite …`.** `bun:sqlite` only
  resolves inside the bun runtime; these scripts no longer work under node.
- **`@better-auth/cli` is no longer a devDependency.** It hoisted an older
  `@better-auth/core` that bun resolved in preference to the correct nested copy,
  breaking dev and build. `bun run auth:schema` now fetches it with `bunx`.
- **The runtime Docker image no longer contains `node_modules`.** The migrator is
  bundled with `bun build --target=bun` alongside the Vite-bundled server.

## [0.1.0] - 2026-06-14

### Added

- **Initial kickstart of `sveet`** — an opinionated, reusable SvelteKit starter
  to spin up new projects with one command and maintain as a single source of
  truth, with the intent to open-source it.
- **SvelteKit 2 + Svelte 5** (runes), scaffolded via the `sv` CLI, built with
  `adapter-node`.
- **Database:** Drizzle ORM over **libSQL/SQLite** — a local file in development,
  one-line swap to a hosted [Turso](https://turso.tech) endpoint. Migrations are
  generated with drizzle-kit and applied by a runtime migrator (no drizzle-kit in
  production).
- **Auth:** Better Auth (email + password) with a working demo.
- **UI:** shadcn-svelte + Tailwind 4 (CSS-first theming), with a Button shipped
  and the rest one `add` command away.
- **Tooling for AI-assisted development:** the Svelte MCP (hosted) plus editor
  configs, the vendored official shadcn-svelte skill, and an `AGENTS.md`.
- **Environment:** bun runtime + devbox, with a `bun run setup` first-run helper.
- **Deployment:** Dockerfile + `fly.toml`, opinionated for Fly.io, with SQLite on
  a persistent volume and migrations applied at container startup.

[Repo]: https://github.com/nerdwerk/sveet
