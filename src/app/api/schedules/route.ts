import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get schedules for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const { data: schedules, error } = await supabaseAdmin
      .from('checkin_schedules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }

    // Process schedules to parse JSON fields
    const processedSchedules = schedules?.map(schedule => ({
      ...schedule,
      target_departments: typeof schedule.target_departments === 'string' 
        ? JSON.parse(schedule.target_departments) 
        : schedule.target_departments || [],
      target_employees: typeof schedule.target_employees === 'string' 
        ? JSON.parse(schedule.target_employees) 
        : schedule.target_employees || []
    })) || []

    return NextResponse.json({ 
      success: true, 
      schedules: processedSchedules 
    })

  } catch (error) {
    console.error('Schedules API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      organizationId,
      name,
      frequency,
      day_of_week,
      time_of_day,
      timezone,
      message_template,
      target_departments,
      target_employees,
      is_active = true
    } = body

    if (!organizationId || !name || !frequency || !time_of_day || !timezone) {
      return NextResponse.json({ 
        error: 'Organization ID, name, frequency, time, and timezone are required' 
      }, { status: 400 })
    }

    // Validate frequency and day_of_week
    const validFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly']
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json({ 
        error: 'Invalid frequency. Must be daily, weekly, bi-weekly, or monthly' 
      }, { status: 400 })
    }

    if ((frequency === 'weekly' || frequency === 'bi-weekly') && day_of_week === undefined) {
      return NextResponse.json({ 
        error: 'Day of week is required for weekly and bi-weekly schedules' 
      }, { status: 400 })
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(time_of_day)) {
      return NextResponse.json({ 
        error: 'Invalid time format. Use HH:MM (24-hour format)' 
      }, { status: 400 })
    }

    const { data: schedule, error } = await supabaseAdmin
      .from('checkin_schedules')
      .insert({
        organization_id: organizationId,
        name,
        frequency,
        day_of_week,
        time_of_day,
        timezone,
        message_template,
        target_departments: target_departments ? JSON.stringify(target_departments) : null,
        target_employees: target_employees ? JSON.stringify(target_employees) : null,
        is_active
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule:', error)
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      schedule 
    })

  } catch (error) {
    console.error('Create schedule API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update schedule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      scheduleId,
      name,
      frequency,
      day_of_week,
      time_of_day,
      timezone,
      message_template,
      target_departments,
      target_employees,
      is_active
    } = body

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (frequency !== undefined) updateData.frequency = frequency
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week
    if (time_of_day !== undefined) updateData.time_of_day = time_of_day
    if (timezone !== undefined) updateData.timezone = timezone
    if (message_template !== undefined) updateData.message_template = message_template
    if (target_departments !== undefined) updateData.target_departments = JSON.stringify(target_departments)
    if (target_employees !== undefined) updateData.target_employees = JSON.stringify(target_employees)
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: schedule, error } = await supabaseAdmin
      .from('checkin_schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule:', error)
      return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      schedule 
    })

  } catch (error) {
    console.error('Update schedule API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete schedule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('checkin_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      console.error('Error deleting schedule:', error)
      return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    })

  } catch (error) {
    console.error('Delete schedule API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
