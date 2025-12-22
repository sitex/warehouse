import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseApi, mockUsers } from '../../fixtures';

test.describe('Worker Login', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);
    await mockSupabaseApi(page);

    // Mock the users endpoint to return a worker for the login page
    await page.route('**/rest/v1/users**', async (route) => {
      if (route.request().url().includes('role=eq.warehouse_worker')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [mockUsers.worker],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/login/worker');
  });

  test('displays warehouse login title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /warehouse login/i })).toBeVisible();
  });

  test('displays welcome message with user name', async ({ page }) => {
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByText(mockUsers.worker.name)).toBeVisible();
  });

  test('displays send PIN button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /send pin to email/i })).toBeVisible();
  });

  test('shows PIN input after clicking send PIN', async ({ page }) => {
    await page.getByRole('button', { name: /send pin to email/i }).click();

    // Should show PIN input
    await expect(page.getByText(/enter pin from email/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows success message after sending PIN', async ({ page }) => {
    await page.getByRole('button', { name: /send pin to email/i }).click();

    await expect(page.getByText(/pin sent to your email/i)).toBeVisible({ timeout: 5000 });
  });

  test('login button is enabled with valid PIN', async ({ page }) => {
    // Send PIN
    await page.getByRole('button', { name: /send pin to email/i }).click();

    // Wait for PIN input to appear
    await expect(page.getByText(/enter pin from email/i)).toBeVisible({ timeout: 5000 });

    // Login button should be disabled without PIN
    await expect(page.getByRole('button', { name: /^login$/i })).toBeDisabled();

    // Enter PIN (6+ digits required)
    await page.getByRole('textbox').fill('123456');

    // Login button should now be enabled
    await expect(page.getByRole('button', { name: /^login$/i })).toBeEnabled();
  });

  test('shows error for invalid PIN', async ({ page }) => {
    // Mock verify to fail
    await page.route('**/auth/v1/verify', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        json: { error: 'Invalid OTP' },
      });
    });

    // Send PIN
    await page.getByRole('button', { name: /send pin to email/i }).click();
    await expect(page.getByText(/enter pin from email/i)).toBeVisible({ timeout: 5000 });

    // Enter wrong PIN
    await page.getByRole('textbox').fill('000000');
    await page.getByRole('button', { name: /^login$/i }).click();

    // Should show error
    await expect(page.getByText(/invalid pin/i)).toBeVisible({ timeout: 5000 });
  });

  test('back button returns to PIN send state', async ({ page }) => {
    // Go to PIN input state
    await page.getByRole('button', { name: /send pin to email/i }).click();
    await expect(page.getByText(/enter pin from email/i)).toBeVisible({ timeout: 5000 });

    // Click back
    await page.getByRole('button', { name: /back/i }).click();

    // Should show send PIN button again
    await expect(page.getByRole('button', { name: /send pin to email/i })).toBeVisible();
  });

  test('back to login options link works', async ({ page }) => {
    await page.getByRole('link', { name: /back to login options/i }).click();
    await expect(page).toHaveURL('/');
  });
});
