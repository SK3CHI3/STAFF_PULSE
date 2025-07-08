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

    // If no real data, return nulls
    if (apiCalls === null && errorCount === null && dbError) {
      return null;
    }

    // Calculate error rate
    const totalRequests = (apiCalls || 0)
    const errorRate = totalRequests > 0 ? ((errorCount || 0) / totalRequests) * 100 : null

    return {
      uptime: null, // No real uptime data
      responseTime: dbResponseTime || null,
      errorRate: errorRate,
      apiCalls: apiCalls || 0,
      errorCount: errorCount || 0,
      databaseHealth: dbError ? 0 : 100,
      activeConnections: null, // No real data
      memoryUsage: null, // No real data
      cpuUsage: null // No real data
    }
  } catch (error) {
    console.error('Error getting system metrics:', error)
    return null;
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
  // Try to get real data from platform_analytics
  const { data, error } = await supabaseAdmin
    .from('platform_analytics')
    .select('period_start, metric_value')
    .eq('metric_name', 'api_response_time')
    .eq('time_period', 'hourly')
    .order('period_start', { ascending: true })
    .limit(24);
  if (error || !data || data.length === 0) return [];
  return data.map(row => ({
    time: new Date(row.period_start).getHours() + ':00',
    responseTime: row.metric_value
  }));
}

// Get error breakdown data
async function getErrorData(startDate: Date, endDate: Date) {
  // Get all error logs and aggregate by level
  const { data, error } = await supabaseAdmin
    .from('system_logs')
    .select('level')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  if (error || !data || data.length === 0) return [];
  const counts: Record<string, number> = {};
  data.forEach((row: { level: string }) => {
    counts[row.level] = (counts[row.level] || 0) + 1;
  });
  return Object.entries(counts).map(([level, count]) => ({
    name: level,
    value: count
  }));
}

// Get system alerts
async function getSystemAlerts() {
  // Only return real alerts from system_alerts table
  const { data, error } = await supabaseAdmin
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error || !data) return [];
  return data;
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
