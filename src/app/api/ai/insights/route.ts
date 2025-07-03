import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Type definitions for the API
interface Employee {
  first_name: string
  last_name: string
  department: string | null
}

// Generate department-level AI insights
async function generateDepartmentInsights(organizationId: string, department?: string) {
  try {
    // Get mood data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let query = supabaseAdmin
      .from('mood_checkins')
      .select(`
        mood_score, created_at, employee_id,
        employee:employees(first_name, last_name, department)
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (department) {
      // Filter by specific department through employee join
      query = query.eq('employee.department', department)
    }

    const { data: moodData, error } = await query

    if (error || !moodData) {
      console.error('Error fetching mood data:', error)
      return []
    }

    const insights = []

    // Group data by department
    const departmentData = (moodData as any[]).reduce((acc, record) => {
      // Handle both single employee object and array cases
      const employee = Array.isArray(record.employee) ? record.employee[0] : record.employee
      const dept = employee?.department || 'Unknown'
      if (!acc[dept]) acc[dept] = []
      acc[dept].push(record)
      return acc
    }, {} as Record<string, any[]>)

    // Analyze each department
    for (const [dept, records] of Object.entries(departmentData)) {
      const typedRecords = records as any[]
      if (typedRecords.length < 5) continue // Need minimum data

      const scores = typedRecords.map((r: any) => r.mood_score).filter(s => s !== null)
      const avgMood = scores.reduce((a, b) => a + b, 0) / scores.length
      const responseRate = typedRecords.length / 30 // Rough estimate

      // Low department mood
      if (avgMood < 2.5) {
        insights.push({
          insight_type: 'department_insight',
          title: `Low Mood Alert - ${dept} Department`,
          description: `${dept} department has an average mood score of ${avgMood.toFixed(1)} over the last 30 days. This indicates potential team-wide issues.`,
          severity: avgMood < 2 ? 'critical' : 'warning',
          department: dept,
          data_points: {
            average_mood: avgMood,
            total_responses: typedRecords.length,
            low_mood_count: scores.filter(s => s <= 2).length
          },
          action_items: [
            'Conduct department-wide survey',
            'Review team workload and deadlines',
            'Consider team building activities',
            'Meet with department manager'
          ]
        })
      }

      // High performing department
      if (avgMood > 4.2) {
        insights.push({
          insight_type: 'positive_trend',
          title: `High Performance - ${dept} Department`,
          description: `${dept} department maintains excellent mood scores (${avgMood.toFixed(1)} average). Consider sharing their practices with other teams.`,
          severity: 'info',
          department: dept,
          data_points: {
            average_mood: avgMood,
            total_responses: typedRecords.length,
            high_mood_count: scores.filter(s => s >= 4).length
          },
          action_items: [
            'Document successful practices',
            'Share strategies with other departments',
            'Recognize team achievements',
            'Maintain current support level'
          ]
        })
      }

      // Low response rate
      if (responseRate < 0.5) {
        insights.push({
          insight_type: 'trend_analysis',
          title: `Low Response Rate - ${dept} Department`,
          description: `${dept} department has a low response rate (${(responseRate * 100).toFixed(1)}%). Employees may not be engaging with check-ins.`,
          severity: 'warning',
          department: dept,
          data_points: {
            response_rate: responseRate,
            total_responses: typedRecords.length
          },
          action_items: [
            'Review check-in timing and frequency',
            'Improve message templates',
            'Educate employees on importance',
            'Consider incentives for participation'
          ]
        })
      }
    }

    // Overall organization insights
    const allScores = moodData.map(r => r.mood_score).filter(s => s !== null)
    if (allScores.length > 0) {
      const orgAvgMood = allScores.reduce((a, b) => a + b, 0) / allScores.length
      const trendData = moodData.slice(0, 50) // Last 50 responses

      // Check for organization-wide declining trend
      if (trendData.length >= 20) {
        const firstHalf = trendData.slice(0, 10).map(r => r.mood_score).filter(s => s !== null)
        const secondHalf = trendData.slice(10, 20).map(r => r.mood_score).filter(s => s !== null)
        
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
          
          if (firstAvg < secondAvg - 0.5) {
            insights.push({
              insight_type: 'trend_analysis',
              title: 'Organization-wide Mood Decline',
              description: `Recent mood scores are declining across the organization. Average dropped from ${secondAvg.toFixed(1)} to ${firstAvg.toFixed(1)}.`,
              severity: 'warning',
              data_points: {
                previous_average: secondAvg,
                current_average: firstAvg,
                decline_amount: secondAvg - firstAvg
              },
              action_items: [
                'Investigate recent organizational changes',
                'Review company-wide policies or events',
                'Consider all-hands meeting to address concerns',
                'Increase check-in frequency temporarily'
              ]
            })
          }
        }
      }
    }

    return insights

  } catch (error) {
    console.error('Error generating department insights:', error)
    return []
  }
}

// API endpoint to get AI insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const department = searchParams.get('department')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get existing insights from database
    let query = supabaseAdmin
      .from('ai_insights')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (department) {
      query = query.eq('department', department)
    }

    const { data: existingInsights, error } = await query

    if (error) {
      console.error('Error fetching insights:', error)
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      insights: existingInsights || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Generate new insights on demand
export async function POST(request: NextRequest) {
  try {
    const { organizationId, department } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Generate new insights
    const insights = await generateDepartmentInsights(organizationId, department)

    // Insert new insights into database
    if (insights.length > 0) {
      const insightsToInsert = insights.map(insight => ({
        organization_id: organizationId,
        ...insight,
        data_points: JSON.stringify(insight.data_points),
        action_items: JSON.stringify(insight.action_items)
      }))

      const { error: insertError } = await supabaseAdmin
        .from('ai_insights')
        .insert(insightsToInsert)

      if (insertError) {
        console.error('Error inserting insights:', insertError)
        return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      generated: insights.length,
      insights 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Mark insight as read
export async function PATCH(request: NextRequest) {
  try {
    const { insightId, isRead, isDismissed } = await request.json()

    if (!insightId) {
      return NextResponse.json({ error: 'Insight ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (typeof isRead === 'boolean') updateData.is_read = isRead
    if (typeof isDismissed === 'boolean') updateData.is_dismissed = isDismissed

    const { error } = await supabaseAdmin
      .from('ai_insights')
      .update(updateData)
      .eq('id', insightId)

    if (error) {
      console.error('Error updating insight:', error)
      return NextResponse.json({ error: 'Failed to update insight' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
