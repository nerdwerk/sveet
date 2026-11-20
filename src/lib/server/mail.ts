/**
 * The single seam between the app and transactional email. Nothing outside
 * this module knows how mail is delivered.
 *
 * - `consoleMailer` writes mails to the server log (dev and tests).
 * - `createScalewayMailer` sends through Scaleway Transactional Email.
 * - `mailerFromEnv` picks one at server start (see `hooks.server.ts`).
 *
 * To add a provider, write another `create…Mailer` that returns a `Mailer`
 * and add it to `mailerFromEnv` — the `sveet-mail` skill walks through it.
 * To add a mail, write another `render…` function next to `renderMagicLink`.
 */
import { APP } from '#lib/app.ts';

export type Mail = { to: string; subject: string; text: string; html: string };

export type Mailer = { send(mail: Mail): Promise<void> };

/**
 * The provider could not take the message. Callers catch this specifically so
 * an outage degrades to "check your inbox" rather than a 500 that would tell
 * visitors which addresses have accounts.
 */
export class MailDeliveryError extends Error {
	override name = 'MailDeliveryError';
}

/** Logs the mail instead of sending it. The e2e suite reads magic links from this output. */
export const consoleMailer: Mailer = {
	async send({ to, subject, text }) {
		console.info(`[mail] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
	}
};

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');

export function renderMagicLink({ to, url }: { to: string; url: string }): Mail {
	const subject = `Your ${APP.name} sign-in link`;
	const intro = `Use the link below to sign in to ${APP.name}.`;
	const footer =
		"The link works once and expires in a few minutes. If you didn't ask for it, ignore this email.";
	return {
		to,
		subject,
		text: `${intro}\n\nSign in:\n${url}\n\n${footer}\n\n— ${APP.name}\n`,
		html: `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:system-ui,sans-serif;color:#171717;background:#fafafa">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:32px">
<tr><td style="font-size:18px;font-weight:600;padding-bottom:16px">${escapeHtml(APP.name)}</td></tr>
<tr><td style="font-size:15px;line-height:1.5;padding-bottom:24px">${escapeHtml(intro)}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Sign in</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#525252">${escapeHtml(footer)}</td></tr>
</table></td></tr></table>
</body></html>`
	};
}

export type ScalewayMailerConfig = {
	secretKey: string;
	projectId: string;
	region: string;
	from: { email: string; name?: string };
	/** `from` is usually send-only, so without this a reply would bounce. */
	replyTo?: string;
	/** Injected by tests; defaults to the global `fetch`. */
	fetch?: typeof fetch;
};

/** Sends through Scaleway Transactional Email's HTTP API (EU-hosted). */
export function createScalewayMailer(config: ScalewayMailerConfig): Mailer {
	const endpoint = `https://api.scaleway.com/transactional-email/v1alpha1/regions/${config.region}/emails`;
	const request = config.fetch ?? fetch;

	return {
		async send({ to, subject, text, html }) {
			let response: Response;
			try {
				response = await request(endpoint, {
					method: 'POST',
					headers: { 'content-type': 'application/json', 'x-auth-token': config.secretKey },
					body: JSON.stringify({
						project_id: config.projectId,
						from: config.from,
						to: [{ email: to }],
						subject,
						text,
						html,
						// Scaleway has no reply-to field; it takes the header as-is.
						...(config.replyTo && {
							additional_headers: [{ key: 'Reply-To', value: config.replyTo }]
						})
					}),
					signal: AbortSignal.timeout(10_000)
				});
			} catch (error) {
				throw new MailDeliveryError(`Scaleway TEM unreachable: ${String(error)}`, {
					cause: error
				});
			}
			if (!response.ok) {
				// Scaleway's reason (unverified domain, quota, bad key…). It never
				// echoes the message body, so it is safe to log.
				const detail = await response.text().catch(() => '');
				throw new MailDeliveryError(
					`Scaleway TEM rejected the email: ${response.status} ${detail}`
				);
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

/**
 * `MAIL_TRANSPORT` wins when set; otherwise dev logs to the console and a
 * built server sends for real — so production can't quietly fall back to
 * logging sign-in links. Misconfiguration throws, which stops the server.
 */
export function mailerFromEnv(env: MailEnv, options: { dev: boolean }): Mailer {
	const transport = env.MAIL_TRANSPORT || (options.dev ? 'console' : 'scaleway');

	if (transport === 'console') return consoleMailer;
	if (transport !== 'scaleway') {
		throw new Error(`MAIL_TRANSPORT must be "console" or "scaleway", got "${transport}"`);
	}

	const missing = (['SCW_SECRET_KEY', 'SCW_DEFAULT_PROJECT_ID', 'MAIL_FROM'] as const).filter(
		(name) => !env[name]
	);
	if (missing.length > 0) {
		throw new Error(
			`Scaleway mail is enabled but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not set. ` +
				'Set them, or MAIL_TRANSPORT=console to log mails instead.'
		);
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

/**
 * Stable indirection: `auth-config.ts` binds to this at module load, while the
 * server (at start) and tests (per case) still choose the implementation.
 */
export const mailer: Mailer = { send: (mail) => current.send(mail) };

/** Swap the delivery. Called once at server start, and by tests. */
export function setMailer(next: Mailer) {
	current = next;
}

/** A `Mailer` that records mails instead of delivering them. */
export function createFakeMailer() {
	const sent: Mail[] = [];
	return {
		sent,
		mailer: {
			async send(mail) {
				sent.push(mail);
			}
		} satisfies Mailer
	};
}
