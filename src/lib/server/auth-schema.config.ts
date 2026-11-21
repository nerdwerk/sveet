// Entry for `bun run auth:schema`: the Better Auth CLI can't resolve SvelteKit's `$app/*`.
import { betterAuth } from 'better-auth/minimal';
import { authOptions } from './auth-config.ts';
import { openDatabase } from './db/client.ts';

export const auth = betterAuth(authOptions(openDatabase(':memory:').db));
