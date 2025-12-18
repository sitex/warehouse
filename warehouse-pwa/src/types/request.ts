import type { Product } from './product'

export type RequestStatus = 'pending' | 'ready' | 'delivered'

export interface Request {
  id: string
  product_id: string
  quantity_requested: number
  status: RequestStatus
  requested_by: string | null
  handled_by: string | null
  created_at: string
  updated_at: string
  product?: Product
}

export interface RequestFormData {
  product_id: string
  quantity_requested: number
}
