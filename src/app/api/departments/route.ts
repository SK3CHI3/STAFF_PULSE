import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// List departments for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, departments: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a new department
export async function POST(request: NextRequest) {
  try {
    const { organizationId, name } = await request.json()
    if (!organizationId || !name) {
      return NextResponse.json({ error: 'Organization ID and name are required' }, { status: 400 })
    }
    // Enforce unique name per org
    const { data: existing } = await supabaseAdmin
      .from('departments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', name)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ organization_id: organizationId, name })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, department: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a department
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('departments')
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