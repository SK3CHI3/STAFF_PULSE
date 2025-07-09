import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// List invoices for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('invoice_date', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, invoices: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a new invoice (for demo/testing)
export async function POST(request: NextRequest) {
  try {
    const { organizationId, amount, currency, status, method, payment_method_id, description } = await request.json()
    if (!organizationId || !amount || !status || !method) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        organization_id: organizationId,
        amount,
        currency: currency || 'KES',
        status,
        method,
        payment_method_id: payment_method_id || null,
        description: description || null
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, invoice: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 