---
name: sveet-admin
description: Adds operator tooling to a sveet app — a /healthz endpoint wired into Fly health checks, a superuser flag that only a shell can set, a superuser CLI compiled into the Docker image, and a minimal /admin dashboard. Use when the user wants health checks, an admin area, superusers, or to manage users from production.
---

# Operator tooling

Not part of the sveet core. Add the pieces the user asks for, in this order, since each builds on the previous one.

## 1. Health check

`src/routes/healthz/+server.ts`:

```ts
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';

export const GET = () => {
	try {
		db.run(sql`select 1`);
		return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
	} catch {
		return Response.json({ status: 'error' }, { status: 503 });
	}
};
```

In `fly.toml`, under `[http_service]`:

```toml
  [[http_service.checks]]
    grace_period = '10s'
    interval = '30s'
    method = 'GET'
    path = '/healthz'
    timeout = '5s'
```

Add an e2e test that expects `200` and `{"status":"ok"}`. Health checks don't count as traffic, so they don't keep a scaled-to-zero machine awake.

## 2. Superusers

1. Add to `user.additionalFields` in `src/lib/server/auth-config.ts`:
   ```ts
   user: {
   	additionalFields: {
   		// `input: false` keeps it out of every Better Auth endpoint; only the CLI sets it.
   		isSuperuser: { type: 'boolean', required: false, defaultValue: false, input: false }
   	}
   }
   ```
2. Run `bun run auth:schema`, then `bun run db:generate`.
3. Write `src/lib/server/admin/superuser.ts` with `setSuperuser(db, email, value)` and `listSuperusers(db)`, plus tests using `createTestDb()`.
4. Write `src/lib/server/db/superuser-cli.ts` (`grant|revoke <email>`, `list`). It opens the database with `openDatabase(process.env.DATABASE_PATH)` from `client.ts`. It must not import `$app/*`, because it runs outside SvelteKit.
5. Add the script `"superuser": "bun src/lib/server/db/superuser-cli.ts"`. In the seed, make `ada@example.com` a superuser.
6. Compile it into the image: the runtime image has no bun, so in the Dockerfile builder stage add
   ```dockerfile
   RUN bun build --compile src/lib/server/db/superuser-cli.ts --outfile superuser
   ```
   and copy `superuser` into the runtime stage. In production run `fly ssh console -C "/app/superuser grant you@example.com"`.

## 3. /admin

1. Write `requireSuperuser(locals)` in `src/lib/server/admin/`. It throws `error(404)` for everyone else, including signed-out visitors, so the route's existence isn't revealed.
2. Add `src/routes/admin/+layout.server.ts`, which calls it, and `+page.svelte`, which shows totals (users, rows of the main tables), signups over the last 30 days, and a health panel (database size, applied migrations, uptime).
3. E2E: a seeded superuser sees the page; another seeded user and a signed-out visitor both get 404.

Keep it read-only at first. Add destructive actions (delete user, hide content) one at a time, each behind a confirm step, with a test.
