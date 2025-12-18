import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase init:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, url: supabaseUrl?.substring(0, 30) + '...' })

let supabase: SupabaseClient<Database> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  console.log('Supabase client created')
} else if (import.meta.env.DEV) {
  console.warn('Supabase environment variables not set. Backend features disabled.')
}

export { supabase }
