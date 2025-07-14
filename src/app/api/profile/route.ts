import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  console.log('🔍 [API/Profile] Profile API called')

  try {
    const supabase = await createSupabaseServerClient()
    console.log('🔍 [API/Profile] Supabase client created')

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    console.log('🔍 [API/Profile] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message
    })

    if (userError || !user) {
      console.log('❌ [API/Profile] Authentication failed')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🔍 [API/Profile] Fetching profile for user:', user.id)

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, organization_id, organization:organization_id(id, name, subscription_plan)')
      .eq('id', user.id)
      .single()

    console.log('🔍 [API/Profile] Profile query result:', {
      hasProfile: !!profile,
      profileId: profile?.id,
      hasOrg: !!profile?.organization_id,
      orgId: profile?.organization_id,
      error: profileError?.message
    })

    if (profileError || !profile) {
      console.log('❌ [API/Profile] Profile not found')
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('✅ [API/Profile] Profile found successfully')
    return NextResponse.json({ profile }, { status: 200 })
  } catch (error) {
    console.error('❌ [API/Profile] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}