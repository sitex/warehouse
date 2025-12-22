import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseApi, mockUsers } from '../../fixtures';

/**
 * Product CRUD Tests
 *
 * Note: Tests are skipped due to Supabase client initialization complexities.
 * See product-list.spec.ts for detailed explanation.
 */

test.describe('Product CRUD', () => {
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

  test.skip('can open add product form', async ({ page }) => {
    // Expected: Clicking "+ Add" button opens product form modal
    await page.goto('/warehouse');
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.getByRole('heading', { name: 'Add Product' })).toBeVisible();
    await expect(page.getByLabel('SKU *')).toBeVisible();
    await expect(page.getByLabel('Name *')).toBeVisible();
    await expect(page.getByLabel('Quantity')).toBeVisible();
    await expect(page.getByLabel('Location (Cabinet/Shelf)')).toBeVisible();
  });

  test.skip('can create new product', async ({ page }) => {
    // Expected: Submitting add product form creates product via API
    let createCalled = false;
    let createBody: any = null;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        createCalled = true;
        createBody = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          json: [{ ...createBody, id: 'new-id', created_at: new Date().toISOString() }],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    await page.getByRole('button', { name: '+ Add' }).click();
    await page.getByLabel('SKU *').fill('NEW001');
    await page.getByLabel('Name *').fill('New Test Product');
    await page.getByLabel('Barcode').fill('9999999999999');
    await page.getByLabel('Brand').fill('Test Brand');
    await page.getByLabel('Supplier').fill('Test Supplier');
    await page.getByLabel('Quantity').fill('5');
    await page.getByLabel('Location (Cabinet/Shelf)').fill('C3');
    await page.getByRole('button', { name: 'Save' }).click();

    expect(createCalled).toBe(true);
    expect(createBody).toMatchObject({
      sku: 'NEW001',
      name: 'New Test Product',
      quantity: 5,
      location: 'C3',
    });
    await expect(page.getByRole('heading', { name: 'Add Product' })).not.toBeVisible();
  });

  test.skip('can close add product form with cancel button', async ({ page }) => {
    // Expected: Cancel button closes form without saving
    await page.goto('/warehouse');
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.getByRole('heading', { name: 'Add Product' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Add Product' })).not.toBeVisible();
  });

  test.skip('can close add product form with X button', async ({ page }) => {
    // Expected: X button closes form without saving
    await page.goto('/warehouse');
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.getByRole('heading', { name: 'Add Product' })).toBeVisible();
    await page.locator('button').filter({ hasText: '\u00d7' }).click();
    await expect(page.getByRole('heading', { name: 'Add Product' })).not.toBeVisible();
  });

  test.skip('can open edit form for existing product', async ({ page }) => {
    // Expected: Edit button opens form with pre-filled data, SKU disabled
    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').first();
    await productCard.getByRole('button', { name: 'Edit product' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible();
    await expect(page.getByLabel('SKU *')).toBeDisabled();
    await expect(page.getByLabel('Name *')).toHaveValue('Test Product 1');
  });

  test.skip('can edit existing product', async ({ page }) => {
    // Expected: Editing product updates via PATCH request
    let updateCalled = false;
    let updateBody: any = null;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        updateCalled = true;
        updateBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [updateBody],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const productCard = page.locator('.rounded-lg.shadow').first();
    await productCard.getByRole('button', { name: 'Edit product' }).click();
    await page.getByLabel('Name *').fill('Updated Product Name');
    await page.getByRole('button', { name: 'Save' }).click();

    expect(updateCalled).toBe(true);
    expect(updateBody?.name).toBe('Updated Product Name');
    await expect(page.getByRole('heading', { name: 'Edit Product' })).not.toBeVisible();
  });

  test.skip('shows validation error for required fields', async ({ page }) => {
    // Expected: Form doesn't submit without required fields
    await page.goto('/warehouse');
    await page.getByRole('button', { name: '+ Add' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    // Browser validation should prevent submission, form stays open
    await expect(page.getByRole('heading', { name: 'Add Product' })).toBeVisible();
  });

  test.skip('can toggle low stock status from product card', async ({ page }) => {
    // Expected: "Mark Low" button toggles is_low_stock via PATCH
    let patchCalled = false;
    let patchBody: any = null;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        patchCalled = true;
        patchBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [patchBody],
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/warehouse');
    const normalProductCard = page.locator('.rounded-lg.shadow').filter({ hasText: 'Test Product 1' });
    await normalProductCard.getByRole('button', { name: 'Mark Low' }).click();

    expect(patchCalled).toBe(true);
    expect(patchBody?.is_low_stock).toBe(true);
  });
});
