import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import twilio from 'twilio'

// Function to get Twilio client with validation
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken || accountSid.startsWith('your_') || authToken.startsWith('your_')) {
    throw new Error('Twilio credentials not configured properly')
  }

  return twilio(accountSid, authToken)
}

// Verify Twilio webhook signature
function verifyTwilioSignature(signature: string, url: string, params: any): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return false
  
  return twilio.validateRequest(authToken, signature, url, params)
}

// Process mood response from WhatsApp
async function processMoodResponse(from: string, body: string, messageId: string) {
  console.log('📱 [Mood Response] Processing response from:', from)
  console.log('📱 [Mood Response] Message body:', body)

  try {
    // Clean phone number (remove whatsapp: prefix)
    const phoneNumber = from.replace('whatsapp:', '')
    console.log('📱 [Mood Response] Cleaned phone number:', phoneNumber)

    // Find employee by phone number with organization details
    console.log('📱 [Mood Response] Looking up employee in database...')
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select(`
        id, organization_id, first_name, last_name, department, anonymity_preference,
        organization:organizations(name, subscription_status)
      `)
      .eq('phone', phoneNumber)
      .eq('is_active', true)
      .single()

    if (employeeError || !employee) {
      console.error('❌ [Mood Response] Employee not found:', phoneNumber, employeeError)

      // Log unknown number attempt
      await supabaseAdmin
        .from('whatsapp_logs')
        .insert({
          organization_id: null,
          employee_id: null,
          message_type: 'response',
          direction: 'inbound',
          message_content: `Unknown number: ${phoneNumber} - ${body}`,
          twilio_message_id: messageId,
          status: 'failed',
          error_message: 'Employee not found'
        })

      return { success: false, error: 'Employee not found' }
    }

    console.log('✅ [Mood Response] Employee found:', {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      org: employee.organization_id,
      anonymous: employee.anonymity_preference
    })

    // Check if organization is active
    const organization = employee.organization as any
    if (organization?.subscription_status !== 'active') {
      console.error('❌ [Mood Response] Organization inactive:', employee.organization_id)
      return { success: false, error: 'Organization subscription inactive' }
    }

    console.log('✅ [Mood Response] Organization is active')

    // Parse mood score from response
    let moodScore: number | null = null
    let responseText = body.trim()

    console.log('📱 [Mood Response] Parsing mood from text:', responseText)

    // Extract number from response (1-5)
    const numberMatch = responseText.match(/[1-5]/)
    if (numberMatch) {
      moodScore = parseInt(numberMatch[0])
      console.log('📱 [Mood Response] Found mood score:', moodScore)
    }

    // If no number found, try to parse text sentiment
    if (!moodScore) {
      const lowerText = responseText.toLowerCase()
      if (lowerText.includes('great') || lowerText.includes('excellent') || lowerText.includes('amazing')) {
        moodScore = 5
      } else if (lowerText.includes('good') || lowerText.includes('fine') || lowerText.includes('okay')) {
        moodScore = 4
      } else if (lowerText.includes('okay') || lowerText.includes('neutral') || lowerText.includes('average')) {
        moodScore = 3
      } else if (lowerText.includes('bad') || lowerText.includes('poor') || lowerText.includes('tired')) {
        moodScore = 2
      } else if (lowerText.includes('terrible') || lowerText.includes('awful') || lowerText.includes('stressed')) {
        moodScore = 1
      }
    }

    // Get AI sentiment analysis (placeholder for now)
    const sentimentScore = await analyzeSentiment(responseText)
    const sentimentLabel = getSentimentLabel(sentimentScore)

    // Store mood check-in
    console.log('📱 [Mood Response] Storing check-in to database...')
    const checkinData = {
      organization_id: employee.organization_id,
      employee_id: employee.id,
      mood_score: moodScore,
      response_text: responseText,
      sentiment_score: sentimentScore,
      sentiment_label: sentimentLabel,
      is_anonymous: employee.anonymity_preference,
      whatsapp_message_id: messageId,
      check_in_type: 'scheduled'
    }
    console.log('📱 [Mood Response] Check-in data:', checkinData)

    const { data: checkin, error: checkinError } = await supabaseAdmin
      .from('mood_checkins')
      .insert(checkinData)
      .select()
      .single()

    if (checkinError) {
      console.error('❌ [Mood Response] Failed to store check-in:', checkinError)
      return { success: false, error: 'Failed to store response' }
    }

    console.log('✅ [Mood Response] Check-in stored successfully:', checkin.id)

    // Log WhatsApp message
    await supabaseAdmin
      .from('whatsapp_logs')
      .insert({
        organization_id: employee.organization_id,
        employee_id: employee.id,
        message_type: 'response',
        direction: 'inbound',
        message_content: responseText,
        twilio_message_id: messageId,
        status: 'received'
      })

    // Check for burnout risk and create alerts
    if (moodScore && moodScore <= 2) {
      await checkBurnoutRisk(employee.id, employee.organization_id)
    }

    // Send acknowledgment message
    const acknowledgment = employee.anonymity_preference 
      ? "Thank you for your anonymous feedback! 🙏"
      : `Thank you ${employee.first_name}! Your feedback helps us build a better workplace. 🙏`

    await sendWhatsAppMessage(phoneNumber, acknowledgment, employee.organization_id, employee.id)

    // Trigger AI analysis for insights (async, don't wait)
    generateAIInsights(employee.organization_id, employee.id, moodScore, responseText)
      .catch(error => console.error('AI insights generation failed:', error))

    return { success: true, checkin }

  } catch (error) {
    console.error('Error processing mood response:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Generate AI insights based on mood data
async function generateAIInsights(organizationId: string, employeeId: string, moodScore: number | null, responseText: string) {
  try {
    // Get recent mood history for this employee
    const { data: recentMoods } = await supabaseAdmin
      .from('mood_checkins')
      .select('mood_score, created_at, response_text')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get employee details
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('first_name, last_name, department')
      .eq('id', employeeId)
      .single()

    if (!recentMoods || !employee) return

    // Analyze patterns and generate insights
    const insights = []

    // Check for declining mood trend
    if (recentMoods.length >= 3) {
      const recent3 = recentMoods.slice(0, 3).map(m => m.mood_score).filter(s => s !== null)
      if (recent3.length === 3 && recent3.every((score, i) => i === 0 || score <= recent3[i-1])) {
        insights.push({
          insight_type: 'risk_detection',
          title: `Declining Mood Trend - ${employee.first_name} ${employee.last_name}`,
          description: `${employee.first_name} has shown a declining mood trend over the last 3 check-ins (${recent3.join(' → ')}). Consider a one-on-one check-in.`,
          severity: recent3[0] <= 2 ? 'critical' : 'warning',
          department: employee.department,
          employee_id: employeeId,
          action_items: [
            'Schedule a private conversation with the employee',
            'Review recent workload and stress factors',
            'Consider temporary workload adjustment'
          ]
        })
      }
    }

    // Check for consistently low mood
    if (moodScore && moodScore <= 2) {
      const lowMoodCount = recentMoods.filter(m => m.mood_score && m.mood_score <= 2).length
      if (lowMoodCount >= 2) {
        insights.push({
          insight_type: 'risk_detection',
          title: `Persistent Low Mood - ${employee.first_name} ${employee.last_name}`,
          description: `${employee.first_name} has reported low mood (≤2) in ${lowMoodCount} of their last ${recentMoods.length} check-ins. Immediate attention recommended.`,
          severity: 'critical',
          department: employee.department,
          employee_id: employeeId,
          action_items: [
            'Immediate manager check-in required',
            'Consider mental health resources',
            'Review work environment factors'
          ]
        })
      }
    }

    // Check for positive trend
    if (moodScore && moodScore >= 4) {
      const recentPositive = recentMoods.slice(0, 3).filter(m => m.mood_score && m.mood_score >= 4).length
      if (recentPositive === 3) {
        insights.push({
          insight_type: 'positive_trend',
          title: `Positive Mood Trend - ${employee.first_name} ${employee.last_name}`,
          description: `${employee.first_name} has maintained high mood scores (≥4) for 3 consecutive check-ins. Great job!`,
          severity: 'info',
          department: employee.department,
          employee_id: employeeId,
          action_items: [
            'Acknowledge positive performance',
            'Consider sharing successful practices with team',
            'Maintain current support level'
          ]
        })
      }
    }

    // Insert insights into database
    if (insights.length > 0) {
      const insightsToInsert = insights.map(insight => ({
        organization_id: organizationId,
        ...insight,
        data_points: { recent_moods: recentMoods.slice(0, 5) },
        action_items: JSON.stringify(insight.action_items)
      }))

      await supabaseAdmin
        .from('ai_insights')
        .insert(insightsToInsert)
    }

  } catch (error) {
    console.error('Error generating AI insights:', error)
  }
}

// Analyze sentiment using AI (placeholder - integrate with OpenAI)
async function analyzeSentiment(text: string): Promise<number> {
  // TODO: Integrate with OpenAI API for sentiment analysis
  // For now, return a simple sentiment based on keywords
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'amazing', 'wonderful']
  const negativeWords = ['bad', 'terrible', 'awful', 'stressed', 'tired', 'overwhelmed']
  
  const lowerText = text.toLowerCase()
  let score = 0
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.2
  })
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.2
  })
  
  return Math.max(-1, Math.min(1, score))
}

