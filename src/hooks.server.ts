import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/env';
import * as env from '$app/env/private';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { applyMigrations } from '#lib/server/db/client.ts';
import { mailerFromEnv, setMailer } from '#lib/server/mail.ts';

// Runs once before the first request. A misconfigured mailer throws here, so
// the server refuses to start rather than failing on someone's first sign-in.
// The built server also applies pending migrations — every deploy and every
// restart brings the database up to date, with nothing to remember.
export const init: ServerInit = () => {
	setMailer(mailerFromEnv(env, { dev }));
	if (!dev && !building) applyMigrations(db);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleAuth;
