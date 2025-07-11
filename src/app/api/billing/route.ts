import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Fetch organization data
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Fetch employee count
    const { data: employees, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('organization_id', organizationId)

    if (empError) {
      console.error('Error fetching employees:', empError)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    const employeeCount = employees?.length || 0

    // Get current plan from organization data
    const currentPlan = organization.subscription_plan || 'free'

    return NextResponse.json({
      success: true,
      organization,
      employeeCount,
      currentPlan
    })

  } catch (error) {
    console.error('Error in billing API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