// Get sentiment label from score
function getSentimentLabel(score: number): string {
  if (score > 0.1) return 'positive'
  if (score < -0.1) return 'negative'
  return 'neutral'
}

// Check for burnout risk patterns
async function checkBurnoutRisk(employeeId: string, organizationId: string) {
  try {
    // Get recent mood scores (last 2 weeks)
    const { data: recentMoods, error } = await supabaseAdmin
      .from('mood_checkins')
      .select('mood_score, created_at')
      .eq('employee_id', employeeId)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (error || !recentMoods || recentMoods.length < 2) return

    // Check for consistent low mood (2 or more low scores in recent responses)
    const lowMoodCount = recentMoods.filter(mood => mood.mood_score && mood.mood_score <= 2).length
    
    if (lowMoodCount >= 2) {
      // Create burnout risk alert
      await supabaseAdmin
        .from('alerts')
        .insert({
          organization_id: organizationId,
          employee_id: employeeId,
          alert_type: 'burnout_risk',
          severity: lowMoodCount >= 3 ? 'high' : 'medium',
          title: 'Potential Burnout Risk Detected',
          description: `Employee has reported ${lowMoodCount} low mood scores in the past 2 weeks.`,
          metadata: { recent_scores: recentMoods.slice(0, 5) }
        })
    }
  } catch (error) {
    console.error('Error checking burnout risk:', error)
  }
}

