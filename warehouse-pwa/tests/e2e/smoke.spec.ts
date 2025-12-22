import { test, expect } from '@playwright/test';

test('app loads and shows login selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /warehouse/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /shop login/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /warehouse login/i })).toBeVisible();
});
