/**
 * Entry point for `bun run auth:schema` only. The Better Auth CLI can't resolve
 * SvelteKit's `$app/*` modules, so it reads the shared options from here,
 * against a throwaway database, instead of `auth.ts`.
 */
import { betterAuth } from 'better-auth/minimal';
import { authOptions } from './auth-config.ts';
import { openDatabase } from './db/client.ts';

export const auth = betterAuth(authOptions(openDatabase(':memory:').db));
