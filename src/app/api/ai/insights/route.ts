import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

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

// Helper: Clean and extract a valid JSON array from LLM output
function cleanLLMJsonArray(content: string): string | null {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = content.replace(/```json[\s\S]*?```/gi, match => match.replace(/```json|```/gi, ''))
  cleaned = cleaned.replace(/```[\s\S]*?```/g, match => match.replace(/```/g, ''))
  // Extract the first [ ... ] block
  const arrayMatch = cleaned.match(/\[[\s\S]*?\]/)
  if (!arrayMatch) return null
  let arrayStr = arrayMatch[0]
  // Remove trailing commas before ] or }
  arrayStr = arrayStr.replace(/,\s*([\]}])/g, '$1')
  // Ensure array closes (add ] if missing)
  const openBrackets = (arrayStr.match(/\[/g) || []).length
  const closeBrackets = (arrayStr.match(/\]/g) || []).length
  if (openBrackets > closeBrackets) {
    arrayStr += ']'.repeat(openBrackets - closeBrackets)
  }
  return arrayStr
}

// Helper: Call OpenRouter DeepSeek LLM
async function generateAIInsightsWithLLM({ organizationId, employees, moodData, department }: {
  organizationId: string,
  employees: any[],
  moodData: any[],
  department?: string
}): Promise<{ insights: any[]; warning: string | null }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not set')

  // Summarize org data for prompt
  const employeeSummary = employees.map(e => `${e.first_name} ${e.last_name} (${e.department || 'Unassigned'})`).join(', ')
  const moodSummary = moodData.map(m => `Score: ${m.mood_score}, Dept: ${m.employee?.department || 'Unknown'}, Date: ${m.created_at}`).slice(0, 50).join('\n')

  // STRONGER prompt: Only emotional well-being, no absenteeism, no generic business advice
  // ---
  // NOTE: This prompt is designed to force the LLM to generate only brief, actionable insights about emotional well-being, mood, and engagement. It must NOT mention absenteeism, attendance, or unrelated business topics.
  // ---
  const prompt = `You are an HR analytics AI. Given the following organization data, generate 3-5 brief, actionable insights for HR admins.\n\nSTRICT RULES:\n- Focus ONLY on emotional well-being, mood, and engagement.\n- Do NOT mention absenteeism, attendance, time off, or unrelated business topics.\n- Do NOT give generic business or HR policy advice.\n- Each insight should be concise, actionable, and relevant for supporting team well-being.\n- Each insight must have: title, description, severity (info|warning|critical), type (trend_analysis|risk_detection|recommendation|department_insight|employee_insight), department (if relevant), and a list of action_items.\n\nEmployees: ${employeeSummary}\n\nRecent Mood Checkins (last 30d):\n${moodSummary}\n\nDepartment: ${department || 'All'}\n\nFormat:\n[ { title, description, severity, insight_type, department, action_items } ]\n\nRespond with ONLY a valid JSON array, NO explanation, NO markdown, NO comments, NO trailing commas, NO code blocks, NOTHING else. If you do not have enough data, respond with an empty array: []. If you do not follow this, your output will be discarded. Do NOT write any explanation, markdown, or text outside the array. Do NOT use markdown. Do NOT add any text before or after the array. Do NOT add comments. Do NOT add trailing commas. Do NOT add code blocks. Respond with a single valid JSON array only.`;

  const body: any = {
    model: 'deepseek/deepseek-v3-base:free',
    messages: [
      { role: 'system', content: 'You are an HR analytics AI that generates actionable insights for HR admins based on organization mood and employee data. Respond ONLY with a valid JSON array. If you do not have enough data, respond with []. Do NOT write any explanation, markdown, or text outside the array.' },
      { role: 'user', content: prompt }
    ]
  }
  // Try to use stop sequence if supported
  body.stop = [']']

  // Log the outgoing request
  console.log('[OpenRouter] Sending request:', JSON.stringify(body, null, 2))

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://staffpulse.ai/', // Optional, for leaderboard
      'X-Title': 'StaffPulse HR Platform' // Optional, for leaderboard
    },
    body: JSON.stringify(body)
  })
  // Log the response status
  console.log('[OpenRouter] Response status:', response.status)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[OpenRouter] API error:', errorText)
    throw new Error('OpenRouter API error: ' + errorText)
  }
  const data = await response.json()
  // Log the raw response
  console.log('[OpenRouter] Response data:', JSON.stringify(data, null, 2))
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('No content from LLM')
  // Try to parse JSON from LLM response
  let insights = []
  try {
    // Clean and extract the JSON array
    const cleaned = cleanLLMJsonArray(content)
    if (!cleaned) {
      // If no array found, log and return empty array with warning
      console.error('[OpenRouter] No JSON array found in LLM response. Raw content:', content)
      return { insights: [], warning: 'LLM did not return a JSON array. Raw output logged.' }
    }
    insights = JSON.parse(cleaned)
    if (!Array.isArray(insights)) throw new Error('LLM did not return a JSON array')
  } catch (e) {
    console.error('[OpenRouter] Failed to parse LLM response as JSON. Raw content:', content)
    // Try to log the cleaned version too
    try {
      const cleaned = cleanLLMJsonArray(content)
      if (cleaned) {
        console.error('[OpenRouter] Cleaned JSON candidate:', cleaned)
      }
    } catch {}
    let errMsg = 'Failed to parse LLM response as JSON.'
    if (e && typeof e === 'object' && 'message' in e) {
      errMsg += ' ' + (e as Error).message
    }
    // Instead of throwing, return empty array and warning
    return { insights: [], warning: errMsg + ' Raw output logged.' }
  }
  // Add required fields for DB
  return { insights: insights.map((insight: any) => ({
    organization_id: organizationId,
    ...insight,
    data_points: JSON.stringify(insight.data_points || {}),
    action_items: JSON.stringify(insight.action_items || [])
  })), warning: null }
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

    // Fetch org data for LLM
    const [empRes, moodRes] = await Promise.all([
      supabaseAdmin.from('employees').select('*').eq('organization_id', organizationId),
      supabaseAdmin.from('mood_checkins').select('*, employee:employees(first_name, last_name, department)').eq('organization_id', organizationId).gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    ])
    const employees = empRes.data || []
    const moodData = moodRes.data || []

    // Short-circuit: Not enough data to generate insights
    if (employees.length < 3 || moodData.length < 5) {
      return NextResponse.json({
        success: true,
        generated: 0,
        usedLLM: false,
        warning: 'Not enough data to generate insights. Add more employees and check-ins.'
      })
    }

    let result: { insights: any[], warning: string | null } = { insights: [], warning: null }
    let usedLLM = false
    try {
      result = await generateAIInsightsWithLLM({ organizationId, employees, moodData, department })
      usedLLM = true
    } catch (e: any) {
      // Log and propagate the error to the client
      console.error('[AI Insights] LLM insight generation failed:', e)
      return NextResponse.json({ error: 'LLM insight generation failed: ' + e.message }, { status: 500 })
    }

    // Insert new insights into database
    if (Array.isArray(result.insights) && result.insights.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('ai_insights')
        .insert(result.insights)
      if (insertError) {
        console.error('Error inserting insights:', insertError)
        return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 })
      }
    }
    // If no valid insights, return success with warning
    if (!Array.isArray(result.insights) || result.insights.length === 0) {
      return NextResponse.json({ success: true, generated: 0, usedLLM, warning: result.warning || 'No valid insights generated by LLM.' })
    }

    return NextResponse.json({ 
      success: true, 
      generated: result.insights.length,
      usedLLM,
      warning: result.warning,
      insights: result.insights 
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
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
