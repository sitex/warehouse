// Mock data fixtures for E2E tests
// Matches the actual database schema from src/types/database.ts

export const mockUsers = {
  manager: {
    id: 'manager-uuid-1234',
    email: 'manager@test.com',
    role: 'manager' as const,
    name: 'Test Manager',
    pin_hash: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  worker: {
    id: 'worker-uuid-5678',
    email: 'worker@test.com',
    role: 'warehouse_worker' as const,
    name: 'Test Worker',
    // bcrypt hash of '1234'
    pin_hash: '$2a$10$abcdefghijklmnopqrstuv',
    created_at: '2025-01-01T00:00:00Z',
  },
};

export const mockProducts = [
  {
    id: 'product-1',
    sku: 'SKU001',
    barcode: '1234567890123',
    name: 'Test Product 1',
    brand: 'Test Brand',
    supplier: 'Test Supplier',
    quantity: 10,
    qty_per_package: 1,
    location: 'A1',
    is_low_stock: false,
    photo_url: null,
    deleted_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'product-2',
    sku: 'SKU002',
    barcode: '1234567890124',
    name: 'Low Stock Product',
    brand: 'Test Brand',
    supplier: 'Test Supplier',
    quantity: 2,
    qty_per_package: 6,
    location: 'B2',
    is_low_stock: true,
    photo_url: 'https://example.com/photo.jpg',
    deleted_at: null,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
];

export const mockRequests = [
  {
    id: 'request-1',
    product_id: 'product-1',
    quantity_requested: 1,
    status: 'pending' as const,
    requested_by: 'manager-uuid-1234',
    handled_by: null,
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
    product: mockProducts[0],
  },
];
