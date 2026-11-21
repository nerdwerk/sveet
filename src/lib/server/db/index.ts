import { DATABASE_PATH } from '$app/env/private';
import { openDatabase } from './client.ts';

export type { Db } from './client.ts';
export const { db, client } = openDatabase(DATABASE_PATH);
