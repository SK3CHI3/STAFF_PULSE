import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
    `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`
  )
}

console.log('🔗 [Supabase] Initializing client with URL:', supabaseUrl)

// Client-side Supabase client (for use in client components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component Supabase client (for auth helpers)
export const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.\n' +
      `NEXT_PUBLIC_SUPABASE_URL: ${url ? 'SET' : 'MISSING'}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? 'SET' : 'MISSING'}`
    )
  }
  return createClient(url, key)
}

// Admin client with service role key (for server-side operations only)
// This should only be used in API routes or server-side code
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client. Please check your .env.local file.\n' +
      `NEXT_PUBLIC_SUPABASE_URL: ${url ? 'SET' : 'MISSING'}\n` +
      `SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'SET' : 'MISSING'}`
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types (we'll expand this as we create tables)
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string
          phone?: string
          industry?: string
          employee_count: number
          subscription_plan: 'free' | 'starter' | 'team' | 'growth' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string
          subscription_end_date?: string
          monthly_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string
          industry?: string
          employee_count?: number
          subscription_plan?: 'free' | 'starter' | 'team' | 'growth' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string
          subscription_end_date?: string
          monthly_price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          industry?: string
          employee_count?: number
          subscription_plan?: 'free' | 'starter' | 'team' | 'growth' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string
          subscription_end_date?: string
          monthly_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      // We'll add more tables here as we create them
    }
  }
}
