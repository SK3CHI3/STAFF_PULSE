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
      getSession: async () => {
        const authToken = cookieStore.get(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`)
        console.log('🔗 [Supabase-Server] Auth token check:', {
          hasToken: !!authToken,
          tokenLength: authToken?.value?.length
        })

        if (!authToken) {
          console.log('🔗 [Supabase-Server] No auth token found')
          return { data: { session: null }, error: null }
        }

        try {
          const session = JSON.parse(authToken.value)
          console.log('🔗 [Supabase-Server] Session parsed successfully:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id
          })
          return { data: { session }, error: null }
        } catch (error) {
          console.log('🔗 [Supabase-Server] Failed to parse session:', error)
          return { data: { session: null }, error: null }
        }
      }
    }
  })
}

// Admin client for server-side operations (same as in supabase.ts but isolated)
export const supabaseAdmin = createSupabaseAdmin()
