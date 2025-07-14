import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { parsePaginationParams, calculatePagination, createPaginationResponse } from '@/lib/utils'

// Get responses (mood check-ins) for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const filterPeriod = searchParams.get('filterPeriod') || '7d'
    const filterMood = searchParams.get('filterMood') || 'all'
    const filterAnonymous = searchParams.get('filterAnonymous') || 'all'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams)
    const { offset } = calculatePagination(page, limit)

    // Calculate date filter
    const now = new Date()
    let days = 7
    if (filterPeriod === '30d') days = 30
    else if (filterPeriod === '90d') days = 90
    const since = new Date(now)
    since.setDate(now.getDate() - days)

    // Build base query for counting
    let countQuery = supabaseAdmin
      .from('mood_checkins')
      .select('*, employees!inner(organization_id)', { count: 'exact', head: true })
      .eq('employees.organization_id', organizationId)
      .gte('created_at', since.toISOString())

    // Apply mood filter to count query
    if (filterMood !== 'all') {
      if (filterMood === 'positive') {
        countQuery = countQuery.gte('mood_score', 4)
      } else if (filterMood === 'neutral') {
        countQuery = countQuery.eq('mood_score', 3)
      } else if (filterMood === 'negative') {
        countQuery = countQuery.lte('mood_score', 2)
      }
    }

    // Apply anonymous filter to count query
    if (filterAnonymous !== 'all') {
      if (filterAnonymous === 'anonymous') {
        countQuery = countQuery.eq('is_anonymous', true)
      } else if (filterAnonymous === 'identified') {
        countQuery = countQuery.eq('is_anonymous', false)
      }
    }

    // Get total count
    const { count: totalItems, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting responses:', countError)
      return NextResponse.json({ error: 'Failed to count responses' }, { status: 500 })
    }

    // Build main query with pagination
    let query = supabaseAdmin
      .from('mood_checkins')
      .select(`
        id,
        mood_score,
        response_text,
        is_anonymous,
        created_at,
        employees!inner(
          id,
          first_name,
          last_name,
          department,
          organization_id,
          organization:organizations(anonymous_allowed)
        )
      `)
      .eq('employees.organization_id', organizationId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply mood filter to main query
    if (filterMood !== 'all') {
      if (filterMood === 'positive') {
        query = query.gte('mood_score', 4)
      } else if (filterMood === 'neutral') {
        query = query.eq('mood_score', 3)
      } else if (filterMood === 'negative') {
        query = query.lte('mood_score', 2)
      }
    }

    // Apply anonymous filter to main query
    if (filterAnonymous !== 'all') {
      if (filterAnonymous === 'anonymous') {
        query = query.eq('is_anonymous', true)
      } else if (filterAnonymous === 'identified') {
        query = query.eq('is_anonymous', false)
      }
    }

    const { data: responses, error } = await query

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Process responses
    const processedResponses = responses?.map((response: any) => {
      const employee = Array.isArray(response.employees) ? response.employees[0] : response.employees
      const organization = Array.isArray(employee?.organization) ? employee.organization[0] : employee?.organization
      const orgAllowsAnonymous = organization?.anonymous_allowed ?? true
      const isAnonymousResponse = response.is_anonymous && orgAllowsAnonymous

      return {
        id: response.id,
        employee: `${employee?.first_name} ${employee?.last_name}`,
        department: employee?.department || 'Unassigned',
        mood: response.mood_score,
        comment: response.response_text || '',
        timestamp: response.created_at,
        anonymous: isAnonymousResponse,
        orgAllowsAnonymous: orgAllowsAnonymous
      }
    }) || []

    // Create paginated response
    const paginatedResponse = createPaginationResponse(
      processedResponses,
      totalItems || 0,
      page,
      limit
    )

    return NextResponse.json({
      success: true,
      responses: paginatedResponse.data,
      pagination: paginatedResponse.pagination
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
