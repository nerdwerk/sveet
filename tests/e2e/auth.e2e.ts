import { SEED_USERS } from '../../src/lib/server/db/seed.ts';
import { expect, signIn, test } from './fixtures.ts';

test('the account page needs a session', async ({ page }) => {
	await page.goto('/account');
	await expect(page).toHaveURL(/\/login$/);
});

test('a seeded user signs in and out', async ({ page, app }) => {
	await signIn(page, app, SEED_USERS.ada.email);
	await expect(page.getByRole('main').getByText(SEED_USERS.ada.email)).toBeVisible();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
});

test('a new address gets an account on first sign-in', async ({ page, app }) => {
	await signIn(page, app, 'newcomer@example.com');
	await expect(page.getByRole('main').getByText('newcomer@example.com')).toBeVisible();
});
