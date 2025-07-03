'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

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
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 99.9,
    responseTime: 245,
    errorRate: 0.1,
    activeConnections: 1247,
    databaseHealth: 98.5,
    whatsappDeliveryRate: 97.8,
    apiCallsToday: 15420,
    storageUsed: 67.3
  })
  
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
      
      // Simulate fetching system metrics
      await Promise.all([
        fetchSystemMetrics(),
        fetchSystemAlerts(),
        fetchPerformanceData(),
        fetchErrorData()
      ])
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async () => {
    // In a real implementation, these would come from monitoring services
    // like DataDog, New Relic, or custom monitoring endpoints
    
    // Simulate real-time metrics with slight variations
    setMetrics(prev => ({
      uptime: 99.9 + (Math.random() - 0.5) * 0.1,
      responseTime: 245 + Math.floor((Math.random() - 0.5) * 50),
      errorRate: 0.1 + (Math.random() - 0.5) * 0.05,
      activeConnections: 1247 + Math.floor((Math.random() - 0.5) * 100),
      databaseHealth: 98.5 + (Math.random() - 0.5) * 2,
      whatsappDeliveryRate: 97.8 + (Math.random() - 0.5) * 1,
      apiCallsToday: prev.apiCallsToday + Math.floor(Math.random() * 10),
      storageUsed: 67.3 + (Math.random() - 0.5) * 0.5
    }))
  }

  const fetchSystemAlerts = async () => {
    // Mock alerts - in production, these would come from monitoring systems
    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High Response Time',
        message: 'API response time exceeded 300ms threshold',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Database Backup Completed',
        message: 'Scheduled database backup completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        resolved: true
      },
      {
        id: '3',
        type: 'error',
        title: 'WhatsApp API Rate Limit',
        message: 'Approaching WhatsApp API rate limit for organization XYZ',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        resolved: true
      }
    ]
    setAlerts(mockAlerts)
  }

  const fetchPerformanceData = async () => {
    // Generate last 24 hours of performance data
    const hours = []
    for (let i = 23; i >= 0; i--) {
      const time = new Date()
      time.setHours(time.getHours() - i)
      hours.push({
        time: time.getHours() + ':00',
        responseTime: 200 + Math.floor(Math.random() * 100),
        throughput: 800 + Math.floor(Math.random() * 400),
        errors: Math.floor(Math.random() * 10)
      })
    }
    setPerformanceData(hours)
  }

  const fetchErrorData = async () => {
    // Generate error breakdown data
    const errorTypes = [
      { name: '4xx Client Errors', value: 45, color: '#F59E0B' },
      { name: '5xx Server Errors', value: 12, color: '#EF4444' },
      { name: 'Database Timeouts', value: 8, color: '#8B5CF6' },
      { name: 'WhatsApp API Errors', value: 15, color: '#EC4899' },
      { name: 'Network Errors', value: 20, color: '#6B7280' }
    ]
    setErrorData(errorTypes)
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
        return '🔴'
      case 'warning':
        return '🟡'
      default:
        return '🔵'
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="px-6 pt-6">
        <div className="flex space-x-1 mb-6">
          <a href="/super-admin" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            Overview
          </a>
          <a href="/super-admin/organizations" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            Organizations
          </a>
          <a href="/super-admin/analytics" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            Analytics
          </a>
          <button className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 text-blue-700 px-4 py-2 rounded-xl font-medium">
            System Health
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="px-6 pb-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SystemMetricCard
            title="System Uptime"
            value={`${metrics.uptime.toFixed(2)}%`}
            status={metrics.uptime >= 99.5 ? 'healthy' : 'warning'}
            icon="⚡"
          />
          <SystemMetricCard
            title="Response Time"
            value={`${metrics.responseTime}ms`}
            status={metrics.responseTime <= 300 ? 'healthy' : 'warning'}
            icon="⏱️"
          />
          <SystemMetricCard
            title="Error Rate"
            value={`${metrics.errorRate.toFixed(2)}%`}
            status={metrics.errorRate <= 0.5 ? 'healthy' : 'error'}
            icon="🚨"
          />
          <SystemMetricCard
            title="Active Connections"
            value={metrics.activeConnections.toLocaleString()}
            status="healthy"
            icon="🔗"
          />
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Chart */}
          <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time (24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
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
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Breakdown */}
          <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Services Status */}
        <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ServiceStatus
              name="Database"
              status="healthy"
              uptime="99.9%"
              lastCheck="2 min ago"
            />
            <ServiceStatus
              name="WhatsApp API"
              status="healthy"
              uptime="97.8%"
              lastCheck="1 min ago"
            />
            <ServiceStatus
              name="Authentication"
              status="healthy"
              uptime="99.5%"
              lastCheck="30 sec ago"
            />
            <ServiceStatus
              name="File Storage"
              status="warning"
              uptime="98.2%"
              lastCheck="5 min ago"
            />
            <ServiceStatus
              name="Email Service"
              status="healthy"
              uptime="99.1%"
              lastCheck="1 min ago"
            />
            <ServiceStatus
              name="Analytics"
              status="healthy"
              uptime="99.7%"
              lastCheck="30 sec ago"
            />
          </div>
        </div>

        {/* System Alerts */}
        <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <span className="text-sm text-gray-600">
              {alerts.filter(a => !a.resolved).length} active alerts
            </span>
          </div>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
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
  icon: string
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
