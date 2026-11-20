// Your tables. After editing: `bun run db:generate`, then `bun run db:migrate`.
// Better Auth's tables are generated into auth.schema.ts — don't edit those here.
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema.ts';

/** An example table owned by a user. Replace it with your own. */
export const note = sqliteTable('note', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	body: text('body').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

export * from './auth.schema.ts';
