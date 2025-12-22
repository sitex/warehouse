import { Page } from '@playwright/test';
import { mockProducts, mockRequests, mockUsers } from './data.fixture';

/**
 * Mock all Supabase REST API endpoints
 * This intercepts PostgREST calls to return mock data
 */
export async function mockSupabaseApi(page: Page) {
  // Mock products endpoint
  // Use pattern that works with Playwright: **supabase.co** (no slashes around domain)
  await page.route('**supabase.co/rest/v1/products**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      // Check if it's a single product query (has eq filter)
      if (url.includes('id=eq.')) {
        const idMatch = url.match(/id=eq\.([^&]+)/);
        if (idMatch) {
          const product = mockProducts.find(p => p.id === idMatch[1]);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: product ? [product] : [],
          });
          return;
        }
      }
      // Return all products
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockProducts,
      });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      const newProduct = {
        ...body,
        id: 'new-product-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_low_stock: false,
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        json: [newProduct],
      });
    } else if (method === 'PATCH') {
      const body = route.request().postDataJSON();
      // Extract ID from URL if present
      const idMatch = url.match(/id=eq\.([^&]+)/);
      const id = idMatch ? idMatch[1] : 'product-1';
      const existingProduct = mockProducts.find(p => p.id === id) || mockProducts[0];
      const updatedProduct = {
        ...existingProduct,
        ...body,
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [updatedProduct],
      });
    } else if (method === 'DELETE') {
      await route.fulfill({
        status: 204,
        body: '',
      });
    } else {
      await route.continue();
    }
  });

  // Mock requests endpoint
  await page.route('**supabase.co/rest/v1/requests**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      // Check for select with product join
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockRequests,
      });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      // Handle array or single insert
      const insertData = Array.isArray(body) ? body[0] : body;
      const newRequest = {
        ...insertData,
        id: 'new-request-' + Date.now(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: mockProducts.find(p => p.id === insertData.product_id) || mockProducts[0],
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        json: [newRequest],
      });
    } else if (method === 'PATCH') {
      const body = route.request().postDataJSON();
      const idMatch = url.match(/id=eq\.([^&]+)/);
      const id = idMatch ? idMatch[1] : 'request-1';
      const existingRequest = mockRequests.find(r => r.id === id) || mockRequests[0];
      const updatedRequest = {
        ...existingRequest,
        ...body,
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [updatedRequest],
      });
    } else if (method === 'DELETE') {
      await route.fulfill({
        status: 204,
        body: '',
      });
    } else {
      await route.continue();
    }
  });

  // Mock users endpoint (for profile lookup)
  await page.route('**supabase.co/rest/v1/users**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      // Check for specific user query
      if (url.includes('id=eq.')) {
        const idMatch = url.match(/id=eq\.([^&]+)/);
        if (idMatch) {
          if (idMatch[1] === mockUsers.manager.id) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              json: [mockUsers.manager],  // PostgREST returns array
            });
            return;
          } else if (idMatch[1] === mockUsers.worker.id) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              json: [mockUsers.worker],  // PostgREST returns array
            });
            return;
          }
        }
      }
      // Check for role filter (used by PIN auth)
      if (url.includes('role=eq.warehouse_worker')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [mockUsers.worker],
        });
        return;
      }
      // Default: return all users
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [mockUsers.manager, mockUsers.worker],
      });
    } else {
      await route.continue();
    }
  });

  // Mock inventory_history endpoint
  await page.route('**supabase.co/rest/v1/inventory_history**', async (route) => {
    const method = route.request().method();

    if (method === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        json: [{
          ...body,
          id: 'history-' + Date.now(),
          created_at: new Date().toISOString(),
        }],
      });
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    } else {
      await route.continue();
    }
  });

  // Mock storage endpoint (for photo uploads)
  await page.route('**supabase.co/storage/v1/object/**', async (route) => {
    const method = route.request().method();

    if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          Key: 'product-photos/test-photo-' + Date.now() + '.jpg',
          Id: 'photo-id-' + Date.now(),
        },
      });
    } else if (method === 'GET') {
      // Return a placeholder image for photo URLs
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
      });
    } else {
      await route.continue();
    }
  });

  // Mock realtime WebSocket - abort gracefully
  // Tests don't need realtime updates, so we prevent the connection
  await page.route('**supabase.co/realtime/**', async (route) => {
    await route.abort();
  });
}

/**
 * Mock PIN authentication flow
 * Used for worker login via PIN code
 */
export async function mockPinAuth(page: Page, validPin = '1234') {
  // The PIN auth fetches workers and compares PIN hashes
  // We mock the users endpoint to return a worker with a known PIN hash
  await page.route('**supabase.co/rest/v1/users**', async (route, request) => {
    const url = request.url();
    const method = request.method();

    // PIN auth fetches all warehouse workers
    if (method === 'GET' && url.includes('role=eq.warehouse_worker')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [{
          ...mockUsers.worker,
          // Note: In tests, bcrypt comparison will use this hash
          // The actual PIN validation happens in the auth context
        }],
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Create a custom API mock handler for specific test scenarios
 * Use this to override default mock responses for specific tests
 */
export function createMockHandler(options: {
  products?: typeof mockProducts;
  requests?: typeof mockRequests;
}) {
  return async function mockCustomApi(page: Page) {
    const { products = mockProducts, requests = mockRequests } = options;

    await page.route('**supabase.co/rest/v1/products**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: products,
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**supabase.co/rest/v1/requests**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: requests,
        });
      } else {
        await route.continue();
      }
    });
  };
}
