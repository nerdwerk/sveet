import { describe, expect, it } from 'vitest';
import { consoleMailer, createScalewayMailer, mailerFromEnv, renderMagicLink } from './mail.ts';

describe('mailerFromEnv', () => {
	it('logs in dev and refuses to fall back to the console when built', () => {
		expect(mailerFromEnv({}, { dev: true })).toBe(consoleMailer);
		expect(() => mailerFromEnv({}, { dev: false })).toThrow(/SCW_SECRET_KEY/);
	});

	it('lets MAIL_TRANSPORT override the default', () => {
		expect(mailerFromEnv({ MAIL_TRANSPORT: 'console' }, { dev: false })).toBe(consoleMailer);
		expect(() => mailerFromEnv({ MAIL_TRANSPORT: 'carrier-pigeon' }, { dev: true })).toThrow();
	});
});

describe('renderMagicLink', () => {
	it('escapes the link in HTML and keeps it intact in text', () => {
		const mail = renderMagicLink({ to: 'a@example.com', url: 'https://x.test/?a=1&b="2"' });
		expect(mail.text).toContain('https://x.test/?a=1&b="2"');
		expect(mail.html).toContain('https://x.test/?a=1&amp;b=&quot;2&quot;');
	});
});

describe('createScalewayMailer', () => {
	it('posts the mail with the reply-to header', async () => {
		const calls: { url: string; body: Record<string, unknown> }[] = [];
		const mailer = createScalewayMailer({
			secretKey: 'key',
			projectId: 'project',
			region: 'fr-par',
			from: { email: 'login@mail.example.com' },
			replyTo: 'hello@example.com',
			fetch: (async (url: string, init: RequestInit) => {
				calls.push({ url, body: JSON.parse(String(init.body)) });
				return new Response('{}');
			}) as unknown as typeof fetch
		});
		await mailer.send(renderMagicLink({ to: 'a@example.com', url: 'https://x.test' }));
		expect(calls[0].url).toContain('/regions/fr-par/emails');
		expect(calls[0].body.additional_headers).toEqual([
			{ key: 'Reply-To', value: 'hello@example.com' }
		]);
	});
});
