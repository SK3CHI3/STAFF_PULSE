import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [Supabase] Missing environment variables:', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  })
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
    `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`
  )
}

console.log('🔗 [Supabase] Initializing client with URL:', supabaseUrl)
console.log('🔗 [Supabase] Environment check passed')

// Client-side Supabase client with multi-tab optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    // Optimize for multi-tab scenarios
    debug: false // Reduce console noise in production
  }
})

// Add session recovery helper
export const recoverSession = async () => {
  try {
    console.log('🔄 [Session Recovery] Attempting to recover session...')
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('🚨 [Session Recovery] Error getting session:', error)
      // Try to refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error('🚨 [Session Recovery] Refresh failed:', refreshError)
        return null
      }
      // Get session again after refresh
      const { data: { session: newSession } } = await supabase.auth.getSession()
      return newSession
    }

    console.log('✅ [Session Recovery] Session recovered successfully')
    return session
  } catch (error) {
    console.error('🚨 [Session Recovery] Exception:', error)
    return null
  }
}
console.log('✅ [Supabase] Client initialized successfully')

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

  // Use the same session configuration as the main client
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token'
    }
  })
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
          subscription_plan: 'free' | 'team' | 'enterprise'
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
