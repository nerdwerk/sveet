# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/).

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
