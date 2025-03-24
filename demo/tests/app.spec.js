import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('about page has expected h1', async ({ page }) => {
	await page.goto('/about');
	expect(await page.textContent('h1')).toBe('About this app');
});

test('submits sverdle guess', async ({ page }) => {
	await page.goto('/sverdle');
	// wait for the sveltekit to run hydration
	// Otherwise the test will fail
	// await page.waitForTimeout(2000);
	await page.waitForLoadState('domcontentloaded');
	await page.waitForLoadState('networkidle');

	const input = page.locator('input[name=guess]').first();
	await expect(input).not.toBeDisabled({ timeout: 20000 });
	await input.focus();

	await page.keyboard.type('AZURE');
	await page.keyboard.press('Enter');

	await expect(input).toHaveValue('a');
	await expect(input).toBeDisabled({ timeout: 20000 });
});

test('can call custom API azure function', async ({ request }) => {
	const response = await request.post('/api/HelloWorld', {
		data: {
			name: 'Geoff'
		}
	});
	expect(response.ok()).toBeTruthy();
});
