import { test as base, Page } from '@playwright/test';
import { mockUsers } from './data.fixture';

// Create a mock Supabase session
// Format matches @supabase/supabase-js v2 session structure
const createSession = (user: typeof mockUsers.manager | typeof mockUsers.worker) => ({
  access_token: 'mock-access-token-' + user.id,
  refresh_token: 'mock-refresh-token-' + user.id,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: user.id,
    email: user.email,
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: '2025-01-01T00:00:00Z',
    phone: '',
    confirmed_at: '2025-01-01T00:00:00Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      role: user.role,
      name: user.name,
    },
    identities: [],
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
  },
});

/**
 * Mock Supabase auth API endpoints
 * Intercepts auth-related requests to prevent actual API calls
 * @param userType - 'manager' or 'worker' to determine which session to return
 */
export async function mockSupabaseAuth(page: Page, userType: 'manager' | 'worker' = 'manager') {
  const mockUser = userType === 'worker' ? mockUsers.worker : mockUsers.manager;

  // Intercept Supabase auth endpoints
  // Use pattern that works with Playwright: **supabase.co** (no slashes around domain)
  await page.route('**supabase.co/auth/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Token refresh endpoint
    if (url.includes('/token') && method === 'POST') {
      // Return session for the appropriate user based on stored session
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: createSession(mockUser),
      });
      return;
    }

    // Get user endpoint
    if (url.includes('/user') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: createSession(mockUser).user,
      });
      return;
    }

    // OTP send endpoint
    if (url.includes('/otp') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {},
      });
      return;
    }

    // OTP verify endpoint
    if (url.includes('/verify') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: createSession(mockUser),
      });
      return;
    }

    // Logout endpoint
    if (url.includes('/logout') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {},
      });
      return;
    }

    // Default: continue with the request
    await route.continue();
  });
}

/**
 * Get the Supabase localStorage key for the current project
 * Format: sb-<project-ref>-auth-token
 * The project ref is extracted from the Supabase URL
 */
function getSupabaseStorageKey(): string {
  // Extract project ref from VITE_SUPABASE_URL
  // URL format: https://<project-ref>.supabase.co
  // Key format: sb-<project-ref>-auth-token
  return 'sb-yjuzjlcweseaaugprgnh-auth-token';
}

/**
 * Inject a manager session into localStorage
 * Call this before page.goto() to simulate authenticated state
 */
export async function loginAsManager(page: Page) {
  const session = createSession(mockUsers.manager);
  const storageKey = getSupabaseStorageKey();

  await page.addInitScript(({ key, sessionData }) => {
    localStorage.setItem(key, JSON.stringify(sessionData));
  }, { key: storageKey, sessionData: session });
}

/**
 * Inject a worker session into localStorage
 * Call this before page.goto() to simulate authenticated state
 */
export async function loginAsWorker(page: Page) {
  const session = createSession(mockUsers.worker);
  const storageKey = getSupabaseStorageKey();

  await page.addInitScript(({ key, sessionData }) => {
    localStorage.setItem(key, JSON.stringify(sessionData));
  }, { key: storageKey, sessionData: session });
}

/**
 * Clear auth session from localStorage
 */
export async function logout(page: Page) {
  const storageKey = getSupabaseStorageKey();

  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, storageKey);
}

// Extended test fixtures with pre-authenticated pages
export const test = base.extend<{
  managerPage: Page;
  workerPage: Page;
}>({
  managerPage: async ({ page }, use) => {
    await mockSupabaseAuth(page);
    await loginAsManager(page);
    await use(page);
  },
  workerPage: async ({ page }, use) => {
    await mockSupabaseAuth(page);
    await loginAsWorker(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
