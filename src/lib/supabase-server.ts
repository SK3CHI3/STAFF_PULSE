import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createSupabaseAdmin } from './supabase'

// Server component Supabase client (for use in server components only)
export const createSupabaseServerClient = () => createServerComponentClient({ cookies })

// Admin client for server-side operations (same as in supabase.ts but isolated)
export const supabaseAdmin = createSupabaseAdmin()
