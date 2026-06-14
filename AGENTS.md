# AGENTS.md

Operating guide for AI agents (and humans) working in this repo. Read this first.

## What this is

`sveet` — an opinionated SvelteKit starter. Stack:

- **SvelteKit 2 + Svelte 5 (runes)** — `adapter-node`
- **Drizzle ORM + libSQL/SQLite** — typed schema in `src/lib/server/db/schema.ts`
- **Better Auth** — email + password, configured in `src/lib/server/auth.ts`
- **shadcn-svelte + Tailwind 4** — components in `src/lib/components/ui`, theme tokens in `src/routes/layout.css`
- **bun** runtime + **devbox** environment
- **Fly.io** deploy via Docker

## Golden rules

1. **After editing `src/lib/server/db/schema.ts`**, run `bun run db:generate` to create a migration, then `bun run db:migrate` to apply it. Never hand-edit files in `drizzle/`.
2. **After changing the Better Auth config**, run `bun run auth:schema` to regenerate `src/lib/server/db/auth.schema.ts`, then `db:generate` + `db:migrate`.
3. **When writing Svelte code**, use the **Svelte MCP** (configured in `.mcp.json`): call `list-sections` → `get-documentation` for anything non-trivial, and run `svelte-autofixer` on generated components until clean.
4. **When adding or composing UI**, defer to the vendored **shadcn-svelte skill** (`.agents/skills/shadcn-svelte/`). Add components with `bunx shadcn-svelte@latest add <name>` — never hand-write what the registry provides.
5. **Secrets never go in the image or git.** Use `.env` locally and `fly secrets set` in production.

## Commands

| Command                   | Does                                                      |
| ------------------------- | --------------------------------------------------------- |
| `bun run setup`           | Create `.env` + generate auth secret (first run only)     |
| `bun run dev`             | Dev server                                                |
| `bun run build`           | Production build (adapter-node → `build/`)                |
| `bun run db:generate`     | Generate SQL migration from schema (drizzle-kit)          |
| `bun run db:migrate`      | Apply migrations at runtime (drizzle-orm, no drizzle-kit) |
| `bun run db:studio`       | Drizzle Studio GUI                                        |
| `bun run db:reset`        | Delete local db + re-migrate                              |
| `bun run auth:schema`     | Regenerate Better Auth Drizzle schema                     |
| `bun run check`           | svelte-check (types)                                      |
| `bun run lint` / `format` | ESLint + Prettier                                         |
| `bun run test`            | Unit (Vitest) + e2e (Playwright)                          |

## Where things live

- `src/lib/server/db/` — `schema.ts` (your tables), `auth.schema.ts` (generated), `index.ts` (client), `migrate.ts` (runtime migrator)
- `src/lib/server/auth.ts` — Better Auth config
- `src/hooks.server.ts` — session loading
- `src/lib/components/ui/` — shadcn-svelte components
- `src/routes/layout.css` — Tailwind 4 entry + **all theme tokens** (edit here to restyle)
- `drizzle/` — committed SQL migrations (source of truth for the DB)

## Theming

All design tokens are CSS variables in `src/routes/layout.css` (`:root` for light, `.dark` for dark). Change colors/radius there; every component follows. Base color is `neutral` (set in `components.json`, immutable after init).

## Deploy

Docker image runs migrations on startup (`docker-entrypoint.sh`) against the SQLite file on the Fly volume at `/data`, then starts the server. See `README.md` for the Fly flow.
