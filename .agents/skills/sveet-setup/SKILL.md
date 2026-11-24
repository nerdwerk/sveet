---
name: sveet-setup
description: Turns a fresh sveet checkout into the user's own project. Interviews them (name, purpose, domain, deploy target and region, mail, auth, which examples to keep), then rewrites the files, regenerates migrations and verifies. Use right after `bun create`/clone of sveet, when the user says "set up", "initialize", "rename the project", or when package.json still says `"name": "sveet"`.
---

# Set up a new sveet project

You are turning the sveet starter into the user's project. Ask first, change second, verify last. Never create anything in an external system (Fly apps, domains, DNS) during setup; guessed names only go into files the user can edit.

## 0. Preflight

1. Confirm you are at the repo root and `package.json` has `"sveet": { "version": … }`. Note that version.
2. Run `git status`. If there are uncommitted changes, ask before continuing.
3. Check `SVEET_SANDBOX`. If it is set, you are in the sandbox (the usual case): the dev server is already running at http://localhost:5173 and restarts with `bun run sandbox restart`. `fly` commands are not available, so list them for the user to run on the host. If it is not set, the user is working on the host directly.
4. Delete `packages/` and `docs/` if they exist: they are sveet’s own release tooling (`bun create` and the sv add-on already leave them out).
5. If `node_modules` is missing, run `bun install`. If `.env` is missing, run `bun run setup` (creates `.env`, migrates, seeds).

## 1. Interview

Sveet should feel fast: a quick tryout or demo needs only a name. Before asking, tell the user in two lines that every answer can be changed later and that "skip" or "later" is always fine. If they say "just the defaults", "quick" or similar, ask only questions 1 and 2 and use the defaults for the rest.

Ask with your question tool if you have one, in as few rounds as possible: 1–3 first, then only what the answers leave open. Offer the recommended default first. Skip anything the user already told you. Explain each question in plain words, the way the notes below do.

| #   | Question                                       | Default / notes                                                                                                                                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Project name                                   | Slug from the folder name; display name from the slug.                                                                                                                                                                                                                                                                                                                       |
| 2   | What's the one-liner that gets people curious? | Shows on the landing page, in `<meta>` and in mail. Offer to draft one from the name if they're stuck.                                                                                                                                                                                                                                                                       |
| 3   | Do you want to deploy this?                    | **Fly.io** (recommended: one command, SQLite on a volume, cheap) · another Docker host · **no need to deploy** (tryouts, demos, local tools). "No" leaves `fly.toml` untouched and skips 4–7; tell them the `sveet-deploy` skill sets it up whenever they want to go live.                                                                                                   |
| 4   | Fly app name + region                          | Don't ask: guess, then tell them. App = `<slug>-<4 random chars>` (`openssl rand -hex 2`), because `fly.dev` names are global and the plain slug is often taken. Region nearest the user or their audience (timezone, language, the one-liner), else `ams`. Say they can change both in `fly.toml` until the first deploy. Nothing is created now; `sveet-deploy` does that. |
| 5   | Got your own domain?                           | Optional. Default `https://<app>.fly.dev`; a custom domain can be added any time with `sveet-deploy`.                                                                                                                                                                                                                                                                        |
| 6   | How should login mail go out?                  | Sign-in works by magic link, so production has to send mail. **Scaleway TEM** (EU, free up to 3,000 mails a month, built in) · another provider → also run the `sveet-mail` skill · **later** → `MAIL_TRANSPORT=console`: links only show up in `fly logs`, fine for a demo only you use.                                                                                    |
| 7   | Sender address                                 | Only with mail and an own domain (a `fly.dev` address can't send mail, so without a domain mail stays on `console`). Default `login@mail.<domain>`. Explain: sending from a `mail.` subdomain means that if mail ever lands in spam, the main domain's reputation stays clean.                                                                                               |
| 8   | Who will use it?                               | **Anyone** can sign up (default) · **me and people I invite** · **only me**. The last two turn sign-up off, so only users you create can sign in. For "only me", also ask for their email (default `git config user.email`) so they have an account.                                                                                                                         |
| 9   | License                                        | Don't ask, just tell them: sveet uses **MIT**, and we think it's the best way to get started. Holder from `git config user.name`; if that's empty, ask for the name (or use the display name if they skip). If they'd rather not open-source it, remove `LICENSE` and set `"private": true`.                                                                                 |

## 2. Apply

Make these edits; skip what the answers don't touch.

- **`package.json`**: `name` = slug, `version` = `0.1.0`, `description` = tagline. Keep the `"sveet"` block — the `sveet-upgrade` skill reads `sveet.version` to know which release this project started from.
- **`src/lib/app.ts`**: `APP.name` = display name, `APP.tagline` = tagline.
- **`fly.toml`** (Fly; untouched if they don't deploy): `app`, `primary_region`, `ORIGIN`, `MAIL_FROM`, `MAIL_TRANSPORT`. Optional `MAIL_FROM_NAME`, `MAIL_REPLY_TO`.
  Not Fly: delete `fly.toml`, change `deploy` in package.json to `bun run verify` and tell the user how to run the image (`docker build`, mount a volume at `/data`, set the env vars from `src/env.ts`). Remove the `fly-client-ip` header from `src/lib/server/auth-config.ts` and set `ADDRESS_HEADER` for their proxy instead.
- **Invite-only / only me**: set `disableSignUp: true` in `src/lib/server/auth-config.ts` and explain how users get created (seed for dev; a CLI like the one in the `sveet-admin` skill for prod). For "only me", add their email to `SEED_USERS` in `src/lib/server/db/seed.ts`. Sign-up being off breaks two tests on purpose: make the first test in `src/lib/server/auth.test.ts` assert that an unknown address gets no session, and delete `a new address gets an account on first sign-in` from `tests/e2e/auth.e2e.ts`.
- **`README.md`**: replace it with the project's own README: name, tagline, a "Development" section (`bun install`, `bun run setup`, `bun run dev`), a short "Deploy" section, and a line "Started from [sveet](https://github.com/nerdwerk/sveet) vX.Y.Z". Point to `AGENTS.md` for the details.
- **`CHANGELOG.md`**: reset it to a single `## [Unreleased]` section.
- **`LICENSE`**: update the holder and year, or delete it.
- **`static/`**: replace `sveet-logo.png` and `src/lib/assets/favicon.svg` if the user has their own. Otherwise leave them and mention it.
- **Landing page** `src/routes/+page.svelte`: replace the "Next steps" list with a short hero for their product, or leave it and say so. Either way, drop the "Personalize" step: setup is done.
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
