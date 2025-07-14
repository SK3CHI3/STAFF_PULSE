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
    // Only allow updating specific fields (sensitive fields are restricted)
    const allowedFields = [
      'check_in_frequency', 'working_hours', 'timezone', 'anonymous_allowed',
      'reminder_enabled', 'alert_threshold', 'email', 'phone', 'address', 'billing_email'
    ]

    // Restricted fields that cannot be updated via this endpoint
    const restrictedFields = [
      'name',                    // Company name - contact support to change
      'subscription_plan',       // Subscription plan - managed through billing
      'subscription_status',     // Subscription status - managed by system
      'subscription_start_date', // Subscription dates - managed by system
      'subscription_end_date',   // Subscription dates - managed by system
      'monthly_price',          // Pricing - managed by system
      'employee_count',         // Employee count - calculated automatically
      'created_at',             // Creation date - immutable
      'updated_at'              // Update date - managed by system
    ]

    // Check if any restricted fields are being attempted to update
    for (const field of restrictedFields) {
      if (updates[field] !== undefined) {
        return NextResponse.json({
          error: `Field '${field}' cannot be updated. Contact support for assistance.`
        }, { status: 403 })
      }
    }
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