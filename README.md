<p align="center">
  <img src="static/sveet_logo.png" alt="Sveet logo" width="400">
</p>

# SVEET

An opinionated, agent-first SvelteKit starter, delicious like sweets. 🍭

One stack and one way to do each thing, with skills that teach your coding agent the flows: set the project up, build a feature, deploy it. Describe what you want, let the agent build it, and ship it in minutes. Sveet started as the base of [onelink.ninja](https://onelink.ninja), and what that project learned in production flows back here.

## Stack

- **SvelteKit 3 + Svelte 5**, compiled by `adapter-bun` into a single executable
- **bun** for everything: install, dev, build, tests, scripts
- **SQLite** via `bun:sqlite` + **Drizzle**: no database server, committed migrations
- **Better Auth** with passwordless **magic links**, behind one mail seam (Scaleway TEM built in)
- **[ui-sdk](https://ui-sdk.dev)** components themed by tokens, plus **Tailwind 4**
- **Vitest** (in-memory SQLite) and **Playwright** (the real build, a fresh database per test)
- **Docker → Fly.io**, SQLite on a volume, migrations on start
- **[microsandbox](https://microsandbox.dev)** microVM for Linux dev/tests and permission-free agent runs
- **Agent tooling**: `AGENTS.md`, the Svelte MCP, and project skills

## Start a project

```bash
bun create nerdwerk/sveet my-app   # copies the template, installs, runs `bun run setup`
cd my-app
bun run dev
```

Then open the project in your coding agent and say **"set this project up"**. The `sveet-setup` skill asks for the name, what the app does, where it runs (Fly region, domain), how mail goes out, and who may sign up. It then rewrites the project to match and runs the test suite.

<details>
<summary>Other ways to get the template</summary>

```bash
bunx giget@latest gh:nerdwerk/sveet my-app && cd my-app && bun install && bun run setup
# or: git clone https://github.com/nerdwerk/sveet my-app (keeps history; handy for upgrades)
```

Sign in at `/login` with `ada@example.com` (seeded); the magic link prints in the `bun run dev` console.

</details>

**Needs:** [bun](https://bun.com) ≥ 1.4.4. For deploys, [flyctl](https://fly.io/docs/flyctl/install/). For the sandbox, [microsandbox](https://microsandbox.dev) on Apple Silicon or Linux with KVM.

## Daily loop

| Command                 | Does                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `bun run dev`           | Dev server; sign-in links print to the console              |
| `bun run verify`        | Lint + types + unit + e2e on the production build           |
| `bun run db:generate`   | Migration from `src/lib/server/db/schema.ts`                |
| `bun run db:reset`      | Fresh local DB from migrations + seed                       |
| `bun run deploy`        | `verify`, then `fly deploy`                                 |
| `bun run sandbox [cmd]` | The project in a microVM: `shell`, `dev`, `verify`, `agent` |
| `bun run deps:update`   | Dependency updates, committed only if `verify` passes       |

The full list, the golden rules and the map of the code are in [AGENTS.md](AGENTS.md). It's written for agents and works just as well for humans.

## Skills

Project skills live in `.agents/skills/` (and `.claude/skills/`). Agents load them on their own, or you can ask for one by name:

- **`sveet-setup`**: interview, then personalize a fresh checkout
- **`sveet-feature`**: spec → schema → seed → logic + tests → UI → e2e → verify
- **`sveet-deploy`**: first Fly launch, secrets, mail DNS, domains, scaling, production data
- **`sveet-mail`**: another mail provider, or a new kind of mail
- **`sveet-admin`**: health checks, superusers, an /admin area
- **`sveet-upgrade`**: bring a newer sveet release into your project
- plus `ui-sdk` (from the package itself) and the official Svelte skills

## Deploy

```bash
fly apps create <app>
fly volumes create data --size 1 --region <region>
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)" SCW_SECRET_KEY=… SCW_DEFAULT_PROJECT_ID=…
bun run deploy
```

The image is one compiled executable plus `drizzle/` on debian-slim, with no bun and no `node_modules` at runtime. It's plain Docker, so it runs anywhere a container does. `sveet-deploy` covers mail DNS, custom domains, scaling and backups.

## Sandbox

```bash
brew install superradcompany/tap/microsandbox
bun run sandbox          # first run creates the VM and sets it up, then opens a shell
bun run sandbox agent    # Claude Code with --dangerously-skip-permissions, inside the VM
```

Your repo is mounted live. `node_modules`, build output and the SQLite file stay on VM-owned disks, so the host's install is untouched. An `ANTHROPIC_API_KEY` on the host goes in as a microsandbox secret, so the VM only ever sees a placeholder.

## Updating

A sveet project is a copy, not a dependency, so updates are a merge. `package.json` records the release you started from (`sveet.version`). Ask your agent to **"upgrade sveet"**: the `sveet-upgrade` skill diffs that release against the newest one and applies the parts that fit your project, such as tooling, fixes and skills.

## The Svelte CLI

`sv create` has no remote templates; it extends projects through [community add-ons](https://svelte.dev/docs/cli/community). See [docs/sv.md](docs/sv.md) for the plan to ship sveet as `bunx sv create --add @nerdwerk/sveet`.

## Variants

The [`pocketbase`](https://github.com/nerdwerk/sveet/tree/pocketbase) branch swaps the data and auth layer for PocketBase on PocketHost. It follows its own release pace.

## License

MIT © Roman Kuba
