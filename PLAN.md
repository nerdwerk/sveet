# sveet — kickstart template plan

A reusable SvelteKit starter you can spin up with one command, maintain as a single source of truth, and open-source. This doc is the design + the flow. **Status: built and verified** — the working scaffold lives alongside this file.

**Decisions locked:**
- **Name:** `sveet` · **License:** MIT
- **Distribution:** GitHub template repo first, fetched with **`giget`**. CLI later, only if friction warrants it.
- **Database:** **Drizzle ORM + SQLite via libSQL** (`@libsql/client`), with **Better Auth** for auth. (Switched from `bun:sqlite` during build — libSQL is a local file too, its tooling runs under node without a bun/node split, ships prebuilt binaries, and doubles as the Turso client for a one-line hosted upgrade.) PocketBase kept as a documented alternative, not the default.
- **Runtime/env:** **bun** + **devbox**.
- **UI:** **shadcn-svelte** + **Tailwind 4**.
- **AI tooling:** **Svelte MCP** (hosted remote) + **shadcn-svelte skill** (committed in-repo) + an **`AGENTS.md`**.
- **Deployment:** **`adapter-node` + Dockerfile**, opinionated for **Fly.io**. SQLite persisted on a **Fly Volume**; migrations run at container startup.

---

## 1. Distribution & invocation

Host the canonical repo on **GitHub**, mark it a **template repository** (Settings → "Template repository"), and fetch new projects with **giget**:

```
npx giget@latest gh:your-name/sveet my-app
```

giget does a fast tarball clone without git history, so `my-app` starts clean. It supports GitHub/GitLab/Bitbucket/Sourcehut out of the box and has a custom-provider API if you ever move the canonical home (e.g. to tangled, which has no built-in provider — there you'd fall back to `git clone --depth=1 … && rm -rf .git`, or write a giget custom provider if it exposes a tarball endpoint).

**Graduation path (only when copy-paste tweaks start hurting):**
- **Tier 2 — custom `sv` add-on** published under the npm `sv-add` keyword, so the sveet layer composes with `npx sv create`'s built-in Tailwind/Drizzle/Playwright steps. Most idiomatic "npx sv create but mine."
- **Tier 3 — `create-sveet` CLI** (`npm create sveet@latest`) with interactive prompts. Most polished, most maintenance, and fully hoster-independent.

> Don't build the CLI before you've felt the pain it solves. The template repo covers ~90% of solo use.

---

## 2. The stack, locked

| Layer | Choice | Notes |
|---|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) | Base scaffolded via `sv create` |
| Runtime / PM | **bun** | Runs the app + scripts; production server runs under bun in Docker |
| Env | **devbox** (Jetify) | Pins bun + node for reproducibility |
| Database | **SQLite** via **Drizzle ORM** | Driver: **`@libsql/client`** (file locally; same client = Turso later). Typed schema in-repo; just a file, no second process |
| Auth | **Better Auth** | Typed client, sessions, password hashing; generates its schema into Drizzle (Lucia is deprecated) |
| UI | **shadcn-svelte** | Svelte 5 / runes-native, copy-in components |
| Styling | **Tailwind 4** | CSS-first config (`@import "tailwindcss"`, `@custom-variant dark`, `tw-animate-css`) |
| AI tooling | **Svelte MCP** + **shadcn-svelte skill** + **AGENTS.md** | Committed so every clone gets agent context for free |
| Quality | ESLint, Prettier, svelte-check, Vitest, Playwright | Mostly from `sv create`'s add-on pass |
| CI | GitHub Actions | Clean-clone build + lint + typecheck |
| Deploy | **`adapter-node` + Docker → Fly.io** | SQLite on a Fly Volume; migrations on startup; see §6 |

