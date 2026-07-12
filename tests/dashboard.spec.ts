import { test, expect } from '@playwright/test';

test.describe('App Rendering', () => {
  test('should load the main page without crashing', async ({ page }) => {
    await page.goto('/');

    // Verify the body is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify some text exists
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(10);
  });
});
