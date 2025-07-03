import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

// Get platform-wide statistics for super admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }

    const supabaseAdmin = createSupabaseAdmin()
    // Get total organizations
    const { count: totalOrganizations } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    // Get active organizations
    const { count: activeOrganizations } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    // Get total employees
    const { count: totalEmployees } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total responses
    const { count: totalResponses } = await supabaseAdmin
      .from('mood_checkins')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get active users (HR admins who logged in recently)
    const { count: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', startDate.toISOString())

    // Calculate average response rate
    const { data: orgStats } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        employees!inner(count),
        mood_checkins!inner(count)
      `)

    let totalResponseRate = 0
    let orgWithData = 0

    if (orgStats) {
      for (const org of orgStats) {
        const empCount = org.employees?.[0]?.count || 0
        const responseCount = org.mood_checkins?.[0]?.count || 0
        if (empCount > 0) {
          totalResponseRate += (responseCount / empCount) * 100
          orgWithData++
        }
      }
    }

    const avgResponseRate = orgWithData > 0 ? totalResponseRate / orgWithData : 0

    // Calculate monthly revenue (mock calculation - would integrate with billing system)
    const monthlyRevenue = (activeOrganizations || 0) * 150 // $150 average per org

    // Get WhatsApp message stats
    const { count: totalMessages } = await supabaseAdmin
      .from('whatsapp_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get growth data for the timeframe
    const growthData = await getGrowthData(timeframe)

    // Get subscription breakdown
    const subscriptionData = await getSubscriptionBreakdown()

    // Get top organizations
    const topOrganizations = await getTopOrganizations()

    // Get mood trends
    const moodTrends = await getMoodTrends(timeframe)

    const stats = {
      totalOrganizations: totalOrganizations || 0,
      activeOrganizations: activeOrganizations || 0,
      totalEmployees: totalEmployees || 0,
      totalResponses: totalResponses || 0,
      activeUsers: activeUsers || 0,
      monthlyRevenue,
      avgResponseRate: Math.round(avgResponseRate),
      totalMessages: totalMessages || 0,
      systemHealth: 98.5, // Would come from monitoring system
      growthData,
      subscriptionData,
      topOrganizations,
      moodTrends
    }

    return NextResponse.json({ success: true, stats })

  } catch (error) {
    console.error('Super admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get growth data over time
async function getGrowthData(timeframe: string) {
  try {
    const periods = timeframe === '1y' ? 12 : timeframe === '90d' ? 12 : 6
    const interval = timeframe === '1y' ? 'month' : timeframe === '90d' ? 'week' : 'week'
    
    const data = []
    
    for (let i = periods - 1; i >= 0; i--) {
      const endDate = new Date()
      const startDate = new Date()
      
      if (interval === 'month') {
        endDate.setMonth(endDate.getMonth() - i)
        startDate.setMonth(startDate.getMonth() - i - 1)
      } else {
        endDate.setDate(endDate.getDate() - (i * 7))
        startDate.setDate(startDate.getDate() - ((i + 1) * 7))
      }

      // Get organizations created in this period
      const { count: newOrgs } = await supabaseAdmin
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())

      // Get employees added in this period
      const { count: newEmployees } = await supabaseAdmin
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())

      // Get responses in this period
      const { count: responses } = await supabaseAdmin
        .from('mood_checkins')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())

      data.push({
        period: interval === 'month' 
          ? endDate.toLocaleDateString('en-US', { month: 'short' })
          : `Week ${periods - i}`,
        organizations: newOrgs || 0,
        employees: newEmployees || 0,
        responses: responses || 0,
        revenue: (newOrgs || 0) * 150 // Mock revenue calculation
      })
    }

    return data
  } catch (error) {
    console.error('Error getting growth data:', error)
    return []
  }
}

// Get subscription breakdown
async function getSubscriptionBreakdown() {
  try {
    const { data: organizations } = await supabaseAdmin
      .from('organizations')
      .select('subscription_status')

    const breakdown = organizations?.reduce((acc: Record<string, number>, org) => {
      const status = org.subscription_status || 'trial'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}) || {}

    return [
      { name: 'Active', value: breakdown.active || 0, color: '#10B981' },
      { name: 'Trial', value: breakdown.trial || 0, color: '#F59E0B' },
      { name: 'Inactive', value: breakdown.inactive || 0, color: '#6B7280' },
      { name: 'Suspended', value: breakdown.suspended || 0, color: '#EF4444' }
    ]
  } catch (error) {
    console.error('Error getting subscription breakdown:', error)
    return []
  }
}

// Get top organizations by activity
async function getTopOrganizations() {
  try {
    const { data: organizations } = await supabaseAdmin
      .from('organizations')
      .select(`
        id, name,
        mood_checkins(count),
        employees(count)
      `)
      .limit(10)

    const processed = organizations?.map(org => ({
      name: org.name.length > 20 ? org.name.substring(0, 20) + '...' : org.name,
      responses: org.mood_checkins?.[0]?.count || 0,
      employees: org.employees?.[0]?.count || 0
    })) || []

    return processed.sort((a, b) => b.responses - a.responses).slice(0, 5)
  } catch (error) {
    console.error('Error getting top organizations:', error)
    return []
  }
}

// Get mood trends over time
async function getMoodTrends(timeframe: string) {
  try {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 30
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))

      const { data: moods } = await supabaseAdmin
        .from('mood_checkins')
        .select('mood_score')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .not('mood_score', 'is', null)

      const avgMood = moods && moods.length > 0
        ? moods.reduce((sum, m) => sum + m.mood_score, 0) / moods.length
        : 0

      data.push({
        date: date.getDate(),
        mood: Number(avgMood.toFixed(1)),
        responses: moods?.length || 0
      })
    }

    return data
  } catch (error) {
    console.error('Error getting mood trends:', error)
    return []
  }
}
