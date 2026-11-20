import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';

// Every environment variable the app reads, in one place. Import them from
// `$app/env/private` (or `$app/env/public` for `public: true`). An invalid or
// missing required value stops the server from starting — never a 500 later.
// `vite build` evaluates server modules too, so required values get a harmless
// stand-in while `building`; the real ones come from `.env` or `fly secrets`.

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
		description:
			'Public URL of the app, e.g. https://my-app.fly.dev. Better Auth builds links from it.',
		schema: required('http://localhost:5173')
	},
	BETTER_AUTH_SECRET: {
		description:
			'Signs sessions. `bun run setup` generates one; production uses `fly secrets set`.',
		schema: required('build-time-placeholder-never-used-at-runtime')
	},
	DATABASE_PATH: {
		description: 'SQLite file. `local.db` in dev, `/data/sqlite.db` on the Fly volume.',
		schema: required(':memory:')
	},
	MAIL_TRANSPORT: {
		description:
			'`console` logs mails, `scaleway` sends them. Unset: console in dev, scaleway when built.',
		schema: optional
	},
	MAIL_FROM: { description: 'Sender address for transactional mail.', schema: optional },
	MAIL_FROM_NAME: {
		description: 'Sender display name. Defaults to the app name.',
		schema: optional
	},
	MAIL_REPLY_TO: { description: 'Where replies to transactional mail go.', schema: optional },
	SCW_SECRET_KEY: { description: 'Scaleway IAM key limited to sending email.', schema: optional },
	SCW_DEFAULT_PROJECT_ID: {
		description: 'Scaleway project holding the TEM domain.',
		schema: optional
	},
	SCW_DEFAULT_REGION: { description: 'Scaleway TEM region. Defaults to fr-par.', schema: optional }
});
