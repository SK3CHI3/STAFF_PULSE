import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// List payment methods for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, payment_methods: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add a new payment method
export async function POST(request: NextRequest) {
  try {
    const { organizationId, type, details, is_primary } = await request.json()
    if (!organizationId || !type || !details) {
      return NextResponse.json({ error: 'Organization ID, type, and details are required' }, { status: 400 })
    }
    // If is_primary, unset other primaries
    if (is_primary) {
      await supabaseAdmin
        .from('payment_methods')
        .update({ is_primary: false })
        .eq('organization_id', organizationId)
    }
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .insert({ organization_id: organizationId, type, details, is_primary: !!is_primary })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, payment_method: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a payment method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('payment_methods')
      .delete()
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 