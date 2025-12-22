import { test, expect } from '@playwright/test';
import { loginAsManager, mockSupabaseAuth, mockSupabaseApi, mockUsers, mockProducts } from '../../fixtures';

/**
 * Request Creation Tests (Manager View)
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

test.describe('Request Creation', () => {
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

  test.skip('displays product catalog on Products tab', async ({ page }) => {
    // Should be on Products tab by default
    await expect(page.getByText(mockProducts[0].name)).toBeVisible();
    await expect(page.getByText(mockProducts[1].name)).toBeVisible();
  });

  test.skip('shows Request button on each product', async ({ page }) => {
    // Each product should have a Request button
    const requestButtons = page.getByRole('button', { name: 'Request' });
    await expect(requestButtons.first()).toBeVisible();
  });

  test.skip('can open request form by clicking Request button', async ({ page }) => {
    // Click Request button on first product
    const firstProduct = page.locator('.bg-white.rounded-lg.shadow').first();
    await firstProduct.getByRole('button', { name: 'Request' }).click();

    // Should show quantity input and Send Request button
    await expect(page.getByText('Quantity:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Request' })).toBeVisible();
  });

  test.skip('can create request for product', async ({ page }) => {
    let requestCreated = false;
    let requestBody: any = null;

    // Intercept request creation
    await page.route('**supabase.co/rest/v1/requests', async (route) => {
      if (route.request().method() === 'POST') {
        requestCreated = true;
        requestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          json: [{
            ...requestBody,
            id: 'new-request-id',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            product: mockProducts[0],
          }],
        });
      } else {
        await route.continue();
      }
    });

    // Set up dialog handler for alert
    page.on('dialog', dialog => dialog.accept());

    // Click Request on first product
    const firstProduct = page.locator('.bg-white.rounded-lg.shadow').first();
    await firstProduct.getByRole('button', { name: 'Request' }).click();

    // Set quantity
    await page.getByRole('spinbutton').fill('2');

    // Click Send Request
    await page.getByRole('button', { name: 'Send Request' }).click();

    // Verify request was created
    expect(requestCreated).toBe(true);
    expect(requestBody).not.toBeNull();
    expect(requestBody[0].quantity_requested).toBe(2);
  });

  test.skip('Request button is disabled for out of stock products', async ({ page }) => {
    // Mock products with one out of stock
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], quantity: 0 }],
        });
      } else {
        await route.continue();
      }
    });

    // Reload to get new mock data
    await page.reload();
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });

    // The Request button should be disabled
    const requestButton = page.getByRole('button', { name: 'Request' });
    await expect(requestButton).toBeDisabled();
  });

  test.skip('shows Out of Stock for products with zero quantity', async ({ page }) => {
    // Mock products with one out of stock
    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ ...mockProducts[0], quantity: 0 }],
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await expect(page.getByText('Products')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Out of Stock')).toBeVisible();
  });

  test.skip('shows In Stock with quantity for available products', async ({ page }) => {
    await expect(page.getByText('In Stock: 10')).toBeVisible();
  });
});
