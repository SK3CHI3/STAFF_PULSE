import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import twilio from 'twilio'

// Function to get Twilio client with validation
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  console.log('📱 [Twilio] Checking credentials...')
  console.log('📱 [Twilio] Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING')
  console.log('📱 [Twilio] Auth Token:', authToken ? 'SET' : 'MISSING')
  console.log('📱 [Twilio] WhatsApp Number:', process.env.TWILIO_WHATSAPP_NUMBER)

  if (!accountSid || !authToken || accountSid.startsWith('your_') || authToken.startsWith('your_')) {
    console.error('❌ [Twilio] Credentials not configured properly')
    throw new Error('Twilio credentials not configured properly')
  }

  console.log('✅ [Twilio] Credentials validated, creating client')
  return twilio(accountSid, authToken)
}

// Default check-in message templates
const MESSAGE_TEMPLATES = {
  en: {
    weekly: "Hi {name}! 👋 How was your week? Reply with:\n1 = Terrible 😞\n2 = Poor 😕\n3 = Okay 😐\n4 = Good 😊\n5 = Great! 🎉\n\nFeel free to add any comments too!",
    daily: "Hi {name}! 👋 How are you feeling today? Reply 1-5 (1=bad, 5=great) and add any thoughts!",
    biweekly: "Hi {name}! 👋 How have the past 2 weeks been? Rate 1-5 and share what's on your mind!"
  },
  sw: {
    weekly: "Hujambo {name}! 👋 Wiki hii ilikuwaje? Jibu kwa:\n1 = Mbaya sana 😞\n2 = Mbaya 😕\n3 = Sawa 😐\n4 = Nzuri 😊\n5 = Nzuri sana! 🎉\n\nUnaweza kuongeza maoni yako pia!",
    daily: "Hujambo {name}! 👋 Unahisije leo? Jibu 1-5 (1=mbaya, 5=nzuri) na ongeza mawazo yako!",
    biweekly: "Hujambo {name}! 👋 Wiki 2 zilizopita zilikuwaje? Kadiria 1-5 na shiriki mawazo yako!"
  }
}

