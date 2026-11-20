import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb } from './test-db.ts';
import { note, user } from './schema.ts';
import { seed, SEED_NOTES, SEED_USERS } from './seed.ts';

describe('seed', () => {
	it('creates the fixed users and notes', async () => {
		const db = createTestDb();
		await seed(db);

		const ada = await db.query.user.findFirst({ where: eq(user.id, SEED_USERS.ada.id) });
		expect(ada?.email).toBe(SEED_USERS.ada.email);
		expect(await db.$count(note)).toBe(SEED_NOTES.length);
	});

	it('is idempotent', async () => {
		const db = createTestDb();
		await seed(db);
		await seed(db);
		expect(await db.$count(user)).toBe(Object.keys(SEED_USERS).length);
	});
});
