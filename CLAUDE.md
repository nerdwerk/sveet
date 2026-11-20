# CLAUDE.md

Read **[AGENTS.md](./AGENTS.md)**. It's the operating guide: stack, golden rules, commands, where things live, and which skill to load for which flow.

- **Fresh project?** If `package.json` is still named `sveet`, offer to run the `sveet-setup` skill before anything else.
- **Svelte MCP** (`.mcp.json`): `list-sections` first, then `get-documentation`; run `svelte-autofixer` on every component you write until it reports nothing; `playground-link` only when the user asks, and never for code already in files.
- **UI**: the `ui-sdk` skill and `@ui-sdk/svelte` components, themed through `src/routes/layout.css`.
- **Done means `bun run verify` passed.** Report the result, not an expectation.
