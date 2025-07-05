import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// Get system health metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1)
        break
      case '24h':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      default:
        startDate.setDate(startDate.getDate() - 1)
    }

    // Get system metrics
    const metrics = await getSystemMetrics(startDate, endDate)
    
    // Get service health
    const serviceHealth = await getServiceHealth()
    
    // Get performance data
    const performanceData = await getPerformanceData(timeframe)
    
    // Get error data
    const errorData = await getErrorData(startDate, endDate)
    
    // Get system alerts
    const alerts = await getSystemAlerts()

    return NextResponse.json({
      success: true,
      metrics,
      serviceHealth,
      performanceData,
      errorData,
      alerts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('System health API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get core system metrics
async function getSystemMetrics(startDate: Date, endDate: Date) {
  try {
    // Database health check
    const dbStart = Date.now()
    const { error: dbError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
    const dbResponseTime = Date.now() - dbStart

    // Get API call counts
    const { count: apiCalls } = await supabaseAdmin
      .from('whatsapp_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Get error counts
    const { count: errorCount } = await supabaseAdmin
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Calculate uptime (mock - would come from monitoring service)
    const uptime = 99.9 + (Math.random() - 0.5) * 0.2

    // Calculate error rate
    const totalRequests = (apiCalls || 0) + 1000 // Add estimated other requests
    const errorRate = totalRequests > 0 ? ((errorCount || 0) / totalRequests) * 100 : 0

    return {
      uptime: Number(uptime.toFixed(2)),
      responseTime: dbResponseTime,
      errorRate: Number(errorRate.toFixed(3)),
      apiCalls: apiCalls || 0,
      errorCount: errorCount || 0,
      databaseHealth: dbError ? 0 : 100,
      activeConnections: Math.floor(Math.random() * 200) + 800, // Mock data
      memoryUsage: Math.floor(Math.random() * 30) + 60, // Mock data
      cpuUsage: Math.floor(Math.random() * 40) + 20 // Mock data
    }
  } catch (error) {
    console.error('Error getting system metrics:', error)
    return {
      uptime: 0,
      responseTime: 0,
      errorRate: 100,
      apiCalls: 0,
      errorCount: 0,
      databaseHealth: 0,
      activeConnections: 0,
      memoryUsage: 0,
      cpuUsage: 0
    }
  }
}

// Get service health status
async function getServiceHealth() {
  const services = [
    { name: 'Database', status: 'healthy', uptime: 99.9 },
    { name: 'WhatsApp API', status: 'healthy', uptime: 97.8 },
    { name: 'Authentication', status: 'healthy', uptime: 99.5 },
    { name: 'File Storage', status: 'healthy', uptime: 98.2 },
    { name: 'Email Service', status: 'healthy', uptime: 99.1 },
    { name: 'Analytics', status: 'healthy', uptime: 99.7 }
  ]

  // Check database connectivity
  try {
    const dbStart = Date.now()
    await supabaseAdmin.from('organizations').select('id').limit(1)
    const dbTime = Date.now() - dbStart
    
    services[0].status = dbTime < 1000 ? 'healthy' : dbTime < 3000 ? 'warning' : 'error'
  } catch (error) {
    services[0].status = 'error'
  }

  // Check WhatsApp API (mock - would ping Twilio)
  services[1].status = Math.random() > 0.05 ? 'healthy' : 'warning'

  return services.map(service => ({
    ...service,
    lastCheck: new Date().toISOString()
  }))
}

// Get performance data over time
async function getPerformanceData(timeframe: string) {
  const periods = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 24
  const data = []

  for (let i = periods - 1; i >= 0; i--) {
    const time = new Date()
    
    if (timeframe === '24h') {
      time.setHours(time.getHours() - i)
    } else {
      time.setDate(time.getDate() - i)
    }

    // Mock performance data - in production, this would come from monitoring
    data.push({
      time: timeframe === '24h' ? time.getHours() + ':00' : time.toLocaleDateString(),
      responseTime: 200 + Math.floor(Math.random() * 100),
      throughput: 800 + Math.floor(Math.random() * 400),
      errors: Math.floor(Math.random() * 10),
      cpuUsage: 20 + Math.floor(Math.random() * 40),
      memoryUsage: 60 + Math.floor(Math.random() * 30)
    })
  }

  return data
}

// Get error breakdown data
async function getErrorData(startDate: Date, endDate: Date) {
  try {
    // In production, this would query actual error logs
    // For now, return mock data based on common error patterns
    
    const errorTypes = [
      { name: '4xx Client Errors', value: 45, color: '#F59E0B' },
      { name: '5xx Server Errors', value: 12, color: '#EF4444' },
      { name: 'Database Timeouts', value: 8, color: '#8B5CF6' },
      { name: 'WhatsApp API Errors', value: 15, color: '#EC4899' },
      { name: 'Network Errors', value: 20, color: '#6B7280' }
    ]

    return errorTypes
  } catch (error) {
    console.error('Error getting error data:', error)
    return []
  }
}

// Get system alerts
async function getSystemAlerts() {
  try {
    // In production, this would query actual alert/monitoring systems
    // For now, return mock alerts based on current metrics
    
    const alerts = []
    
    // Check for high error rates
    const { count: recentErrors } = await supabaseAdmin
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour

    if ((recentErrors || 0) > 10) {
      alerts.push({
        id: 'high-error-rate',
        type: 'error',
        title: 'High Error Rate Detected',
        message: `${recentErrors} errors in the last hour`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Check for low response rates
    const { count: recentResponses } = await supabaseAdmin
      .from('mood_checkins')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    const { count: totalEmployees } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const responseRate = totalEmployees && totalEmployees > 0 
      ? ((recentResponses || 0) / totalEmployees) * 100 
      : 0

    if (responseRate < 30) {
      alerts.push({
        id: 'low-response-rate',
        type: 'warning',
        title: 'Low Response Rate',
        message: `Platform response rate is ${responseRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Add some mock alerts for demonstration
    if (Math.random() > 0.7) {
      alerts.push({
        id: 'database-slow',
        type: 'warning',
        title: 'Database Performance',
        message: 'Database queries are running slower than usual',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        resolved: false
      })
    }

    return alerts
  } catch (error) {
    console.error('Error getting system alerts:', error)
    return []
  }
}

// Create system alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, severity = 'info' } = body

    if (!type || !title || !message) {
      return NextResponse.json({ 
        error: 'Type, title, and message are required' 
      }, { status: 400 })
    }

    // In production, this would save to a proper alerts/monitoring system
    const alert = {
      id: `alert-${Date.now()}`,
      type,
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    // Log to system logs table
    await supabaseAdmin
      .from('system_logs')
      .insert({
        level: severity,
        message: `${title}: ${message}`,
        metadata: { alert_type: type },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true, 
      alert 
    })

  } catch (error) {
    console.error('Create alert API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
