---
name: sveet-setup
description: Turns a fresh sveet checkout into the user's own project. Interviews them (name, purpose, domain, deploy target and region, mail, auth, which examples to keep), then rewrites the files, regenerates migrations and verifies. Use right after `bun create`/clone of sveet, when the user says "set up", "initialize", "rename the project", or when package.json still says `"name": "sveet"`.
---

# Set up a new sveet project

You are turning the sveet starter into the user's project. Ask first, change second, verify last. Never guess an answer that changes an external system (app names, domains, regions).

## 0. Preflight

1. Confirm you are at the repo root and `package.json` has `"sveet": { "version": … }`. Note that version.
2. Run `git status`. If there are uncommitted changes, ask before continuing.
3. Check `SVEET_SANDBOX`. If it is set, you are in the sandbox (the usual case): the dev server is already running at http://localhost:5173 and restarts with `bun run sandbox restart`. `fly` commands are not available, so list them for the user to run on the host. If it is not set, the user is working on the host directly.
4. If `node_modules` is missing, run `bun install`. If `.env` is missing, run `bun run setup` (creates `.env`, migrates, seeds).

## 1. Interview

Ask with your question tool if you have one, in **one round** where possible. Offer the recommended default first. Skip anything the user already told you.

| #   | Question                                            | Default / notes                                                                                                                                                       |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Project name (npm-style slug) and display name      | slug from the folder name                                                                                                                                             |
| 2   | One-line tagline — what does it do, for whom?       | used in `<meta>`, the landing page and mail                                                                                                                           |
| 3   | Where will it run?                                  | **Fly.io** (default). Others: "any Docker host" (keep Dockerfile, drop fly.toml) or "decide later" (keep Fly files)                                                   |
| 4   | Fly app name + region (if Fly)                      | app = slug; region nearest the user's audience (`fly platform regions`). Checking availability means `fly apps create`; on the host only, and only if the user agrees |
| 5   | Public URL                                          | `https://<app>.fly.dev`, or their custom domain                                                                                                                       |
| 6   | Transactional mail                                  | **Scaleway TEM** (EU, built in) · another provider → also run the `sveet-mail` skill · "not yet" → `MAIL_TRANSPORT=console` in fly.toml                               |
| 7   | Sender address                                      | `login@mail.<domain>`; a dedicated `mail.` subdomain keeps reputation off the root domain                                                                             |
| 8   | Who may sign up?                                    | **anyone** (default) · invite-only → `disableSignUp: true` in the magic-link plugin plus a way to create users (seed/CLI)                                             |
| 9   | Keep the example `note` table and account notes UI? | Keep as a reference, or remove (recommended once they start their own schema)                                                                                         |
| 10  | License + copyright holder                          | MIT, holder from `git config user.name`; or "proprietary" (remove LICENSE, set `"private": true`)                                                                     |

## 2. Apply

Make these edits; skip what the answers don't touch.

- **`package.json`**: `name` = slug, `version` = `0.1.0`, `description` = tagline. Keep the `"sveet"` block — the `sveet-upgrade` skill reads `sveet.version` to know which release this project started from.
- **`src/lib/app.ts`**: `APP.name` = display name, `APP.tagline` = tagline.
- **`fly.toml`** (Fly): `app`, `primary_region`, `ORIGIN`, `MAIL_FROM`, `MAIL_TRANSPORT`. Optional `MAIL_FROM_NAME`, `MAIL_REPLY_TO`.
  Not Fly: delete `fly.toml`, change `deploy` in package.json to `bun run verify` and tell the user how to run the image (`docker build`, mount a volume at `/data`, set the env vars from `src/env.ts`). Remove the `fly-client-ip` header from `src/lib/server/auth-config.ts` and set `ADDRESS_HEADER` for their proxy instead.
- **Invite-only**: set `disableSignUp: true` in `src/lib/server/auth-config.ts` and explain how users get created (seed for dev; a CLI like the one in the `sveet-admin` skill for prod).
- **Remove the example** (if asked): delete `note` from `src/lib/server/db/schema.ts`, `SEED_NOTES` and its insert from `seed.ts`, the notes section and actions in `src/routes/account/`, the notes assertions in `tests/e2e/auth.e2e.ts` and `seed.test.ts`. Then:
  ```sh
  rm -rf drizzle && bun run db:generate && bun run db:reset
  ```
  Only do `rm -rf drizzle` while nothing is deployed. After the first deploy, migrations are append-only.
- **`README.md`**: replace it with the project's own README: name, tagline, a "Development" section (`bun install`, `bun run setup`, `bun run dev`), a short "Deploy" section, and a line "Started from [sveet](https://github.com/nerdwerk/sveet) vX.Y.Z". Point to `AGENTS.md` for the details.
- **`CHANGELOG.md`**: reset it to a single `## [Unreleased]` section.
- **`LICENSE`**: update the holder and year, or delete it.
- **`static/`**: replace `sveet_logo.png` and `src/lib/assets/favicon.svg` if the user has their own. Otherwise leave them and mention it.
- **Landing page** `src/routes/+page.svelte`: replace the "Next steps" list with a short hero for their product, or leave it and say so.
- **Git**: keep sveet reachable for upgrades:
  ```sh
  git remote rename origin sveet 2>/dev/null || git remote add sveet https://github.com/nerdwerk/sveet.git
  ```
  Then ask for their own remote (`git remote add origin …`). Don't push without being asked.

Leave `AGENTS.md`, `CLAUDE.md`, the skills and the tooling as they are. They describe how the project works, not what it is called. Do update the "What this is" paragraph in `AGENTS.md` to describe their product.

## 3. Verify and hand off

1. `bun run format && bun run verify`. All of it must pass. If the browser isn't installed, run `bun run test:setup` once.
2. `bun run hooks:install`, so pushes run `verify`.
3. Commit as "Set up <name> from sveet vX.Y.Z" once the user agrees.
4. Tell the user what changed, what you left alone, and the next steps:
   - Fly: the `sveet-deploy` skill does the first launch (volume, secrets, mail DNS).
   - Building: the `sveet-feature` skill is the loop for every feature.
