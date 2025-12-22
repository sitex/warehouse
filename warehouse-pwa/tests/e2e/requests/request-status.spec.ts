import { test, expect } from '@playwright/test';
import { loginAsWorker, mockSupabaseAuth, mockSupabaseApi, mockUsers, mockProducts, mockRequests } from '../../fixtures';

/**
 * Request Status Update Tests (Worker View)
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

test.describe('Request Status Updates', () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth mocks for worker
    await mockSupabaseAuth(page, 'worker');
    await mockSupabaseApi(page);

    // Mock users endpoint
    await page.route('**supabase.co/rest/v1/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [mockUsers.worker],
      });
    });

    // Inject worker session and go to warehouse
    await loginAsWorker(page);
    await page.goto('/warehouse');

    // Wait for page to load
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
  });

  test.skip('displays pending requests in Requests tab', async ({ page }) => {
    // Navigate to Requests tab
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should show pending request
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();
  });

  test.skip('shows Mark Ready button for pending requests', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should show Mark Ready button for pending request
    await expect(page.getByRole('button', { name: 'Mark Ready' })).toBeVisible();
  });

  test.skip('can mark request as ready', async ({ page }) => {
    let statusUpdate: string | null = null;

    // Intercept status update
    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        statusUpdate = body.status;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockRequests[0], status: body.status }],
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: mockRequests,
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Requests' }).click();
    await page.getByRole('button', { name: 'Mark Ready' }).click();

    expect(statusUpdate).toBe('ready');
  });

  test.skip('shows Mark Delivered button for ready requests', async ({ page }) => {
    // Mock a ready request
    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockRequests[0], status: 'ready' }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should show Mark Delivered button for ready request
    await expect(page.getByRole('button', { name: 'Mark Delivered' })).toBeVisible();
  });

  test.skip('can mark request as delivered', async ({ page }) => {
    let statusUpdate: string | null = null;

    // Mock a ready request
    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockRequests[0], status: 'ready' }],
        });
      } else if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        statusUpdate = body.status;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockRequests[0], status: body.status }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Requests' }).click();
    await page.getByRole('button', { name: 'Mark Delivered' }).click();

    expect(statusUpdate).toBe('delivered');
  });

  test.skip('shows Completed text for delivered requests', async ({ page }) => {
    // Mock a delivered request
    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockRequests[0], status: 'delivered' }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should show Completed text
    await expect(page.getByText('Completed')).toBeVisible();
  });

  test.skip('shows product location for requests', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should display location from product data
    await expect(page.getByText('Location: A1')).toBeVisible();
  });

  test.skip('shows product stock status for requests', async ({ page }) => {
    await page.getByRole('button', { name: 'Requests' }).click();

    // Should display stock status
    await expect(page.getByText('In Stock: 10')).toBeVisible();
  });

  test.skip('shows No requests to process when empty', async ({ page }) => {
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

    await page.goto('/warehouse');
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Requests' }).click();

    await expect(page.getByText('No requests to process')).toBeVisible();
  });
});
