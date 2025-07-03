import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
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
  try {
    // Get employee details
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
      return { success: false, error: 'Employee not found' }
    }

    // Get message template
    const language = employee.language_preference || 'en'
    const template = MESSAGE_TEMPLATES[language as keyof typeof MESSAGE_TEMPLATES]?.[messageType] || 
                    MESSAGE_TEMPLATES.en[messageType]

    // Personalize message
    const message = template.replace('{name}', employee.first_name)

    // Send WhatsApp message
    const twilioClient = getTwilioClient()
    const response = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${employee.phone}`,
      body: message
    })

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
  try {
    // Get employees to send to
    let query = supabaseAdmin
      .from('employees')
      .select('id, first_name, phone')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (employeeIds && employeeIds.length > 0) {
      query = query.in('id', employeeIds)
    }

    const { data: employees, error } = await query

    if (error || !employees) {
      return { success: false, error: 'Failed to fetch employees' }
    }

    // Send check-ins to all employees
    const results = await Promise.allSettled(
      employees.map(employee => sendMoodCheckin(employee.id, messageType))
    )

    // Count successes and failures
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

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
  try {
    const { 
      type, 
      organizationId, 
      employeeId, 
      employeeIds, 
      scheduleId, 
      messageType = 'weekly' 
    } = await request.json()

    // Validate required parameters
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'single':
        if (!employeeId) {
          return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
        }
        result = await sendMoodCheckin(employeeId, messageType)
        break

      case 'bulk':
        if (!organizationId) {
          return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }
        result = await sendBulkCheckins(organizationId, employeeIds, messageType)
        break

      case 'scheduled':
        if (!scheduleId) {
          return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
        }
        result = await sendScheduledCheckins(scheduleId)
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('API error:', error)
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
