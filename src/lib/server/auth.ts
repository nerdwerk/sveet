import { BETTER_AUTH_SECRET, ORIGIN } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';
import { authOptions } from '#lib/server/auth-config.ts';

const options = authOptions(db, { baseURL: ORIGIN, secret: BETTER_AUTH_SECRET });

export const auth = betterAuth({
	...options,
	plugins: [
		...options.plugins,
		sveltekitCookies(getRequestEvent) // must stay the last plugin
	]
});
