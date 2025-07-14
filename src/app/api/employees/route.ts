import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { parsePaginationParams, calculatePagination, createPaginationResponse } from '@/lib/utils'

// Get employees for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const department = searchParams.get('department')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams)
    const { offset } = calculatePagination(page, limit)

    // Build base query for counting total items
    let countQuery = supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Apply filters to count query
    if (department && department !== 'all') {
      countQuery = countQuery.eq('department', department)
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('is_active', status === 'active')
    }

    // Get total count
    const { count: totalItems, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting employees:', countError)
      return NextResponse.json({ error: 'Failed to count employees' }, { status: 500 })
    }

    // Build main query with pagination
    let query = supabaseAdmin
      .from('employees')
      .select(`
        id, first_name, last_name, email, phone, department, position,
        is_active, created_at, updated_at,
        mood_checkins(mood_score, response_text, is_anonymous, created_at),
        organization:organizations(anonymous_allowed)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters to main query
    if (department && department !== 'all') {
      query = query.eq('department', department)
    }

    if (status && status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    const { data: employees, error } = await query

    if (error) {
      console.error('Error fetching employees:', error)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    // Process employees with mood statistics
    const processedEmployees = employees?.map(emp => {
      const moods = emp.mood_checkins || []
      const avgMood = moods.length > 0
        ? moods.reduce((sum: number, m: any) => sum + (m.mood_score || 0), 0) / moods.length
        : null

      const lastResponse = moods.length > 0
        ? new Date(moods[0].created_at).toLocaleDateString()
        : null

      return {
        ...emp,
        avg_mood: avgMood ? Number(avgMood.toFixed(1)) : undefined,
        response_count: moods.length,
        last_response: lastResponse
        // mood_checkins is included by default
      }
    }) || []

    // Create paginated response
    const paginatedResponse = createPaginationResponse(
      processedEmployees,
      totalItems || 0,
      page,
      limit
    )

    return NextResponse.json({
      success: true,
      employees: paginatedResponse.data,
      pagination: paginatedResponse.pagination
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      organizationId, 
      first_name, 
      last_name, 
      email, 
      phone, 
      department, 
      position 
    } = body

    if (!organizationId || !first_name || !last_name || !phone) {
      return NextResponse.json({ 
        error: 'Organization ID, first name, last name, and phone are required' 
      }, { status: 400 })
    }

    // Validate phone number format
    const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`
    
    // Check if phone number already exists
    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('phone', cleanPhone)
      .single()

    if (existingEmployee) {
      return NextResponse.json({ 
        error: 'An employee with this phone number already exists' 
      }, { status: 400 })
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .insert({
        organization_id: organizationId,
        first_name,
        last_name,
        email: email || null,
        phone: cleanPhone,
        department: department || null,
        position: position || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      employee 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update employee
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      employeeId,
      first_name, 
      last_name, 
      email, 
      phone, 
      department, 
      position,
      is_active
    } = body

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone.startsWith('+') ? phone : `+${phone}`
    if (department !== undefined) updateData.department = department
    if (position !== undefined) updateData.position = position
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating employee:', error)
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      employee 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete employee (soft delete by setting is_active to false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('employees')
      .update({ is_active: false })
      .eq('id', employeeId)

    if (error) {
      console.error('Error deactivating employee:', error)
      return NextResponse.json({ error: 'Failed to deactivate employee' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Employee deactivated successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
