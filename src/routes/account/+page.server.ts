import { fail, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { resolve } from '$app/paths';
import { auth } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { note } from '#lib/server/db/schema.ts';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(303, resolve('/login'));
	const notes = await db
		.select({ id: note.id, body: note.body })
		.from(note)
		.where(eq(note.userId, locals.user.id))
		.orderBy(desc(note.createdAt));
	return { notes };
};

export const actions = {
	addNote: async ({ locals, request }) => {
		if (!locals.user) redirect(303, resolve('/login'));
		const body = String((await request.formData()).get('body') ?? '').trim();
		if (!body) return fail(400, { message: 'Write something first.' });
		if (body.length > 500) return fail(400, { message: 'Keep it under 500 characters.' });
		await db.insert(note).values({ userId: locals.user.id, body });
	},
	signOut: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		redirect(303, resolve('/'));
	}
};