**Why this beats PocketBase for AI-assisted dev:** the data model is TypeScript *in the repo*, queries are typed, and the type-checker catches an agent's mistakes immediately — the tightest feedback loop you can give an AI. The cost is that auth/admin aren't free; Better Auth covers auth, and you build only the admin you actually need. (PocketBase's strength — less code to write at all — is real but orthogonal; kept as an alt branch for batteries-included projects.)

**Turso is deliberately out of v1.** It's hosted/edge libSQL (SQLite-compatible). Start with a local file; Drizzle makes swapping to Turso nearly free later if you ever need it.

---

## 3. Repo structure

```
sveet/
├── AGENTS.md                 # stack + conventions; first thing an agent reads
├── CLAUDE.md                 # thin pointer to AGENTS.md
├── .claude/skills/
│   └── shadcn-svelte/        # committed shadcn-svelte agent skill
├── .mcp.json                 # Svelte MCP (hosted remote)
├── devbox.json / devbox.lock # bun + node pinned
├── .editorconfig
├── .env.example              # DATABASE_URL, BETTER_AUTH_SECRET, …
├── .github/workflows/ci.yml  # install + build + lint + typecheck on clean clone
├── renovate.json             # (or dependabot.yml)
├── Dockerfile                # multi-stage bun build → bun runtime
├── .dockerignore
├── docker-entrypoint.sh      # apply migrations, then start server
├── fly.toml                  # Fly app + volume mount + http service
├── package.json              # bun scripts: dev, db:generate, db:migrate, db:studio, build
├── drizzle.config.ts
├── svelte.config.js / vite.config.ts
├── src/
│   ├── app.css               # Tailwind 4 entry + theme tokens
│   ├── hooks.server.ts       # Better Auth session handling
│   ├── lib/
│   │   ├── server/db/
│   │   │   ├── index.ts       # drizzle(@libsql/client) client
│   │   │   ├── migrate.ts     # runtime migrator (drizzle-orm/libsql) — no drizzle-kit in prod
│   │   │   └── schema.ts      # tables — the typed source of truth
│   │   ├── auth.ts            # Better Auth config
│   │   ├── components/ui/     # shadcn-svelte components land here
│   │   └── utils.ts           # cn(), etc.
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte       # demo: typed query against an example table
│       └── (auth)/            # sign-in / sign-up wired to Better Auth
├── drizzle/                  # generated SQL migrations (committed)
├── local.db                  # gitignored SQLite file
├── components.json           # shadcn-svelte registry config
├── .gitignore
├── LICENSE                   # MIT
└── README.md                 # quickstart + "how to use this template"
```

---

## 4. How each piece wires together

**SvelteKit base.** Generate with `npx sv create` (TypeScript + Tailwind + Drizzle + ESLint/Prettier + Vitest/Playwright add-ons), then layer Better Auth, shadcn-svelte, the AI tooling, and devbox on top. Starting from `sv create` keeps us close to the canonical project shape — easier to maintain across Svelte releases.

**Drizzle + SQLite.** `schema.ts` defines tables in TypeScript — the typed source of truth. The client is `drizzle(createClient({ url: DATABASE_URL }))` via `@libsql/client` (`DATABASE_URL=file:local.db`). `bun db:generate` (drizzle-kit) produces SQL migrations into `drizzle/`, committed to git; `bun db:migrate` runs the runtime migrator. No second process — the DB is a file. `bun db:studio` gives a browser GUI when you want one.

**Better Auth.** Configured in `lib/auth.ts` against the Drizzle/SQLite instance; it generates its own tables into the schema. `hooks.server.ts` loads the session per request. The `(auth)` routes ship sign-in/sign-up so the starter has a working login out of the box.

**bun + devbox.** `devbox shell` gives the pinned bun/node toolchain regardless of the host. One dev process: `bun dev`. (No dual-process script needed — that was a PocketBase artifact.)

**shadcn-svelte + Tailwind 4.** `app.css` does `@import "tailwindcss"`, declares dark mode with `@custom-variant`, and holds theme tokens; animations via `tw-animate-css`. A few base components (button, card, input) ship pre-installed; `npx shadcn-svelte add <component>` pulls more.

**AI tooling (the differentiator).**
- `.mcp.json` points at the Svelte MCP's hosted endpoint — no local process:
  ```json
  { "mcpServers": { "svelte": { "type": "http", "url": "https://mcp.svelte.dev/mcp" } } }
  ```
- The **shadcn-svelte skill** is committed under `.claude/skills/` so any agent in the repo gets component guidance instantly.
- **`AGENTS.md`** states the stack, conventions, and the "always run `bun db:generate` after schema edits" type rules. `CLAUDE.md` just points to it.
- Editor-neutral: we also drop `.cursor/mcp.json` / `.vscode/mcp.json` equivalents.

---

## 5. Day-to-day flow

```
npx giget@latest gh:your-name/sveet my-app   # scaffold
cd my-app && devbox shell                     # pinned env
bun install
bun db:migrate                                # apply schema to local.db
bun dev                                        # one process
```

---

## 6. Deployment (Fly.io)

Opinionated for Fly, but it's plain Docker underneath, so it runs anywhere a container does.

**The image.** Multi-stage Dockerfile: a builder stage (`oven/bun`) runs `bun install` + `bun run build`; the runtime stage (`oven/bun:slim`) copies the `build/` output + `node_modules` + migrations and starts the server with `bun ./build/index.js`. libSQL ships **prebuilt binaries** (no `node-gyp` compilation), but it's a native module, so two things matter: it's listed in `dependencies` (not `devDependencies`) and marked external in `vite.config.ts` (`ssr.external`) so `adapter-node` keeps it out of the bundle and loads it from `node_modules` at runtime. (This was the one real gotcha during the build — bundling the native binary broke boot under both bun *and* node until externalized.)

**Hosting the database — the part you wanted to learn.** SQLite is a file, so "hosting the DB" just means *putting that file on storage that survives a redeploy.* The deployment image is thrown away on every deploy, so the DB cannot live inside it. The opinionated answer:

- Create a **Fly Volume** and mount it at `/data`. Set `DATABASE_URL=/data/sqlite.db`. The volume persists across deploys and restarts.
- **Run migrations at container startup**, not via Fly's `release_command`. This is a real gotcha: `release_command` runs in a temporary machine that does **not** reliably mount your volume, so migrations there would hit the wrong (or no) database. `docker-entrypoint.sh` runs `bun run db:migrate` against `/data` — which *is* mounted — then `exec`s the server.
- Migrations apply via **`drizzle-orm/libsql/migrator`** reading the committed SQL in `drizzle/`. That means **drizzle-kit is never needed in production** (it's a dev-only tool for *generating* migrations), sidestepping the "dev deps get pruned in the build" problem people hit.
- Set the auth secret as a Fly secret: `fly secrets set BETTER_AUTH_SECRET=…` (never bake it into the image).

**First deploy (documented in README):**
```
fly launch --no-deploy          # generates/aligns fly.toml & app
fly volumes create sveet_data --size 1 --region <r>
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
fly deploy
```

**`fly.toml` essentials:** `[build] dockerfile = "Dockerfile"`, `[http_service] internal_port = 3000`, `[[mounts]] source = "sveet_data", destination = "/data"`, `[env] DATABASE_URL = "/data/sqlite.db"`.

**Durability & scaling.** Fly takes daily volume snapshots automatically; add Litestream → object storage later if you want continuous backup. A single volume = single node (SQLite's natural shape). If you ever need multi-region read replicas, **LiteFS** is the upgrade path — explicitly out of v1 scope to keep this simple.

---

## 7. Open-source flow (setup, maintain, evolve)

**Set up.** Build sveet locally → push to GitHub → enable "Template repository" → add `LICENSE` (MIT), a real `README.md`, short `CONTRIBUTING.md`.

**One source of truth.** The repo *is* the framework; improvements from real projects flow back as commits. Pin `devbox.lock` + `bun.lockb`. Tag releases (`v0.1.0`…); giget can target a tag (`gh:your-name/sveet#v0.1.0`). Keep a `CHANGELOG.md`.

**Stay healthy.** CI build on clean clone catches rot; Renovate/Dependabot for bumps.

**Graduate when it hurts.** Same 3 edits after every clone → build the `sv-add` add-on (tier 2) or `create-sveet` (tier 3). Not before.

---

## 8. Built to extend

- **Example, not entanglement** — the demo table + page are isolated and easy to delete.
- **Optional layers as branches** (`with-pocketbase`, `with-i18n`) instead of bloating main.
- **AI-first by default** — MCP + skill + AGENTS.md mean every project starts with the agent already fluent in your stack. Compounding value.

---

## 9. Next steps

1. ~~**Scaffold**~~ — ✅ done. Full working tier-1 repo in this folder.
2. ~~**Verify**~~ — ✅ done. `lint`, `svelte-check`, `build` all pass; migrations apply (idempotent); server boots and serves HTTP 200 under both bun and node.
3. **Push to GitHub** — pending. Roman shares the repo, then: push, enable "Template repository" in Settings, tag `v0.1.0`. Before going public: rotate the dev secret (`.env` is gitignored and not committed), and set a real `app`/`ORIGIN` in `fly.toml`.
