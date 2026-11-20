import { SEED_NOTES, SEED_USERS } from '../../src/lib/server/db/seed.ts';
import { expect, signIn, test } from './fixtures.ts';

test('the landing page links to sign-in', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Sign in with a magic link' }).click();
	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('the account page needs a session', async ({ page }) => {
	await page.goto('/account');
	await expect(page).toHaveURL(/\/login$/);
});

test('a seeded user signs in, sees their notes, adds one and signs out', async ({ page, app }) => {
	await signIn(page, app, SEED_USERS.ada.email);
	await expect(page.getByText(SEED_NOTES[0].body)).toBeVisible();
	await expect(page.getByText(SEED_NOTES[1].body)).toHaveCount(0);

	await page.getByLabel('New note').fill('Written by Playwright');
	await page.getByRole('button', { name: 'Add note' }).click();
	await expect(page.getByText('Written by Playwright')).toBeVisible();
	await expect(page.getByLabel('New note')).toHaveValue('');

	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
});

test('a new address gets an account on first sign-in', async ({ page, app }) => {
	await signIn(page, app, 'newcomer@example.com');
	await expect(page.getByText('No notes yet.')).toBeVisible();
});
