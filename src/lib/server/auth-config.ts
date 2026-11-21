import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins/magic-link';
import { mailer, renderMagicLink } from '#lib/server/mail.ts';
import type { Db } from '#lib/server/db/index.ts';

// Shared by the app, the tests and `auth:schema`, so they can't drift. Changed it? `bun run auth:schema`.
export function authOptions(db: Db, overrides?: { baseURL?: string; secret?: string }) {
	return {
		...overrides,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		emailAndPassword: { enabled: false },
		advanced: {
			// Better Auth turns this off under NODE_ENV=test, which would hide callbackURL bugs.
			disableOriginCheck: false,
			// Fly sets this itself; x-forwarded-for is client-controlled, which breaks per-IP rate limits.
			ipAddress: { ipAddressHeaders: ['fly-client-ip'] }
		},
		plugins: [
			magicLink({
				expiresIn: 60 * 10,
				sendMagicLink: ({ email, url }) => mailer.send(renderMagicLink({ to: email, url }))
			})
		]
	} satisfies BetterAuthOptions;
}
