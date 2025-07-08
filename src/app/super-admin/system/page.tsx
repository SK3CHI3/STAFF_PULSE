'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Zap, Timer, AlertTriangle, Link2, RefreshCw, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

interface SystemMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  activeConnections: number
  databaseHealth: number
  whatsappDeliveryRate: number
  apiCallsToday: number
  storageUsed: number
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [errorData, setErrorData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchSystemData()
      // Set up real-time updates
      const interval = setInterval(fetchSystemData, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [profile])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/super-admin/system-health');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setAlerts(data.alerts);
        setPerformanceData(data.performanceData);
        setErrorData(data.errorData);
        // Optionally: setServiceHealth(data.serviceHealth) if you want to display service health dynamically
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // fetchSystemMetrics is now handled by fetchSystemData

  const fetchSystemAlerts = async () => {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) setError(error.message);
    else setAlerts(data || []);
  }

  const fetchPerformanceData = async () => {
    // Example: fetch last 24h API response times from platform_analytics
    const { data, error } = await supabase
      .from('platform_analytics')
      .select('period_start, metric_value')
      .eq('metric_name', 'api_response_time')
      .eq('time_period', 'hourly')
      .order('period_start', { ascending: true })
      .limit(24);
    if (error) setError(error.message);
    else setPerformanceData((data || []).map(row => ({
      time: new Date(row.period_start).getHours() + ':00',
      responseTime: row.metric_value
    })));
  }

  const fetchErrorData = async () => {
    // Fetch all error logs and aggregate by level in JS
    const { data, error } = await supabase
      .from('system_logs')
      .select('level');
    if (error) setError(error.message);
    else {
      // Aggregate counts by error level
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { level: string }) => {
        counts[row.level] = (counts[row.level] || 0) + 1;
      });
      setErrorData(Object.entries(counts).map(([level, count]) => ({
        name: level,
        value: count
      })));
    }
  }

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  if (!profile || profile.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Super Admin access required</p>
        </div>
      </div>
    )
  }

  const getHealthColor = (value: number, threshold: number = 95) => {
    if (value >= threshold) return 'text-green-600'
    if (value >= threshold - 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Glass Morphism Header */}
      <header className="backdrop-blur-md bg-white/30 border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                System Health Monitor
              </h1>
              <p className="text-gray-600 mt-1">Real-time system performance and health metrics</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
              
              <button 
                onClick={fetchSystemData}
                className="backdrop-blur-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 text-blue-700 px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 pb-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* System Status Cards */}
        {metrics && Object.keys(metrics).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SystemMetricCard
              title="System Uptime"
              value={metrics.uptime !== null && metrics.uptime !== undefined ? `${metrics.uptime.toFixed(2)}%` : 'N/A'}
              status={metrics.uptime !== null && metrics.uptime !== undefined && metrics.uptime >= 99.5 ? 'healthy' : 'warning'}
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
            />
            <SystemMetricCard
              title="Response Time"
              value={metrics.responseTime !== null && metrics.responseTime !== undefined ? `${metrics.responseTime}ms` : 'N/A'}
              status={metrics.responseTime !== null && metrics.responseTime !== undefined && metrics.responseTime <= 300 ? 'healthy' : 'warning'}
              icon={<Timer className="w-6 h-6 text-green-500" />}
            />
            <SystemMetricCard
              title="Error Rate"
              value={metrics.errorRate !== null && metrics.errorRate !== undefined ? `${metrics.errorRate.toFixed(2)}%` : 'N/A'}
              status={metrics.errorRate !== null && metrics.errorRate !== undefined && metrics.errorRate <= 0.5 ? 'healthy' : 'error'}
              icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
            />
            <SystemMetricCard
              title="Active Connections"
              value={metrics.activeConnections !== null && metrics.activeConnections !== undefined ? metrics.activeConnections.toLocaleString() : 'N/A'}
              status="healthy"
              icon={<Link2 className="w-6 h-6 text-blue-500" />}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No metrics data available</div>
        )}

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Response Time Chart */}
          <div className="h-full backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time (24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData} margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 400]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
                {(!performanceData || performanceData.length === 0) && (
                  <text
                    x="50%" y="50%" textAnchor="middle"
                    fill="#aaa" fontSize={16}
                    dy={-10}
                  >
                    No data available
                  </text>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Breakdown */}
          <div className="h-full backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={errorData} margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" angle={0} textAnchor="middle" height={80} />
                <YAxis stroke="#6B7280" domain={[0, 400]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                {(!errorData || errorData.length === 0) && (
                  <text
                    x="50%" y="50%" textAnchor="middle"
                    fill="#aaa" fontSize={16}
                    dy={-10}
                  >
                    No data available
                  </text>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Alerts */}
        <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <span className="text-sm text-gray-600">
              {alerts && alerts.filter(a => !a.resolved).length} active alerts
            </span>
          </div>
          
          <div className="space-y-3">
            {alerts && alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p>No system alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border ${
                  alert.resolved 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : alert.type === 'error' 
                    ? 'bg-red-50 border-red-200' 
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// System Metric Card Component
function SystemMetricCard({ title, value, status, icon }: {
  title: string
  value: string
  status: 'healthy' | 'warning' | 'error'
  icon: React.ReactNode
}) {
  const statusColors = {
    healthy: 'from-green-500/20 to-green-600/20 border-green-200/30 text-green-700',
    warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-200/30 text-yellow-700',
    error: 'from-red-500/20 to-red-600/20 border-red-200/30 text-red-700'
  }

  return (
    <div className={`backdrop-blur-md bg-gradient-to-br ${statusColors[status]} border rounded-2xl p-6 transition-all duration-200 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <div className="flex items-center mt-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              status === 'healthy' ? 'bg-green-500' :
              status === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></div>
            <span className="text-xs opacity-70 capitalize">{status}</span>
          </div>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}

// Service Status Component
function ServiceStatus({ name, status, uptime, lastCheck }: {
  name: string
  status: 'healthy' | 'warning' | 'error'
  uptime: string
  lastCheck: string
}) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }

  return (
    <div className="p-4 bg-white/60 rounded-xl border border-white/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        <p>Uptime: {uptime}</p>
        <p>Last check: {lastCheck}</p>
      </div>
    </div>
  )
}