// Send WhatsApp message via Twilio
async function sendWhatsAppMessage(
  to: string, 
  message: string, 
  organizationId: string, 
  employeeId?: string
) {
  try {
    const twilioClient = getTwilioClient()
    const response = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message
    })

    // Log outbound message
    await supabaseAdmin
      .from('whatsapp_logs')
      .insert({
        organization_id: organizationId,
        employee_id: employeeId,
        message_type: 'response',
        direction: 'outbound',
        message_content: message,
        twilio_message_id: response.sid,
        status: 'sent'
      })

    return { success: true, messageId: response.sid }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error }
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  console.log('📱 [WhatsApp Webhook] Received incoming message')

  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    console.log('📱 [WhatsApp Webhook] Raw body:', body)
    console.log('📱 [WhatsApp Webhook] Parsed params:', Object.fromEntries(params))

    // Verify Twilio signature
    const signature = request.headers.get('x-twilio-signature') || ''
    const url = request.url

    console.log('📱 [WhatsApp Webhook] Verifying signature...')
    if (!verifyTwilioSignature(signature, url, Object.fromEntries(params))) {
      console.error('❌ [WhatsApp Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log('✅ [WhatsApp Webhook] Signature verified')

    // Extract message data
    const from = params.get('From') || ''
    const messageBody = params.get('Body') || ''
    const messageId = params.get('MessageSid') || ''

    console.log('📱 [WhatsApp Webhook] Message details:', {
      from,
      body: messageBody,
      messageId
    })

    // Process the mood response
    console.log('📱 [WhatsApp Webhook] Processing mood response...')
    const result = await processMoodResponse(from, messageBody, messageId)

    if (!result.success) {
      console.error('❌ [WhatsApp Webhook] Processing failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log('✅ [WhatsApp Webhook] Response processed successfully')
    return NextResponse.json({ success: true, data: result.checkin })

  } catch (error) {
    console.error('❌ [WhatsApp Webhook] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'WhatsApp webhook endpoint' })
}
