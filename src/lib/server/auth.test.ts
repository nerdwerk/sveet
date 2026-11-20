import { afterEach, describe, expect, it } from 'vitest';
import { betterAuth } from 'better-auth/minimal';
import { authOptions } from './auth-config.ts';
import { consoleMailer, createFakeMailer, setMailer } from './mail.ts';
import { createTestDb } from './db/test-db.ts';

const origin = 'http://localhost:5173';

function setup() {
	const fake = createFakeMailer();
	setMailer(fake.mailer);
	const auth = betterAuth(
		authOptions(createTestDb(), {
			baseURL: origin,
			secret: 'test-secret-at-least-32-characters-long'
		})
	);
	return { auth, sent: fake.sent };
}

afterEach(() => setMailer(consoleMailer));

describe('magic link sign-in', () => {
	it('mails a single-use link that creates the account and a session', async () => {
		const { auth, sent } = setup();
		await auth.api.signInMagicLink({
			body: { email: 'new@example.com', callbackURL: '/account' },
			headers: new Headers({ origin })
		});

		expect(sent).toHaveLength(1);
		expect(sent[0].to).toBe('new@example.com');
		const link = sent[0].text.match(/https?:\/\/\S+/)?.[0];
		expect(link).toContain('/api/auth/magic-link/verify');

		const first = await auth.handler(new Request(link!));
		expect(first.headers.get('location')).toBe(`${origin}/account`);
		expect(first.headers.get('set-cookie')).toContain('better-auth.session_token');

		const replay = await auth.handler(new Request(link!));
		expect(replay.headers.get('set-cookie') ?? '').not.toContain('better-auth.session_token=');
	});

	it('refuses callback URLs on other origins over HTTP', async () => {
		const { auth, sent } = setup();
		const response = await auth.handler(
			new Request(`${origin}/api/auth/sign-in/magic-link`, {
				method: 'POST',
				headers: { origin, 'content-type': 'application/json' },
				body: JSON.stringify({
					email: 'new@example.com',
					callbackURL: 'https://evil.example/steal'
				})
			})
		);
		expect(response.status).toBe(403);
		expect(sent).toHaveLength(0);
	});
});
