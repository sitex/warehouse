import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseApi, mockProducts, mockUsers } from '../../fixtures';

/**
 * Quantity Adjustment Tests
 *
 * Note: Tests are skipped due to Supabase client initialization complexities.
 * See product-list.spec.ts for detailed explanation.
 */

test.describe('Quantity Adjustments', () => {
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

  test.skip('can increment quantity', async ({ page }) => {
    // Expected: + button increases quantity via PATCH
    let patchBody: any = null;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        patchBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], ...patchBody }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });
    await productCard.getByRole('button', { name: '+' }).click();

    expect(patchBody?.quantity).toBe(mockProducts[0].quantity + 1);
  });

  test.skip('can decrement quantity', async ({ page }) => {
    // Expected: - button decreases quantity via PATCH
    let patchBody: any = null;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        patchBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], ...patchBody }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });
    await productCard.getByRole('button', { name: '-' }).click();

    expect(patchBody?.quantity).toBe(mockProducts[0].quantity - 1);
  });

  test.skip('decrement button is disabled at zero quantity', async ({ page }) => {
    // Expected: Cannot decrement below zero
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], quantity: 0 }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    await page.reload();

    const productCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });
    const decrementBtn = productCard.getByRole('button', { name: '-' });
    await expect(decrementBtn).toBeDisabled();
  });

  test.skip('quantity display updates optimistically', async ({ page }) => {
    // Expected: UI updates immediately before API response
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        await new Promise(resolve => setTimeout(resolve, 500));
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], ...body }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });

    await expect(productCard.getByText(mockProducts[0].quantity.toString())).toBeVisible();
    await productCard.getByRole('button', { name: '+' }).click();
    // Should show updated quantity immediately (optimistic)
    await expect(productCard.getByText((mockProducts[0].quantity + 1).toString())).toBeVisible();
  });

  test.skip('buttons are disabled during quantity adjustment', async ({ page }) => {
    // Expected: Prevent rapid-fire clicks during API call
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], ...body }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });

    await productCard.getByRole('button', { name: '+' }).click();
    await expect(productCard.getByRole('button', { name: '+' })).toBeDisabled();
    await expect(productCard.getByRole('button', { name: '-' })).toBeDisabled();
  });

  test.skip('multiple quantity adjustments work correctly', async ({ page }) => {
    // Expected: Sequential adjustments accumulate correctly
    let adjustmentCount = 0;
    let lastQuantity = mockProducts[0].quantity;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        adjustmentCount++;
        const body = route.request().postDataJSON();
        lastQuantity = body.quantity;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], quantity: body.quantity }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });

    await productCard.getByRole('button', { name: '+' }).click();
    await expect(productCard.getByRole('button', { name: '+' })).toBeEnabled();

    await productCard.getByRole('button', { name: '+' }).click();
    await expect(productCard.getByRole('button', { name: '+' })).toBeEnabled();

    expect(adjustmentCount).toBe(2);
    expect(lastQuantity).toBe(mockProducts[0].quantity + 2);
  });
});
