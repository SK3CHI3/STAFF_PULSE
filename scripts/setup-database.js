#!/usr/bin/env node

/**
 * Database Setup Script for STAFF_PULSE
 * This script creates all necessary tables, policies, and functions in Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sqlContent, description) {
  console.log(`🔄 ${description}...`)
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error(`❌ Error ${description.toLowerCase()}:`, error.message)
      return false
    }
    
    console.log(`✅ ${description} completed successfully`)
    return true
  } catch (error) {
    console.error(`❌ Error ${description.toLowerCase()}:`, error.message)
    return false
  }
}

async function setupDatabase() {
  console.log('🚀 Starting STAFF_PULSE database setup...\n')

  try {
    // Read SQL files
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const policiesPath = path.join(__dirname, '../supabase/rls-policies.sql')

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath)
      process.exit(1)
    }

    if (!fs.existsSync(policiesPath)) {
      console.error('❌ Policies file not found:', policiesPath)
      process.exit(1)
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    const policiesSQL = fs.readFileSync(policiesPath, 'utf8')

    // Execute schema creation
    const schemaSuccess = await executeSQL(schemaSQL, 'Creating database schema')
    if (!schemaSuccess) {
      console.error('❌ Failed to create schema. Aborting setup.')
      process.exit(1)
    }

    // Execute RLS policies
    const policiesSuccess = await executeSQL(policiesSQL, 'Setting up Row Level Security policies')
    if (!policiesSuccess) {
      console.error('❌ Failed to create RLS policies. Aborting setup.')
      process.exit(1)
    }

    // Create sample data (optional)
    await createSampleData()

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Configure authentication providers in Supabase dashboard')
    console.log('2. Set up WhatsApp/Twilio credentials')
    console.log('3. Configure OpenAI API for sentiment analysis')
    console.log('4. Test the authentication flow')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

async function createSampleData() {
  console.log('🔄 Creating sample data...')

  try {
    // Create a sample organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Demo Company',
        email: 'demo@staffpulse.com',
        employee_count: 10,
        subscription_plan: 'team',
        subscription_status: 'active'
      })
      .select()
      .single()

    if (orgError) {
      console.log('ℹ️  Sample organization already exists or creation failed')
      return
    }

    // Create sample employees
    const sampleEmployees = [
      {
        organization_id: org.id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@demo.com',
        phone: '+254700000001',
        department: 'Engineering',
        position: 'Software Developer'
      },
      {
        organization_id: org.id,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@demo.com',
        phone: '+254700000002',
        department: 'Marketing',
        position: 'Marketing Manager'
      },
      {
        organization_id: org.id,
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike@demo.com',
        phone: '+254700000003',
        department: 'Sales',
        position: 'Sales Representative'
      }
    ]

    const { error: employeesError } = await supabase
      .from('employees')
      .insert(sampleEmployees)

    if (employeesError) {
      console.log('ℹ️  Sample employees creation failed or already exist')
    } else {
      console.log('✅ Sample data created successfully')
    }

  } catch (error) {
    console.log('ℹ️  Sample data creation skipped:', error.message)
  }
}

// Run the setup
setupDatabase()
