'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

interface PlatformStats {
  totalOrganizations: number
  totalEmployees: number
  totalResponses: number
  activeUsers: number
  monthlyRevenue: number
  avgResponseRate: number
  totalMessages: number
  systemHealth: number
}

interface OrganizationData {
  id: string
  name: string
  employees: number
  responses: number
  avgMood: number
  responseRate: number
  subscription: string
  revenue: number
  lastActivity: string
  status: 'active' | 'inactive' | 'trial'
}

interface ChartData {
  name: string
  value: number
  responses?: number
  mood?: number
  revenue?: number
  organizations?: number
  color?: string
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalOrganizations: 0,
    totalEmployees: 0,
    totalResponses: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    avgResponseRate: 0,
    totalMessages: 0,
    systemHealth: 0
  })
  
  const [organizations, setOrganizations] = useState<OrganizationData[]>([])
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([])
  const [moodTrends, setMoodTrends] = useState<ChartData[]>([])
  const [subscriptionData, setSubscriptionData] = useState<ChartData[]>([])
  const [topOrganizations, setTopOrganizations] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  
  const { user, profile } = useAuth()

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchPlatformData()
    }
  }, [profile, selectedTimeframe])

  const fetchPlatformData = async () => {
    try {
      setLoading(true)
      
      // Fetch all platform statistics
      await Promise.all([
        fetchPlatformStats(),
        fetchOrganizations(),
        fetchMonthlyTrends(),
        fetchMoodTrends(),
        fetchSubscriptionBreakdown(),
        fetchTopOrganizations()
      ])
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatformStats = async () => {
    // Get total organizations
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    // Get total employees
    const { count: empCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total responses
    const { count: responseCount } = await supabase
      .from('mood_checkins')
      .select('*', { count: 'exact', head: true })

    // Get active users (HR admins who logged in recently)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString())

    // Calculate average response rate
    const { data: orgStats } = await supabase
      .from('organizations')
      .select(`
        id,
        employees(count),
        mood_checkins(count)
      `)

    let totalResponseRate = 0
    let orgWithData = 0

    orgStats?.forEach(org => {
      const empCount = org.employees?.[0]?.count || 0
      const responseCount = org.mood_checkins?.[0]?.count || 0
      if (empCount > 0) {
        totalResponseRate += (responseCount / empCount) * 100
        orgWithData++
      }
    })

    const avgResponseRate = orgWithData > 0 ? totalResponseRate / orgWithData : 0

    setStats({
      totalOrganizations: orgCount || 0,
      totalEmployees: empCount || 0,
      totalResponses: responseCount || 0,
      activeUsers: activeCount || 0,
      monthlyRevenue: 15750, // Mock data - would come from billing system
      avgResponseRate: Math.round(avgResponseRate),
      totalMessages: (responseCount || 0) * 1.2, // Estimate including outbound
      systemHealth: 98.5 // Mock data - would come from monitoring
    })
  }

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id, name, subscription_status, created_at,
        employees(count),
        mood_checkins(mood_score, created_at),
        profiles(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const processedOrgs: OrganizationData[] = data?.map(org => {
      const empCount = org.employees?.[0]?.count || 0
      const responses = org.mood_checkins || []
      const responseCount = responses.length
      
      const avgMood = responses.length > 0 
        ? responses.reduce((sum, r) => sum + (r.mood_score || 0), 0) / responses.length
        : 0

      const responseRate = empCount > 0 ? (responseCount / empCount) * 100 : 0

      return {
        id: org.id,
        name: org.name,
        employees: empCount,
        responses: responseCount,
        avgMood: Number(avgMood.toFixed(1)),
        responseRate: Math.round(responseRate),
        subscription: org.subscription_status || 'trial',
        revenue: empCount * 5, // Mock: $5 per employee per month
        lastActivity: responses.length > 0 ? responses[0].created_at : org.created_at,
        status: org.subscription_status === 'active' ? 'active' : 
                org.subscription_status === 'inactive' ? 'inactive' : 'trial'
      }
    }) || []

    setOrganizations(processedOrgs)
  }

  const fetchMonthlyTrends = async () => {
    // Generate last 6 months of data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const orgCount = Math.floor(Math.random() * 10) + organizations.length - 5 + i
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        value: orgCount,
        organizations: orgCount,
        responses: Math.floor(Math.random() * 500) + 1000 + (i * 200),
        revenue: Math.floor(Math.random() * 5000) + 10000 + (i * 1000)
      })
    }
    setMonthlyData(months)
  }

  const fetchMoodTrends = async () => {
    // Generate last 30 days of mood trends
    const days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const moodValue = Number((3.5 + Math.random() * 1.5).toFixed(1))
      days.push({
        name: date.getDate().toString(),
        value: moodValue,
        mood: moodValue,
        responses: Math.floor(Math.random() * 100) + 50
      })
    }
    setMoodTrends(days)
  }

  const fetchSubscriptionBreakdown = async () => {
    const subscriptions = [
      { name: 'Enterprise', value: 45, color: '#3B82F6' },
      { name: 'Professional', value: 35, color: '#10B981' },
      { name: 'Starter', value: 15, color: '#F59E0B' },
      { name: 'Trial', value: 5, color: '#EF4444' }
    ]
    setSubscriptionData(subscriptions)
  }

  const fetchTopOrganizations = async () => {
    const top = organizations
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 5)
      .map(org => ({
        name: org.name.length > 15 ? org.name.substring(0, 15) + '...' : org.name,
        value: org.responses,
        mood: org.avgMood
      }))
    setTopOrganizations(top)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading platform data...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Glass Morphism Header */}
      <header className="backdrop-blur-md bg-white/30 border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Platform-wide analytics and management</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <button 
                onClick={fetchPlatformData}
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

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          <button className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 text-blue-700 px-4 py-2 rounded-xl font-medium">
            Overview
          </button>
          <a href="/super-admin/organizations" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            Organizations
          </a>
          <a href="/super-admin/analytics" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            Analytics
          </a>
          <a href="/super-admin/system" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            System Health
          </a>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Organizations"
            value={stats.totalOrganizations}
            change="+12%"
            icon="🏢"
            color="blue"
          />
          <MetricCard
            title="Total Employees"
            value={stats.totalEmployees.toLocaleString()}
            change="+8%"
            icon="👥"
            color="green"
          />
          <MetricCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            change="+15%"
            icon="💰"
            color="purple"
          />
          <MetricCard
            title="Response Rate"
            value={`${stats.avgResponseRate}%`}
            change="+3%"
            icon="📊"
            color="orange"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Growth Chart */}
          <ChartCard title="Platform Growth" subtitle="Organizations, responses, and revenue over time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area type="monotone" dataKey="organizations" stroke="#3B82F6" fillOpacity={1} fill="url(#colorOrgs)" />
                <Area type="monotone" dataKey="responses" stroke="#10B981" fillOpacity={1} fill="url(#colorResponses)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Subscription Breakdown */}
          <ChartCard title="Subscription Distribution" subtitle="Current subscription tiers across organizations">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {subscriptionData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Trends */}
          <ChartCard title="Platform Mood Trends" subtitle="Average mood scores across all organizations">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis domain={[1, 5]} stroke="#6B7280" />
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
                  dataKey="mood" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Organizations */}
          <ChartCard title="Most Active Organizations" subtitle="Organizations by response volume">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topOrganizations} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="name" type="category" stroke="#6B7280" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Organizations Table */}
        <OrganizationsTable organizations={organizations} />
      </main>
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, change, icon, color }: {
  title: string
  value: string | number
  change: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-200/30 text-blue-700',
    green: 'from-green-500/20 to-green-600/20 border-green-200/30 text-green-700',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-200/30 text-purple-700',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-200/30 text-orange-700'
  }

  return (
    <div className={`backdrop-blur-md bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 transition-all duration-200 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-sm mt-1 opacity-70">{change} from last month</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}

// Chart Card Component
function ChartCard({ title, subtitle, children }: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

// Organizations Table Component
function OrganizationsTable({ organizations }: { organizations: OrganizationData[] }) {
  return (
    <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Organizations Overview</h3>
          <p className="text-sm text-gray-600">Detailed view of all organizations on the platform</p>
        </div>
        <button className="backdrop-blur-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 text-blue-700 px-4 py-2 rounded-xl transition-all duration-200">
          Export Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/50">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Organization</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Employees</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Responses</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Mood</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Response Rate</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Subscription</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-b border-gray-100/50 hover:bg-white/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{org.name}</div>
                  <div className="text-sm text-gray-500">ID: {org.id.substring(0, 8)}...</div>
                </td>
                <td className="py-3 px-4 text-gray-700">{org.employees}</td>
                <td className="py-3 px-4 text-gray-700">{org.responses}</td>
                <td className="py-3 px-4">
                  <span className={`font-medium ${
                    org.avgMood >= 4 ? 'text-green-600' :
                    org.avgMood >= 3 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {org.avgMood || 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-medium ${
                    org.responseRate >= 80 ? 'text-green-600' :
                    org.responseRate >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {org.responseRate}%
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    org.subscription === 'active' ? 'bg-green-100 text-green-800' :
                    org.subscription === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {org.subscription}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">${org.revenue}/mo</td>
                <td className="py-3 px-4">
                  <span className={`w-2 h-2 rounded-full inline-block ${
                    org.status === 'active' ? 'bg-green-500' :
                    org.status === 'trial' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
