// Database types for Supabase
// This matches the expected format for @supabase/supabase-js v2

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
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
        Insert: {
          id?: string
          sku: string
          barcode?: string | null
          name: string
          brand?: string | null
          supplier?: string | null
          photo_url?: string | null
          quantity?: number
          qty_per_package?: number
          location?: string | null
          is_low_stock?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          barcode?: string | null
          name?: string
          brand?: string | null
          supplier?: string | null
          photo_url?: string | null
          quantity?: number
          qty_per_package?: number
          location?: string | null
          is_low_stock?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string | null
          pin_hash: string | null
          role: 'manager' | 'warehouse_worker'
          name: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          pin_hash?: string | null
          role: 'manager' | 'warehouse_worker'
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          pin_hash?: string | null
          role?: 'manager' | 'warehouse_worker'
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      inventory_history: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          old_quantity: number | null
          new_quantity: number | null
          change_amount: number | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          old_quantity?: number | null
          new_quantity?: number | null
          change_amount?: number | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          old_quantity?: number | null
          new_quantity?: number | null
          change_amount?: number | null
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      requests: {
        Row: {
          id: string
          product_id: string
          quantity_requested: number
          status: 'pending' | 'ready' | 'delivered'
          requested_by: string | null
          handled_by: string | null
          group_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity_requested?: number
          status?: 'pending' | 'ready' | 'delivered'
          requested_by?: string | null
          handled_by?: string | null
          group_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity_requested?: number
          status?: 'pending' | 'ready' | 'delivered'
          requested_by?: string | null
          handled_by?: string | null
          group_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
