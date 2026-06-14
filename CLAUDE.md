# CLAUDE.md

See **[AGENTS.md](./AGENTS.md)** for the full operating guide — stack, golden rules, commands, and conventions.

## Svelte MCP (configured in `.mcp.json`)

You have access to the Svelte MCP server with Svelte 5 / SvelteKit docs:

- **`list-sections`** — call FIRST to discover documentation sections.
- **`get-documentation`** — fetch the relevant sections returned above.
- **`svelte-autofixer`** — run on any Svelte code you write, repeatedly, until no issues remain.
- **`playground-link`** — only after the user confirms, and never for code already written to files.

## UI work

A vendored **shadcn-svelte skill** lives in `.agents/skills/shadcn-svelte/`. Use it for adding, composing, and styling components. Add components with `bunx shadcn-svelte@latest add <name>`.
