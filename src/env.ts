import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';

// `vite build` evaluates server modules, so required values get stand-ins while building.
const required =
	(fallback: string) =>
	(value: string | undefined): string => {
		if (value) return value;
		if (building) return fallback;
		throw new Error('is required (see .env.example)');
	};
const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	ORIGIN: {
		description: 'Public URL; sign-in links are built from it.',
		schema: required('http://localhost:5173')
	},
	BETTER_AUTH_SECRET: { description: 'Signs sessions.', schema: required('build-placeholder') },
	DATABASE_PATH: { description: 'SQLite file.', schema: required(':memory:') },
	MAIL_TRANSPORT: { description: '`console` or `scaleway`.', schema: optional },
	MAIL_FROM: { description: 'Sender address.', schema: optional },
	MAIL_FROM_NAME: { description: 'Sender name; defaults to APP.name.', schema: optional },
	MAIL_REPLY_TO: { description: 'Where replies go.', schema: optional },
	SCW_SECRET_KEY: { description: 'Scaleway key with send-only permission.', schema: optional },
	SCW_DEFAULT_PROJECT_ID: {
		description: 'Scaleway project with the TEM domain.',
		schema: optional
	},
	SCW_DEFAULT_REGION: { description: 'Defaults to fr-par.', schema: optional }
});
