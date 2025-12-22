import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseApi, mockProducts, mockUsers } from '../../fixtures';

/**
 * Offline Detection Tests
 *
 * Tests the offline indicator UI and app behavior when the device loses connectivity.
 * Uses Playwright's context.setOffline() to simulate network state changes.
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

test.describe('Offline Detection', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page, 'worker');
    await mockSupabaseApi(page);
    await page.route('**supabase.co/rest/v1/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [mockUsers.worker],
      });
    });
  });

  test.skip('shows offline indicator when network is down', async ({ page, context }) => {
    // This test requires authenticated state
    // Expected: When network goes offline, an "Offline" indicator appears
    await page.goto('/warehouse');

    // Wait for products to load first
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    // Simulate going offline
    await context.setOffline(true);

    // Should show offline indicator (typically in header/status bar)
    await expect(page.getByText(/offline/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip('hides offline indicator when back online', async ({ page, context }) => {
    // Expected: Offline indicator disappears when network is restored
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    // Go offline
    await context.setOffline(true);
    await expect(page.getByText(/offline/i)).toBeVisible();

    // Come back online
    await context.setOffline(false);
    await expect(page.getByText(/offline/i)).not.toBeVisible({ timeout: 5000 });
  });

  test.skip('app remains functional when offline with cached data', async ({ page, context }) => {
    // Expected: App continues to show previously loaded data when offline
    await page.goto('/warehouse');

    // Load data first (while online)
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();
    await expect(page.getByText(mockProducts[1].name)).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Products should still be visible from React state/cache
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();
    await expect(page.getByText(mockProducts[1].name)).toBeVisible();
  });

  test.skip('shows offline indicator with sync status', async ({ page, context }) => {
    // Expected: Offline indicator may show pending sync count
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    await context.setOffline(true);

    // Trigger an action that would queue for sync
    const productCard = page.locator('.bg-white, .bg-yellow-50').filter({ hasText: mockProducts[0].name });
    const incrementBtn = productCard.getByRole('button', { name: /\+|add|increase/i });
    if (await incrementBtn.isVisible()) {
      await incrementBtn.click();
    }

    // Should show offline indicator, potentially with pending count
    await expect(page.getByText(/offline/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip('prevents navigation that requires network', async ({ page, context }) => {
    // Expected: Certain actions may be disabled or show warnings when offline
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    await context.setOffline(true);

    // Try to add a new product (if this requires network)
    const addBtn = page.getByRole('button', { name: /add.*product|new.*product|\+/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Either the modal opens with a warning, or the action is queued
      // This behavior depends on the app implementation
    }
  });
});
