import { test, expect } from '@playwright/test';

test.describe('Login Selection Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays app title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /warehouse inventory/i })).toBeVisible();
  });

  test('displays role selection links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /shop login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /warehouse login/i })).toBeVisible();
  });

  test('shop login link navigates to manager login', async ({ page }) => {
    await page.getByRole('link', { name: /shop login/i }).click();
    await expect(page).toHaveURL('/login/manager');
  });

  test('warehouse login link navigates to worker login', async ({ page }) => {
    await page.getByRole('link', { name: /warehouse login/i }).click();
    await expect(page).toHaveURL('/login/worker');
  });
});
