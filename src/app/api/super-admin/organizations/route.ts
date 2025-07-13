import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

// Get all organizations for super admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabaseAdmin = createSupabaseAdmin()
    let query = supabaseAdmin
      .from('organizations')
      .select(`
        *,
        employees(count),
        mood_checkins(count),
        profiles(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%, email.ilike.%${search}%`)
    }

    if (status && status !== 'all') {
      query = query.eq('subscription_status', status)
    }

    const { data: organizations, error } = await query

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    // Process organizations with additional stats
    const processedOrgs = await Promise.all(
      (organizations || []).map(async (org) => {
        // Get the most recent login for this organization
        const { data: lastLoginData } = await supabaseAdmin
          .from('profiles')
          .select('last_login')
          .eq('organization_id', org.id)
          .order('last_login', { ascending: false, nullsLast: true })
          .limit(1)
          .single()

        return {
          ...org,
          employees_count: org.employees?.[0]?.count || 0,
          responses_count: org.mood_checkins?.[0]?.count || 0,
          users_count: org.profiles?.[0]?.count || 0,
          last_activity: lastLoginData?.last_login || org.updated_at
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      organizations: processedOrgs 
    })

  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      billing_email,
      subscription_status = 'trial',
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_password
    } = body

    if (!name || !email || !admin_email || !admin_password) {
      return NextResponse.json({
        error: 'Name, email, admin email, and admin password are required'
      }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()
    // Start transaction
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        email,
        phone,
        address,
        billing_email: billing_email || email,
        subscription_status
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Create admin user for the organization
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true
    })

    if (authError) {
      // Rollback organization creation
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id)
      console.error('Error creating admin user:', authError)
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
    }

    // Create profile for admin user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        organization_id: organization.id,
        first_name: admin_first_name,
        last_name: admin_last_name,
        email: admin_email,
        role: 'hr_admin'
      })

    if (profileError) {
      // Rollback user and organization creation
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id)
      console.error('Error creating admin profile:', profileError)
      return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      organization: {
        ...organization,
        admin_user_id: authUser.user.id
      }
    })

  } catch (error) {
    console.error('Create organization API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update organization
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      organizationId,
      name, 
      email, 
      phone, 
      address, 
      billing_email,
      subscription_status
    } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (billing_email !== undefined) updateData.billing_email = billing_email
    if (subscription_status !== undefined) updateData.subscription_status = subscription_status

    const supabaseAdmin = createSupabaseAdmin()
    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      organization 
    })

  } catch (error) {
    console.error('Update organization API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update organization status (suspend/activate)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const action = searchParams.get('action') || 'suspend'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Super admin can suspend/activate organizations, not delete them
    const newStatus = action === 'suspend' ? 'suspended' : 'active'

    const supabaseAdmin = createSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        subscription_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating organization status:', error)
      return NextResponse.json({ error: 'Failed to update organization status' }, { status: 500 })
    }

    // Log the action for audit trail
    await supabaseAdmin
      .from('system_logs')
      .insert({
        level: 'info',
        message: `Organization ${action}ed by super admin`,
        metadata: {
          organization_id: organizationId,
          action: action,
          new_status: newStatus
        },
        source: 'super_admin'
      })

    return NextResponse.json({
      success: true,
      message: `Organization ${action}ed successfully`,
      new_status: newStatus
    })

  } catch (error) {
    console.error('Update organization status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
