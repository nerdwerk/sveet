import { describe, expect, it } from 'vitest';
import { consoleMailer, createScalewayMailer, MailDeliveryError, mailerFromEnv } from './mail.ts';

describe('mailerFromEnv', () => {
	it('logs in dev but never silently in production', () => {
		expect(mailerFromEnv({}, { dev: true })).toBe(consoleMailer);
		expect(() => mailerFromEnv({}, { dev: false })).toThrow(/SCW_SECRET_KEY/);
		expect(mailerFromEnv({ MAIL_TRANSPORT: 'console' }, { dev: false })).toBe(consoleMailer);
	});
});

describe('createScalewayMailer', () => {
	it('turns a rejected send into MailDeliveryError', async () => {
		const mailer = createScalewayMailer({
			secretKey: 'key',
			projectId: 'project',
			region: 'fr-par',
			from: { email: 'login@mail.example.com' },
			fetch: (async () =>
				new Response('domain not verified', { status: 403 })) as unknown as typeof fetch
		});
		await expect(mailer.send({ to: 'a@example.com', subject: 's', text: 't' })).rejects.toThrow(
			MailDeliveryError
		);
	});
});
