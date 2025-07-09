import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import JSZip from 'jszip'

// Helper: Convert array of objects to CSV
function toCSV(data: any[], columns?: string[]): string {
  if (!data || data.length === 0) return ''
  const cols = columns || Object.keys(data[0])
  const header = cols.join(',')
  const rows = data.map(row =>
    cols.map(col => {
      const val = row[col]
      if (val === null || val === undefined) return ''
      // Escape quotes
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Fetch all relevant tables
    const [employees, moodCheckins, departments, schedules] = await Promise.all([
      supabaseAdmin.from('employees').select('*').eq('organization_id', organizationId),
      supabaseAdmin.from('mood_checkins').select('*').eq('organization_id', organizationId),
      supabaseAdmin.from('departments').select('*').eq('organization_id', organizationId),
      supabaseAdmin.from('checkin_schedules').select('*').eq('organization_id', organizationId),
    ])

    // Prepare CSVs
    const zip = new JSZip()
    zip.file('employees.csv', toCSV(employees.data || []))
    zip.file('mood_checkins.csv', toCSV(moodCheckins.data || []))
    zip.file('departments.csv', toCSV(departments.data || []))
    zip.file('schedules.csv', toCSV(schedules.data || []))

    // Generate zip
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(zipContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="organization_export_${organizationId}.zip"`
      }
    })
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 