# @nerdwerk/sv

[Sveet](https://github.com/nerdwerk/sveet) for the Svelte CLI: an opinionated, agent-first SvelteKit starter kit that's sweet like candy 🍭

```bash
npx sv create my-app --template minimal --types ts --add @nerdwerk --install bun
cd my-app
bun run sandbox
# → open http://localhost:4096 and say "set this project up"
```

sv scaffolds its minimal SvelteKit project, and this add-on turns it into Sveet: SvelteKit 3 on bun, SQLite with Drizzle, Better Auth magic links, ui-sdk, Fly.io deploys, and a sandbox VM where your coding agent works without permission prompts and without access to the rest of your machine.

It's the same project you get from `bun create nerdwerk/sveet my-app`, at the same version.

**Needs:** [bun](https://bun.com), and [microsandbox](https://microsandbox.dev) for the sandbox (Apple Silicon Mac, or Linux with KVM). The add-on requires a SvelteKit project with TypeScript.

Everything else, from the why to the daily loop, is in the [Sveet README](https://github.com/nerdwerk/sveet#readme).

MIT © Nerdwerk
