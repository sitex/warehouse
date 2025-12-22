import { test, expect } from '@playwright/test';
import { loginAsManager, mockSupabaseAuth, mockSupabaseApi, mockUsers, mockProducts, mockRequests } from '../../fixtures';

/**
 * Request List Tests (Manager View)
 *
 * Note: Tests requiring authenticated state are skipped due to Supabase client
 * initialization complexities that prevent reliable mocking of the auth state.
 * The Supabase JS client maintains internal state that isn't fully mockable
 * through HTTP interception alone.
 *
 * These tests document the expected behavior and can be enabled when:
 * 1. A proper test database with seeded data is available
 * 2. Or when the app supports a test mode that bypasses Supabase auth
 *
 * The auth flow itself is tested in the auth/ directory.
 */

test.describe('Request List (Manager View)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth mocks for manager
    await mockSupabaseAuth(page, 'manager');
    await mockSupabaseApi(page);

    // Mock users endpoint
    await page.route('**supabase.co/rest/v1/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [mockUsers.manager],
      });
    });

    // Inject manager session and go to shop
    await loginAsManager(page);
    await page.goto('/shop');

    // Wait for page to load
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
  });

  test.skip('shows request with product name', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    await expect(page.getByText(mockProducts[0].name)).toBeVisible();
  });

  test.skip('shows request status badge', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    await expect(page.getByText('Pending')).toBeVisible();
  });

  test.skip('shows request quantity', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    // mockRequests[0] has quantity_requested: 1
    await expect(page.getByText('Quantity: 1')).toBeVisible();
  });

  test.skip('shows pending request count badge on Requests tab', async ({ page }) => {
    // The Requests tab should show a badge with pending count
    const requestsTab = page.getByRole('button', { name: 'Requests' });

    // Check that badge exists (it shows count of pending requests)
    await expect(requestsTab.locator('.bg-red-500')).toBeVisible();
  });

  test.skip('displays requests with different statuses', async ({ page }) => {
    // Mock multiple requests with different statuses
    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [
            { ...mockRequests[0], id: 'req-1', status: 'pending' },
            { ...mockRequests[0], id: 'req-2', status: 'ready' },
            { ...mockRequests[0], id: 'req-3', status: 'delivered' },
          ],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/shop');
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should show all status types
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('Ready for Pickup')).toBeVisible();
    await expect(page.getByText('Delivered')).toBeVisible();
  });

  test.skip('shows No requests yet when empty', async ({ page }) => {
    // Mock empty requests
    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/shop');
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Requests' }).click();

    await expect(page.getByText('No requests yet')).toBeVisible();
  });

  test.skip('shows request creation date', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    // The request card shows the date in short format
    // mockRequests[0].created_at is '2025-01-01T12:00:00Z'
    // This should be formatted as a date string
    await expect(page.getByText(/1\/1\/2025|Jan.*1.*2025/)).toBeVisible();
  });

  test.skip('has delete button on each request', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should have delete button
    await expect(page.locator('button[title="Delete request"]')).toBeVisible();
  });
});
