'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts'

interface AnalyticsData {
  userGrowth: any[]
  revenueData: any[]
  engagementMetrics: any[]
  geographicData: any[]
  industryBreakdown: any[]
  retentionData: any[]
  usagePatterns: any[]
  conversionFunnel: any[]
}

export default function SuperAdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: [],
    revenueData: [],
    engagementMetrics: [],
    geographicData: [],
    industryBreakdown: [],
    retentionData: [],
    usagePatterns: [],
    conversionFunnel: []
  })
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchAnalyticsData()
    }
  }, [profile, selectedTimeframe])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Generate comprehensive analytics data
      const data = {
        userGrowth: generateUserGrowthData(),
        revenueData: generateRevenueData(),
        engagementMetrics: generateEngagementData(),
        geographicData: generateGeographicData(),
        industryBreakdown: generateIndustryData(),
        retentionData: generateRetentionData(),
        usagePatterns: generateUsagePatterns(),
        conversionFunnel: generateConversionFunnel()
      }
      
      setAnalyticsData(data)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateUserGrowthData = () => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        organizations: Math.floor(Math.random() * 20) + 10 + (11 - i) * 5,
        employees: Math.floor(Math.random() * 500) + 200 + (11 - i) * 100,
        activeUsers: Math.floor(Math.random() * 100) + 50 + (11 - i) * 20
      })
    }
    return months
  }

  const generateRevenueData = () => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const baseRevenue = 5000 + (11 - i) * 2000
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: baseRevenue + Math.floor(Math.random() * 3000),
        mrr: baseRevenue * 0.8 + Math.floor(Math.random() * 2000),
        churn: Math.random() * 5 + 2
      })
    }
    return months
  }

  const generateEngagementData = () => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.getDate(),
        responseRate: 70 + Math.random() * 25,
        avgMood: 3.2 + Math.random() * 1.5,
        messagesPerUser: 2 + Math.random() * 3
      })
    }
    return days
  }

  const generateGeographicData = () => {
    return [
      { country: 'United States', organizations: 45, revenue: 125000, color: '#3B82F6' },
      { country: 'United Kingdom', organizations: 23, revenue: 67000, color: '#10B981' },
      { country: 'Canada', organizations: 18, revenue: 52000, color: '#F59E0B' },
      { country: 'Australia', organizations: 12, revenue: 34000, color: '#EF4444' },
      { country: 'Germany', organizations: 15, revenue: 41000, color: '#8B5CF6' },
      { country: 'Others', organizations: 27, revenue: 73000, color: '#6B7280' }
    ]
  }

  const generateIndustryData = () => {
    return [
      { industry: 'Technology', count: 35, avgMood: 4.1, color: '#3B82F6' },
      { industry: 'Healthcare', count: 28, avgMood: 3.8, color: '#10B981' },
      { industry: 'Finance', count: 22, avgMood: 3.6, color: '#F59E0B' },
      { industry: 'Education', count: 18, avgMood: 4.0, color: '#8B5CF6' },
      { industry: 'Retail', count: 15, avgMood: 3.4, color: '#EF4444' },
      { industry: 'Manufacturing', count: 12, avgMood: 3.7, color: '#6B7280' }
    ]
  }

  const generateRetentionData = () => {
    return [
      { cohort: 'Jan 2024', month1: 100, month2: 85, month3: 78, month6: 65, month12: 58 },
      { cohort: 'Feb 2024', month1: 100, month2: 88, month3: 82, month6: 70, month12: 62 },
      { cohort: 'Mar 2024', month1: 100, month2: 90, month3: 85, month6: 75, month12: 68 },
      { cohort: 'Apr 2024', month1: 100, month2: 87, month3: 80, month6: 72, month12: 65 }
    ]
  }

  const generateUsagePatterns = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        messages: Math.floor(Math.random() * 100) + (i >= 9 && i <= 17 ? 150 : 50),
        responses: Math.floor(Math.random() * 80) + (i >= 9 && i <= 17 ? 120 : 30)
      })
    }
    return hours
  }

  const generateConversionFunnel = () => {
    return [
      { stage: 'Visitors', count: 10000, percentage: 100 },
      { stage: 'Sign-ups', count: 1200, percentage: 12 },
      { stage: 'Trial Started', count: 800, percentage: 8 },
      { stage: 'Active Users', count: 600, percentage: 6 },
      { stage: 'Paid Conversion', count: 180, percentage: 1.8 }
    ]
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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Glass Morphism Header */}
      <header className="backdrop-blur-md bg-white/30 border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Platform Analytics
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive insights and business intelligence</p>
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
                onClick={fetchAnalyticsData}
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
          <button className="backdrop-blur-md bg-blue-500/20 border border-blue-300/30 text-blue-700 px-4 py-2 rounded-xl font-medium">
            Analytics
          </button>
          <a href="/super-admin/system" className="backdrop-blur-md bg-white/20 border border-white/30 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/30 transition-all">
            System Health
          </a>
        </div>
      </div>

      {/* Content */}
      <main className="px-6 pb-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Revenue"
            value="$847,230"
            change="+23.5%"
            trend="up"
            icon="💰"
          />
          <KPICard
            title="Monthly Recurring Revenue"
            value="$67,890"
            change="+18.2%"
            trend="up"
            icon="📈"
          />
          <KPICard
            title="Customer Lifetime Value"
            value="$12,450"
            change="+12.1%"
            trend="up"
            icon="👥"
          />
          <KPICard
            title="Churn Rate"
            value="3.2%"
            change="-0.8%"
            trend="down"
            icon="📉"
          />
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <ChartCard title="User Growth" subtitle="Organizations and employees over time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.userGrowth}>
                <defs>
                  <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="organizations" stroke="#3B82F6" fillOpacity={1} fill="url(#colorOrgs)" />
                <Area type="monotone" dataKey="employees" stroke="#10B981" fillOpacity={1} fill="url(#colorEmployees)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue Trends */}
          <ChartCard title="Revenue Analytics" subtitle="Revenue and MRR growth">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6' }} />
                <Line type="monotone" dataKey="mrr" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Geographic and Industry Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Distribution */}
          <ChartCard title="Geographic Distribution" subtitle="Organizations by country">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.geographicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="organizations"
                >
                  {analyticsData.geographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {analyticsData.geographicData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.country}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Industry Breakdown */}
          <ChartCard title="Industry Analysis" subtitle="Organizations by industry with mood scores">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.industryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="industry" stroke="#6B7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Engagement and Usage Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Engagement */}
          <ChartCard title="Daily Engagement" subtitle="Response rates and mood trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.engagementMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="responseRate" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="avgMood" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Usage Patterns */}
          <ChartCard title="Usage Patterns" subtitle="Activity by hour of day">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.usagePatterns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="messages" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="responses" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Conversion Funnel */}
        <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <div className="space-y-4">
            {analyticsData.conversionFunnel.map((stage, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-gray-700">{stage.stage}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                    {stage.count.toLocaleString()} ({stage.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// KPI Card Component
function KPICard({ title, value, change, trend, icon }: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: string
}) {
  return (
    <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="flex items-center mt-2">
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? '↗' : '↘'} {change}
            </span>
            <span className="text-xs text-gray-500 ml-2">vs last period</span>
          </div>
        </div>
        <div className="text-3xl">{icon}</div>
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
