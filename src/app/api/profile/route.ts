import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, organization_id, organization:organization_id(id, name, subscription_plan)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 })
  }

  return new Response(JSON.stringify({ profile }), { status: 200 })
} 