// Send mood check-in to specific employee
async function sendMoodCheckin(employeeId: string, messageType: 'daily' | 'weekly' | 'biweekly' = 'weekly') {
  console.log('📱 [Send Check-in] Sending to employee:', employeeId)

  try {
    // Get employee details
    console.log('📱 [Send Check-in] Fetching employee details...')
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select(`
        id, organization_id, first_name, phone, language_preference,
        organization:organizations(name)
      `)
      .eq('id', employeeId)
      .eq('is_active', true)
      .single()

    if (employeeError || !employee) {
      console.error('❌ [Send Check-in] Employee not found:', employeeId, employeeError)
      return { success: false, error: 'Employee not found' }
    }

    console.log('📱 [Send Check-in] Employee found:', {
      id: employee.id,
      name: employee.first_name,
      phone: employee.phone,
      org: employee.organization_id
    })

    // Get message template
    const language = employee.language_preference || 'en'
    const template = MESSAGE_TEMPLATES[language as keyof typeof MESSAGE_TEMPLATES]?.[messageType] ||
                    MESSAGE_TEMPLATES.en[messageType]

    // Personalize message
    const message = template.replace('{name}', employee.first_name)
    console.log('📱 [Send Check-in] Message prepared:', message)

    // Send WhatsApp message
    console.log('📱 [Send Check-in] Initializing Twilio client...')
    const twilioClient = getTwilioClient()

    console.log('📱 [Send Check-in] Sending WhatsApp message...')
    console.log('📱 [Send Check-in] From:', process.env.TWILIO_WHATSAPP_NUMBER)
    console.log('📱 [Send Check-in] To:', `whatsapp:${employee.phone}`)

    const response = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${employee.phone}`,
      body: message
    })

    console.log('✅ [Send Check-in] Message sent successfully, SID:', response.sid)

    // Log the outbound message
    await supabaseAdmin
      .from('whatsapp_logs')
      .insert({
        organization_id: employee.organization_id,
        employee_id: employee.id,
        message_type: 'checkin_request',
        direction: 'outbound',
        message_content: message,
        twilio_message_id: response.sid,
        status: 'sent'
      })

    return { 
      success: true, 
      messageId: response.sid,
      employee: {
        id: employee.id,
        name: employee.first_name,
        phone: employee.phone
      }
    }

  } catch (error) {
    console.error('Error sending mood check-in:', error)
    return { success: false, error: 'Failed to send message' }
  }
}

// Send check-ins to multiple employees
async function sendBulkCheckins(organizationId: string, employeeIds?: string[], messageType: 'daily' | 'weekly' | 'biweekly' = 'weekly') {
  console.log('📱 [Bulk Check-in] Starting bulk send for org:', organizationId)

  try {
    // Get employees to send to
    let query = supabaseAdmin
      .from('employees')
      .select('id, first_name, phone')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (employeeIds && employeeIds.length > 0) {
      console.log('📱 [Bulk Check-in] Filtering to specific employees:', employeeIds)
      query = query.in('id', employeeIds)
    }

    console.log('📱 [Bulk Check-in] Fetching employees from database...')
    const { data: employees, error } = await query

    if (error || !employees) {
      console.error('❌ [Bulk Check-in] Failed to fetch employees:', error)
      return { success: false, error: 'Failed to fetch employees' }
    }

    console.log('📱 [Bulk Check-in] Found employees:', employees.length)
    console.log('📱 [Bulk Check-in] Employee details:', employees.map(e => ({ id: e.id, name: e.first_name, phone: e.phone })))

    // Send check-ins to all employees
    console.log('📱 [Bulk Check-in] Sending messages to all employees...')
    const results = await Promise.allSettled(
      employees.map(employee => sendMoodCheckin(employee.id, messageType))
    )

    // Count successes and failures
    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

    // Log detailed results
    console.log('📱 [Bulk Check-in] Results summary:', { total: employees.length, successful, failed })
    results.forEach((result, index) => {
      const employee = employees[index]
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`✅ [Bulk Check-in] Success for ${employee.first_name} (${employee.phone})`)
      } else {
        const error = result.status === 'rejected' ? result.reason :
                     (result.status === 'fulfilled' && !result.value.success ? result.value.error : 'Unknown error')
        console.error(`❌ [Bulk Check-in] Failed for ${employee.first_name} (${employee.phone}):`, error)
      }
    })

    return {
      success: true,
      total: employees.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        employee: employees[index],
        success: result.status === 'fulfilled' && result.value.success,
        error: result.status === 'rejected' ? result.reason :
               (result.status === 'fulfilled' && !result.value.success ? result.value.error : null)
      }))
    }

  } catch (error) {
    console.error('Error sending bulk check-ins:', error)
    return { success: false, error: 'Failed to send bulk messages' }
  }
}

// Send check-ins based on schedule
async function sendScheduledCheckins(scheduleId: string) {
  try {
    // Get schedule details
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('checkin_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('is_active', true)
      .single()

    if (scheduleError || !schedule) {
      return { success: false, error: 'Schedule not found' }
    }

    // Determine which employees to include
    let employeeIds: string[] = []

    if (schedule.target_employees && Array.isArray(schedule.target_employees)) {
      employeeIds = schedule.target_employees
    } else {
      // Get all employees, optionally filtered by department
      let query = supabaseAdmin
        .from('employees')
        .select('id')
        .eq('organization_id', schedule.organization_id)
        .eq('is_active', true)

      if (schedule.target_departments && Array.isArray(schedule.target_departments)) {
        query = query.in('department', schedule.target_departments)
      }

      const { data: employees, error } = await query
      if (error || !employees) {
        return { success: false, error: 'Failed to fetch employees' }
      }

      employeeIds = employees.map(emp => emp.id)
    }

    // Send check-ins
    const result = await sendBulkCheckins(
      schedule.organization_id, 
      employeeIds, 
      schedule.frequency as 'daily' | 'weekly' | 'biweekly'
    )

    return result

  } catch (error) {
    console.error('Error sending scheduled check-ins:', error)
    return { success: false, error: 'Failed to send scheduled messages' }
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  console.log('📱 [WhatsApp API] Received check-in request')

  try {
    const body = await request.json()
    console.log('📱 [WhatsApp API] Request body:', body)

    const {
      type,
      organizationId,
      employeeId,
      employeeIds,
      scheduleId,
      messageType = 'weekly'
    } = body

    // Validate required parameters
    if (!type) {
      console.error('❌ [WhatsApp API] Missing type parameter')
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    console.log('📱 [WhatsApp API] Processing type:', type)
    let result

    switch (type) {
      case 'single':
        if (!employeeId) {
          console.error('❌ [WhatsApp API] Missing employeeId for single type')
          return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
        }
        console.log('📱 [WhatsApp API] Sending to single employee:', employeeId)
        result = await sendMoodCheckin(employeeId, messageType)
        break

      case 'bulk':
        if (!organizationId) {
          console.error('❌ [WhatsApp API] Missing organizationId for bulk type')
          return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }
        console.log('📱 [WhatsApp API] Sending bulk to organization:', organizationId)
        result = await sendBulkCheckins(organizationId, employeeIds, messageType)
        break

      case 'scheduled':
        if (!scheduleId) {
          console.error('❌ [WhatsApp API] Missing scheduleId for scheduled type')
          return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
        }
        console.log('📱 [WhatsApp API] Sending scheduled:', scheduleId)
        result = await sendScheduledCheckins(scheduleId)
        break

      default:
        console.error('❌ [WhatsApp API] Invalid type:', type)
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    console.log('📱 [WhatsApp API] Operation result:', result)

    if (!result.success) {
      console.error('❌ [WhatsApp API] Operation failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log('✅ [WhatsApp API] Operation successful')
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ [WhatsApp API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get check-in history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const employeeId = searchParams.get('employeeId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('whatsapp_logs')
      .select(`
        id, message_type, direction, message_content, status, created_at,
        employee:employees(id, first_name, last_name, department)
      `)
      .eq('organization_id', organizationId)
      .eq('message_type', 'checkin_request')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch check-in history' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
