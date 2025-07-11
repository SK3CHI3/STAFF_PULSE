import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createSupabaseAdmin } from './supabase'

// Server component Supabase client (for use in server components only)
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      getSession: async () => {
        const authToken = cookieStore.get(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`)
        if (!authToken) return { data: { session: null }, error: null }

        try {
          const session = JSON.parse(authToken.value)
          return { data: { session }, error: null }
        } catch {
          return { data: { session: null }, error: null }
        }
      }
    }
  })
}

// Admin client for server-side operations (same as in supabase.ts but isolated)
export const supabaseAdmin = createSupabaseAdmin()
