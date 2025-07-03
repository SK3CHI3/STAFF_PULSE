import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

interface EmployeeImportData {
  first_name: string
  last_name: string
  email?: string
  phone: string
  department?: string
  position?: string
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{
    row: number
    data: any
    error: string
  }>
}

// Validate employee data
function validateEmployeeData(data: any, rowIndex: number): { valid: boolean; employee?: EmployeeImportData; error?: string } {
  const errors = []

  // Required fields
  if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
    errors.push('First name is required')
  }

  if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
    errors.push('Last name is required')
  }

  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim() === '') {
    errors.push('Phone number is required')
  }

  // Validate phone format (basic validation)
  if (data.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (!phoneRegex.test(data.phone.toString().trim())) {
      errors.push('Invalid phone number format')
    }
  }

  // Validate email if provided
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Invalid email format')
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join(', ')
    }
  }

  // Clean phone number
  let cleanPhone = data.phone.toString().trim()
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = `+${cleanPhone}`
  }

  return {
    valid: true,
    employee: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email?.trim() || undefined,
      phone: cleanPhone,
      department: data.department?.trim() || undefined,
      position: data.position?.trim() || undefined
    }
  }
}

// Parse CSV data
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim() !== '')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }

  return rows
}

// Import employees from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, csvData } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    if (!csvData) {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 })
    }

    // Parse CSV
    let parsedData: any[]
    try {
      parsedData = parseCSV(csvData)
    } catch (error: any) {
      return NextResponse.json({ error: `CSV parsing error: ${error.message}` }, { status: 400 })
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: []
    }

    // Validate and import each employee
    for (let i = 0; i < parsedData.length; i++) {
      const rowData = parsedData[i]
      const validation = validateEmployeeData(rowData, i + 2) // +2 because row 1 is header

      if (!validation.valid) {
        result.failed++
        result.errors.push({
          row: i + 2,
          data: rowData,
          error: validation.error!
        })
        continue
      }

      try {
        // Check if phone number already exists
        const { data: existingEmployee } = await supabaseAdmin
          .from('employees')
          .select('id, phone')
          .eq('phone', validation.employee!.phone)
          .single()

        if (existingEmployee) {
          result.failed++
          result.errors.push({
            row: i + 2,
            data: rowData,
            error: `Phone number ${validation.employee!.phone} already exists`
          })
          continue
        }

        // Insert employee
        const { error: insertError } = await supabaseAdmin
          .from('employees')
          .insert({
            organization_id: organizationId,
            ...validation.employee
          })

        if (insertError) {
          result.failed++
          result.errors.push({
            row: i + 2,
            data: rowData,
            error: `Database error: ${insertError.message}`
          })
        } else {
          result.imported++
        }

      } catch (error: any) {
        result.failed++
        result.errors.push({
          row: i + 2,
          data: rowData,
          error: `Unexpected error: ${error.message}`
        })
      }
    }

    // Update result success status
    result.success = result.imported > 0

    return NextResponse.json(result)

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get import template
export async function GET(request: NextRequest) {
  try {
    const template = `first_name,last_name,email,phone,department,position
John,Doe,john.doe@company.com,+1234567890,Engineering,Software Developer
Jane,Smith,jane.smith@company.com,+1234567891,Marketing,Marketing Manager
Bob,Johnson,bob.johnson@company.com,+1234567892,Sales,Sales Representative`

    return new Response(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employee_import_template.csv"'
      }
    })

  } catch (error) {
    console.error('Template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
