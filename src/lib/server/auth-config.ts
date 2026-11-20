import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins/magic-link';
import { mailer, renderMagicLink } from '#lib/server/mail.ts';
import type { Db } from '#lib/server/db/index.ts';

export const MAGIC_LINK_EXPIRES_IN_SECONDS = 60 * 10;

/**
 * Everything the real auth instance and the tests share. Kept out of `auth.ts`
 * so tests can build an instance against a throwaway database without the
 * SvelteKit cookie plugin — and without a second copy of the config drifting
 * from the one that ships. After changing it, run `bun run auth:schema`.
 */
export function authOptions(db: Db, overrides?: { baseURL?: string; secret?: string }) {
	return {
		baseURL: overrides?.baseURL,
		secret: overrides?.secret,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		// No passwords anywhere — the magic link is the only credential.
		emailAndPassword: { enabled: false },
		advanced: {
			// Better Auth defaults this to `true` under NODE_ENV=test, which would
			// switch off callbackURL validation in exactly the tests meant to prove
			// it works. Pin it so test and production agree.
			disableOriginCheck: false,
			// Rate limits are keyed by client IP. Behind Fly's proxy
			// `x-forwarded-for` can carry a client-supplied chain, and without a
			// trusted IP every visitor shares one bucket. Fly sets `Fly-Client-IP`
			// itself. Elsewhere it's absent and Better Auth falls back to the peer.
			ipAddress: { ipAddressHeaders: ['fly-client-ip'] }
		},
		plugins: [
			magicLink({
				expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
				// The first sign-in creates the account. Set `disableSignUp: true`
				// for invite-only apps.
				sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
					await mailer.send(renderMagicLink({ to: email, url }));
				}
			})
		]
	} satisfies BetterAuthOptions;
}
