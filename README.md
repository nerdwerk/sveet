<p align="center">
  <img src="static/sveet_logo.png" alt="Sveet logo" width="400">
</p>

# SVEET

An opinionated, agent-first SvelteKit starter, delicious like sweets. 🍭

One stack and one way to do each thing, with skills that teach your coding agent the flows: set the project up, build a feature, deploy it. Everything runs in a sandbox, so the agent can work without permission prompts and still can't touch the rest of your machine. Sveet started as the base of [onelink.ninja](https://onelink.ninja), and what that project learned in production flows back here.

## Stack

- **SvelteKit 3 + Svelte 5**, compiled by `adapter-bun` into a single executable
- **bun** for everything: install, dev, build, tests, scripts
- **SQLite** via `bun:sqlite` + **Drizzle**: no database server, committed migrations
- **Better Auth** with passwordless **magic links**, behind one mail seam (Scaleway TEM built in)
- **[ui-sdk](https://ui-sdk.dev)** components themed by tokens, plus **Tailwind 4**
- **Vitest** (in-memory SQLite) and **Playwright** (the real build, a fresh database per test)
- **Docker → Fly.io**, SQLite on a volume, migrations on start
- **[microsandbox](https://microsandbox.dev)** dev VM with the dev server, tests and agents ([opencode](https://opencode.ai) by default)
- **Agent tooling**: `AGENTS.md`, the Svelte MCP, project skills, and [ponytail](https://ponytail.dev) so agents write the least code that works

## Start a project

**1. Install what sveet needs on your machine:** [bun](https://bun.com), [microsandbox](https://microsandbox.dev) (the dev VM) and, for deploys, [flyctl](https://fly.io/docs/flyctl/install/). Either download the [Brewfile](https://raw.githubusercontent.com/nerdwerk/sveet/main/Brewfile) and run `brew bundle` next to it, or run:

```bash
brew install bun superradcompany/tap/microsandbox flyctl
```

The sandbox runs on Apple Silicon Macs, or on Linux with KVM.

**2. Create the project and boot its sandbox:**

```bash
bun create nerdwerk/sveet my-app
cd my-app
bun run sandbox
```

The first boot takes a few minutes, because it installs the dependencies, the test browser and the agent inside the VM. After that, booting takes about a second. It prints:

```
  App       http://localhost:5173
  Agent     http://localhost:4096   user: opencode   password: …
```

**3. Open the agent at http://localhost:4096 and say "set this project up".** The `sveet-setup` skill asks for the name, what the app does, where it runs, how mail goes out and who may sign up. It then rewrites the project to match and runs the tests.

## Working in the sandbox

The sandbox is a small Linux VM that holds the dev server, the tests and the coding agent. The agent runs without permission prompts, but it can only reach your project folder and the public internet. The folder is mounted live, so your editor sees every change. The agent can't see the rest of your machine, your SSH keys or credentials, or your local network.

**Deploys deliberately stay outside.** `bun run deploy` refuses to run in the VM, so an agent can't ship to production by accident.

| Command                        | Does                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| `bun run sandbox`              | Boot the VM (creating it the first time) and print the URLs                 |
| `bun run sandbox restart`      | Restart the dev server (`opencode` or `all` for the others)                 |
| `bun run sandbox logs`         | Follow the dev server log, where sign-in links appear (`logs opencode` too) |
| `bun run sandbox agent [name]` | A terminal agent in the VM: `opencode` (default), `claude`, `codex`         |
| `bun run sandbox shell`        | A shell inside the VM                                                       |
| `bun run sandbox zed`          | Print the Zed settings for using the VM's agent over ACP                    |
| `bun run sandbox stop` / `rm`  | Stop the VM / delete it, with its disks and agent logins                    |

**The dev server is always running.** It starts with the sandbox, and a crash brings it back within a second. `bun run db:reset` empties the database in place, so the server picks up the fresh data without a restart. For anything else, run `bun run sandbox restart`. The command is the same on your machine and inside the VM, so the agent can run it too.

### Agents

- **opencode** is the default. It runs as a server in the VM with its web UI at http://localhost:4096, and `bun run sandbox agent` attaches a terminal to the same sessions. It works with almost any model provider: run `/connect` once and the login stays in the VM. It also comes with a few free models for trying it out.
- **Claude Code**: `bun run sandbox agent claude`. A Claude Pro or Max subscription only works in Anthropic's own tools, not in opencode, so use this agent for it. Run `/login` once inside the VM.
- **Codex**: `bun run sandbox agent codex`, with ChatGPT sign-in or an API key.

Logins stay on the VM's disk until `bun run sandbox rm`.

### Your editor with the VM's agent

Editors that speak the [Agent Client Protocol](https://agentclientprotocol.com) can drive the agent inside the VM. Run `bun run sandbox zed` and paste the printed `agent_servers` block into Zed's settings. You keep Zed's agent panel, while the agent and every command it runs stay in the sandbox. The project is mounted at the same path in the VM as on your machine, so file paths match on both sides. If the sandbox isn't running, Zed boots it.

### Without the sandbox

Everything also runs directly on your machine with bun: `bun install && bun run setup && bun run dev`. The agent then has your user's full access, so keep its permission prompts on.

## Daily loop

| Command               | Does                                                  |
| --------------------- | ----------------------------------------------------- |
| `bun run verify`      | Lint + types + unit + e2e on the production build     |
| `bun run db:generate` | Migration from `src/lib/server/db/schema.ts`          |
| `bun run db:reset`    | Empty the DB in place, migrate and seed               |
| `bun run deploy`      | On your machine: `verify`, then `fly deploy`          |
| `bun run deps:update` | Dependency updates, committed only if `verify` passes |

Sign in at `/login` with `ada@example.com` (seeded). The magic link shows up in `bun run sandbox logs`. The full list of commands, the golden rules and the map of the code are in [AGENTS.md](AGENTS.md).

## How agents write code here

Sveet ships as little as possible, because your agent can add what you need in seconds. The same goes for what agents write: [ponytail](https://ponytail.dev) makes them use what's already there (the codebase, the platform, ui-sdk, the installed libraries) before writing anything new. It's always on in opencode, and `AGENTS.md` tells Claude Code and other agents to load it. Every feature gets an e2e test of its happy path. Unit tests are only for logic that's worth testing.

Project skills (`.agents/skills/`) teach the flows: `sveet-setup`, `sveet-feature`, `sveet-deploy`, `sveet-mail`, `sveet-admin` and `sveet-upgrade`. See [AGENTS.md](AGENTS.md) for when each applies.

## Deploy

Run these on your machine, not in the sandbox:

```bash
fly apps create <app>
fly volumes create data --size 1 --region <region>
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)" SCW_SECRET_KEY=… SCW_DEFAULT_PROJECT_ID=…
bun run deploy
```

The image is one compiled executable plus `drizzle/` on debian-slim, with no bun and no `node_modules` at runtime. It's plain Docker, so it runs anywhere a container does. The `sveet-deploy` skill covers mail DNS, custom domains, scaling, backups and other hosts.

## Updating

A sveet project is a copy, not a dependency, so updates are a merge. `package.json` records the release you started from (`sveet.version`). Ask your agent to **"upgrade sveet"**: the `sveet-upgrade` skill diffs that release against the newest one and applies the parts that fit your project, such as tooling, fixes and skills.

## The Svelte CLI

`sv create` has no remote templates; it extends projects through [community add-ons](https://svelte.dev/docs/cli/community). See [docs/sv.md](docs/sv.md) for the plan to ship sveet as `bunx sv create --add @nerdwerk/sveet`.

## Variants

The [`pocketbase`](https://github.com/nerdwerk/sveet/tree/pocketbase) branch swaps the data and auth layer for PocketBase on PocketHost. It follows its own release pace.

## License

MIT © Roman Kuba
