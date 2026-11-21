import type { Db } from './client.ts';
import { user } from './schema.ts';

// Fixed ids keep URLs stable across `db:reset`; tests import these fixtures.
export const SEED_USERS = {
	ada: { id: 'seed-user-ada', name: 'Ada Lovelace', email: 'ada@example.com' },
	grace: { id: 'seed-user-grace', name: 'Grace Hopper', email: 'grace@example.com' }
} as const;

export async function seed(db: Db) {
	await db
		.insert(user)
		.values(Object.values(SEED_USERS).map((person) => ({ ...person, emailVerified: true })))
		.onConflictDoNothing();
}
