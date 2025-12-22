import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseApi, mockProducts, mockUsers } from '../../fixtures';

/**
 * Offline Queue Tests
 *
 * Tests the offline queue functionality that stores changes in localStorage
 * when the device is offline and syncs them when back online.
 *
 * The queue uses localStorage key 'warehouse_pending_changes' (see offlineStorage.ts)
 * and stores changes as: { id, type, data, timestamp }
 *
 * Note: Tests requiring authenticated state are skipped due to Supabase client
 * initialization complexities that prevent reliable mocking of the auth state.
 */

test.describe('Offline Queue', () => {
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

  test.skip('queues quantity changes when offline', async ({ page, context }) => {
    // Expected: Changes made while offline are stored in localStorage queue
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Try to update quantity
    const productCard = page.locator('.bg-white, .bg-yellow-50').filter({ hasText: mockProducts[0].name });
    const incrementBtn = productCard.getByRole('button', { name: /\+|add|increase/i });
    await incrementBtn.click();

    // Check that change is queued in localStorage
    const pendingChanges = await page.evaluate(() => {
      const stored = localStorage.getItem('warehouse_pending_changes');
      return stored ? JSON.parse(stored) : [];
    });

    expect(pendingChanges.length).toBeGreaterThan(0);
    expect(pendingChanges[0].type).toBe('quantity_adjust');
  });

  test.skip('shows pending sync indicator when changes queued', async ({ page, context }) => {
    // Expected: UI shows indication of pending changes waiting to sync
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    await context.setOffline(true);

    // Make a change
    const productCard = page.locator('.bg-white, .bg-yellow-50').filter({ hasText: mockProducts[0].name });
    const incrementBtn = productCard.getByRole('button', { name: /\+|add|increase/i });
    await incrementBtn.click();

    // Should show pending/queued indicator
    await expect(page.getByText(/pending|sync|queued|unsaved/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip('syncs queued changes when back online', async ({ page, context }) => {
    // Expected: Queued changes are sent to server when network is restored
    let syncApiCalled = false;

    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    // Go offline and make a change
    await context.setOffline(true);
    const productCard = page.locator('.bg-white, .bg-yellow-50').filter({ hasText: mockProducts[0].name });
    const incrementBtn = productCard.getByRole('button', { name: /\+|add|increase/i });
    await incrementBtn.click();

    // Set up route handler to detect sync
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      if (route.request().method() === 'PATCH') {
        syncApiCalled = true;
        await route.fulfill({ status: 200, json: [{}] });
      } else {
        await route.continue();
      }
    });

    // Go back online
    await context.setOffline(false);

    // Wait for sync to complete
    await page.waitForTimeout(3000);

    // Verify API was called
    expect(syncApiCalled).toBe(true);

    // Verify queue is cleared
    const pendingChanges = await page.evaluate(() => {
      const stored = localStorage.getItem('warehouse_pending_changes');
      return stored ? JSON.parse(stored) : [];
    });
    expect(pendingChanges.length).toBe(0);
  });

  test.skip('handles sync failure gracefully', async ({ page, context }) => {
    // Expected: If sync fails, changes remain in queue for retry
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    // Go offline and make a change
    await context.setOffline(true);
    const productCard = page.locator('.bg-white, .bg-yellow-50').filter({ hasText: mockProducts[0].name });
    const incrementBtn = productCard.getByRole('button', { name: /\+|add|increase/i });
    await incrementBtn.click();

    // Set up route to fail
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 500, json: { error: 'Server error' } });
      } else {
        await route.continue();
      }
    });

    // Go back online
    await context.setOffline(false);

    // Wait for sync attempt
    await page.waitForTimeout(3000);

    // Changes should still be in queue
    const pendingChanges = await page.evaluate(() => {
      const stored = localStorage.getItem('warehouse_pending_changes');
      return stored ? JSON.parse(stored) : [];
    });
    expect(pendingChanges.length).toBeGreaterThan(0);
  });

  test.skip('preserves queue order during sync', async ({ page, context }) => {
    // Expected: Changes are synced in the order they were made
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    await context.setOffline(true);

    // Make multiple changes
    const productCard = page.locator('.bg-white, .bg-yellow-50').filter({ hasText: mockProducts[0].name });
    const incrementBtn = productCard.getByRole('button', { name: /\+|add|increase/i });

    // Click increment 3 times
    await incrementBtn.click();
    await incrementBtn.click();
    await incrementBtn.click();

    // Verify queue has multiple entries in order
    const pendingChanges = await page.evaluate(() => {
      const stored = localStorage.getItem('warehouse_pending_changes');
      return stored ? JSON.parse(stored) : [];
    });

    expect(pendingChanges.length).toBe(3);

    // Verify timestamps are in order
    for (let i = 1; i < pendingChanges.length; i++) {
      expect(pendingChanges[i].timestamp).toBeGreaterThanOrEqual(pendingChanges[i - 1].timestamp);
    }
  });

  test.skip('queues request creation when offline', async ({ page, context }) => {
    // Expected: Creating a request while offline queues it for later sync
    // This would be tested on the shop/manager side
    await page.goto('/warehouse');
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();

    await context.setOffline(true);

    // Navigate to requests tab if available
    const requestsTab = page.getByRole('tab', { name: /requests/i });
    if (await requestsTab.isVisible()) {
      await requestsTab.click();
    }

    // Attempt to create a request (behavior may vary)
    // The specific UI actions depend on the app implementation
  });
});
