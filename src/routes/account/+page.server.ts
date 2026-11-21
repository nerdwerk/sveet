import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { auth } from '#lib/server/auth.ts';

export const load = ({ locals }) => {
	if (!locals.user) redirect(303, resolve('/login'));
};

export const actions = {
	signOut: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		redirect(303, resolve('/'));
	}
};
