import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// GET: Fetch organization settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()
    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, settings: org })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update organization settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, ...updates } = body
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }
    // Only allow updating specific fields
    const allowedFields = [
      'name', 'check_in_frequency', 'working_hours', 'timezone', 'anonymous_allowed',
      'reminder_enabled', 'alert_threshold', 'email', 'phone', 'address', 'billing_email',
      'subscription_plan'
    ]
    const updateData: any = {}
    for (const key of allowedFields) {
      if (updates[key] !== undefined) updateData[key] = updates[key]
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single()
    if (error || !org) {
      return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 })
    }
    return NextResponse.json({ success: true, settings: org })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 