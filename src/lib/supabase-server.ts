import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createSupabaseAdmin } from './supabase'

// Server component Supabase client (for use in server components only)
export const createSupabaseServerClient = async () => {
  console.log('🔗 [Supabase-Server] Creating server client...')

  const cookieStore = await cookies()
  console.log('🔗 [Supabase-Server] Cookie store obtained')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  console.log('🔗 [Supabase-Server] Environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl
  })

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Admin client for server-side operations (same as in supabase.ts but isolated)
export const supabaseAdmin = createSupabaseAdmin()
