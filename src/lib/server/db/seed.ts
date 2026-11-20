import type { Db } from './client.ts';
import { note, user } from './schema.ts';

/**
 * Deterministic development data. Fixed ids keep URLs stable across
 * `bun run db:reset`, and tests import these fixtures instead of inventing
 * their own. Extend it whenever you add a table — never test against
 * hand-made local data.
 */
export const SEED_USERS = {
	ada: { id: 'seed-user-ada', name: 'Ada Lovelace', email: 'ada@example.com' },
	grace: { id: 'seed-user-grace', name: 'Grace Hopper', email: 'grace@example.com' }
} as const;

export const SEED_NOTES = [
	{ id: 'seed-note-ada', userId: SEED_USERS.ada.id, body: 'Notes on the Analytical Engine' },
	{ id: 'seed-note-grace', userId: SEED_USERS.grace.id, body: 'It’s easier to ask forgiveness' }
] as const;

/** Idempotent: re-running leaves existing rows alone. */
export async function seed(db: Db) {
	await db
		.insert(user)
		.values(Object.values(SEED_USERS).map((person) => ({ ...person, emailVerified: true })))
		.onConflictDoNothing();
	await db
		.insert(note)
		.values([...SEED_NOTES])
		.onConflictDoNothing();
	return { users: Object.values(SEED_USERS), notes: SEED_NOTES.length };
}
