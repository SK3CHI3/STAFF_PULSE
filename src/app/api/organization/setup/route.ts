import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { name, industry, size, phone, address, website } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Check if user already has an organization
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (existingProfile?.organization_id) {
      return NextResponse.json({ error: 'User already has an organization' }, { status: 400 })
    }

    // Create the organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        industry: industry || null,
        size: size || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Update the user's profile to link to the organization and set as HR admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        organization_id: organization.id,
        role: 'hr_admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Try to clean up the organization if profile update fails
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id)
      return NextResponse.json({ error: 'Failed to link user to organization' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        industry: organization.industry,
        size: organization.size
      }
    })

  } catch (error) {
    console.error('Organization setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
