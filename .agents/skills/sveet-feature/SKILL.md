---
name: sveet-feature
description: The build loop for any feature in a sveet project — spec, schema and migration, seed, server logic with tests, UI from ui-sdk, e2e test, verify. Use whenever the user asks to add or change product functionality (a page, a form, a table, an API, a background job), not for one-line fixes.
---

# Build a feature the sveet way

Small steps, happy path first, ponytail throughout (load the `ponytail` skill). List the fancier version under "Not in scope" rather than building it.

## 1. Spec (anything bigger than an afternoon)

Write `specs/<n>_<slug>.md`, numbered after the highest existing spec:

- **Goal**: one paragraph, from the user's point of view.
- **Decisions**: each with a one-line reason.
- **Data**: tables, columns, constraints, what is unique and what cascades.
- **Routes and UI**: per page, what it shows and what it does.
- **Not in scope.**
- **Open questions.** Ask them before you build.

Get the user's OK, then commit the spec on its own.

## 2. Data

1. Edit `src/lib/server/db/schema.ts`. Give every table a text primary key (`crypto.randomUUID()` default) and `created_at`. Give owned rows a `user_id` foreign key with `onDelete: 'cascade'`.
2. `bun run db:generate`. Read the generated SQL. Never hand-edit `drizzle/`. A wrong migration that has not been deployed is deleted and regenerated. A wrong migration that has been deployed is fixed by a new one.
3. Extend `src/lib/server/db/seed.ts` with fixed-id fixtures for the new table and export them. Then `bun run db:reset`.

## 3. Server logic

- Put the rules in plain modules under `src/lib/server/<feature>/`: queries, validation, side effects. They take a `Db` argument, so tests can pass `createTestDb()`. Route files stay thin: parse input, call the module, return or `fail(…)`.
- Validate every input on the server and cap lengths, even when the UI does too.
- Unit-test only non-trivial logic (a branch that matters, parsing, money, security, permissions): one small `*.test.ts` next to the code, with `createTestDb()`, the seed fixtures and `createFakeMailer()`. Trivial code gets no test.
- New env vars go in `src/env.ts` with a `description`, `.env.example` and, if needed in production, `fly.toml` (non-secret) or `fly secrets set` (secret).
- Run `bun run test:unit --run <path>` while you iterate.

## 4. UI

- Compose from `@ui-sdk/svelte` components. Read `.agents/skills/ui-sdk/SKILL.md` and the component's page under `node_modules/@ui-sdk/svelte/docs/components/`. Import from entries (`@ui-sdk/svelte/dialog`). Never hand-roll a `role="dialog"` or `role="menu"`.
- Forms are SvelteKit form actions with `use:enhance`, wrapped in `Field` / `FieldLabel` / `FieldError`. Server errors come back via `fail()` and show through `FieldError`.
- Style with Tailwind utilities on top of the theme tokens (`bg-background`, `text-muted-foreground`, `border-border`, …). Change the look in `src/routes/layout.css`, not per component.
- Internal links use `resolve('/route')` from `$app/paths`.
- Run the Svelte MCP `svelte-autofixer` (or the `svelte-code-writer` skill) on every component until it is clean.

## 5. End-to-end test (always)

Add a test under `tests/e2e/`. The `app` fixture gives each test its own seeded database and production server. `signIn(page, app, email)` signs in a seeded user. Select by role and label, the way users and agents find controls.

## 6. Finish

1. `bun run format && bun run verify`. All green, or say exactly what fails and why.
2. Update `AGENTS.md` "Where things live" if you added a directory or a seam. Add an entry under `CHANGELOG.md` `[Unreleased]`.
3. Make small commits with short messages, grouped the way the work naturally splits (spec / data / feature / tests).
