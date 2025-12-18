export interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  brand: string | null
  supplier: string | null
  photo_url: string | null
  quantity: number
  qty_per_package: number
  location: string | null
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  sku: string
  barcode?: string
  name: string
  brand?: string
  supplier?: string
  quantity: number
  qty_per_package: number
  location?: string
}

export interface InventoryChange {
  product_id: string
  old_quantity: number
  new_quantity: number
  change_amount: number
  note?: string
}
