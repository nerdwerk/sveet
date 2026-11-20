import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';
import { resolve } from '$app/paths';
import { auth } from '#lib/server/auth.ts';
import { MailDeliveryError } from '#lib/server/mail.ts';

export const load = ({ locals }) => {
	if (locals.user) redirect(303, resolve('/account'));
};

export const actions = {
	default: async ({ request }) => {
		const email = String((await request.formData()).get('email') ?? '').trim();
		if (!email.includes('@')) return fail(400, { email, message: 'Enter your email address.' });

		try {
			await auth.api.signInMagicLink({
				// Absolute on purpose: on the server `resolve()` returns a path relative
				// to this request, and the link is opened from an inbox.
				body: { email, callbackURL: '/account' },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError && error.status === 'TOO_MANY_REQUESTS') {
				return fail(429, { email, message: 'Too many attempts. Try again in a minute.' });
			}
			// Same answer whether delivery failed or not, so the form can't be used
			// to probe which addresses work. The failure still lands in the log.
			if (!(error instanceof MailDeliveryError)) throw error;
			console.error('[magic-link] delivery failed', error);
		}
		return { sent: true as const, email };
	}
};
