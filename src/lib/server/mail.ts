// The only code that knows how mail leaves the app. New provider or new mail: the sveet-mail skill.
import { APP } from '#lib/app.ts';

export type Mail = { to: string; subject: string; text: string };
export type Mailer = { send(mail: Mail): Promise<void> };

// Callers catch this so a provider outage still answers "check your inbox" and leaks nothing.
export class MailDeliveryError extends Error {
	override name = 'MailDeliveryError';
}

// The e2e suite reads sign-in links from this output.
export const consoleMailer: Mailer = {
	async send({ to, subject, text }) {
		console.info(`[mail] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
	}
};

export const renderMagicLink = ({ to, url }: { to: string; url: string }): Mail => ({
	to,
	subject: `Your ${APP.name} sign-in link`,
	text: `Sign in to ${APP.name}:\n${url}\n\nThe link works once and expires in a few minutes. If you didn't ask for it, ignore this email.\n`
});

export type ScalewayMailerConfig = {
	secretKey: string;
	projectId: string;
	region: string;
	from: { email: string; name?: string };
	replyTo?: string;
	fetch?: typeof fetch;
};

export function createScalewayMailer(config: ScalewayMailerConfig): Mailer {
	const endpoint = `https://api.scaleway.com/transactional-email/v1alpha1/regions/${config.region}/emails`;
	const request = config.fetch ?? fetch;

	return {
		async send({ to, subject, text }) {
			const response = await request(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-auth-token': config.secretKey },
				body: JSON.stringify({
					project_id: config.projectId,
					from: config.from,
					to: [{ email: to }],
					subject,
					text,
					...(config.replyTo && {
						additional_headers: [{ key: 'Reply-To', value: config.replyTo }]
					})
				}),
				signal: AbortSignal.timeout(10_000)
			}).catch((error) => {
				throw new MailDeliveryError(`Scaleway TEM unreachable: ${error}`, { cause: error });
			});
			if (!response.ok) {
				throw new MailDeliveryError(`Scaleway TEM: ${response.status} ${await response.text()}`);
			}
		}
	};
}

type MailEnv = Partial<
	Record<
		| 'MAIL_TRANSPORT'
		| 'MAIL_FROM'
		| 'MAIL_FROM_NAME'
		| 'MAIL_REPLY_TO'
		| 'SCW_SECRET_KEY'
		| 'SCW_DEFAULT_PROJECT_ID'
		| 'SCW_DEFAULT_REGION',
		string
	>
>;

// A built server sends for real unless told otherwise, so production can't silently log sign-in links.
export function mailerFromEnv(env: MailEnv, options: { dev: boolean }): Mailer {
	const transport = env.MAIL_TRANSPORT || (options.dev ? 'console' : 'scaleway');
	if (transport === 'console') return consoleMailer;
	if (transport !== 'scaleway') {
		throw new Error(`MAIL_TRANSPORT must be "console" or "scaleway", got "${transport}"`);
	}

	const missing = (['SCW_SECRET_KEY', 'SCW_DEFAULT_PROJECT_ID', 'MAIL_FROM'] as const).filter(
		(name) => !env[name]
	);
	if (missing.length) {
		throw new Error(`Scaleway mail needs ${missing.join(', ')} (or MAIL_TRANSPORT=console)`);
	}

	return createScalewayMailer({
		secretKey: env.SCW_SECRET_KEY!,
		projectId: env.SCW_DEFAULT_PROJECT_ID!,
		region: env.SCW_DEFAULT_REGION || 'fr-par',
		from: { email: env.MAIL_FROM!, name: env.MAIL_FROM_NAME || APP.name },
		replyTo: env.MAIL_REPLY_TO
	});
}

let current: Mailer = consoleMailer;

// Bound once by auth-config; the server (at start) and tests swap what's behind it.
export const mailer: Mailer = { send: (mail) => current.send(mail) };

export function setMailer(next: Mailer) {
	current = next;
}

export function createFakeMailer() {
	const sent: Mail[] = [];
	return { sent, mailer: { send: async (mail: Mail) => void sent.push(mail) } satisfies Mailer };
}
