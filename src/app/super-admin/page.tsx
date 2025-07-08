'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Building2, Users, MessageSquare, ActivitySquare, BarChart2, TrendingUp, DollarSign, ArrowDown } from 'lucide-react'
import React from 'react'

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
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  
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
    const now = new Date();
    let labels: string[] = [];
    let orgsByLabel: Record<string, number> = {};
    let responsesByLabel: Record<string, number> = {};
    let groupBy: 'day' | 'week' | 'month' = 'month';
    let rangeStart = new Date(now);

    if (selectedTimeframe === '7d') {
      groupBy = 'day';
      rangeStart.setDate(now.getDate() - 6);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
        labels.push(label);
        orgsByLabel[label] = 0;
        responsesByLabel[label] = 0;
      }
    } else if (selectedTimeframe === '30d' || selectedTimeframe === '90d') {
      groupBy = 'week';
      const weeks = selectedTimeframe === '30d' ? 4 : 13;
      rangeStart.setDate(now.getDate() - (weeks * 7 - 1));
      for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i * 7);
        const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        labels.push(label);
        orgsByLabel[label] = 0;
        responsesByLabel[label] = 0;
      }
    } else if (selectedTimeframe === '1y') {
      groupBy = 'month';
      rangeStart.setMonth(now.getMonth() - 11);
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        labels.push(label);
        orgsByLabel[label] = 0;
        responsesByLabel[label] = 0;
      }
    }

    // Query organizations created in range
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('id, created_at')
      .gte('created_at', rangeStart.toISOString());
    if (orgsError) throw orgsError;

    // Query responses in range
    const { data: responsesData, error: responsesError } = await supabase
      .from('mood_checkins')
      .select('id, created_at')
      .gte('created_at', rangeStart.toISOString());
    if (responsesError) throw responsesError;

    // Group by label (using the same label format as above)
    orgsData?.forEach(org => {
      const d = new Date(org.created_at);
      let label = '';
      if (groupBy === 'day') {
        label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      } else if (groupBy === 'week') {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (orgsByLabel[label] !== undefined) orgsByLabel[label]++;
    });
    responsesData?.forEach(resp => {
      const d = new Date(resp.created_at);
      let label = '';
      if (groupBy === 'day') {
        label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      } else if (groupBy === 'week') {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (responsesByLabel[label] !== undefined) responsesByLabel[label]++;
    });
    const monthly = labels.map(label => ({
      name: label,
      organizations: orgsByLabel[label],
      responses: responsesByLabel[label],
      value: orgsByLabel[label]
    }));
    setMonthlyData(monthly);
  }

  // Helper to get week number of year
  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  const fetchMoodTrends = async () => {
    const now = new Date();
    let labels: string[] = [];
    let moodByLabel: Record<string, { sum: number, count: number, responses: number }> = {};
    let groupBy: 'day' | 'week' | 'month' = 'day';
    let rangeStart = new Date(now);

    if (selectedTimeframe === '7d') {
      groupBy = 'day';
      rangeStart.setDate(now.getDate() - 6);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
        labels.push(label);
        moodByLabel[label] = { sum: 0, count: 0, responses: 0 };
      }
    } else if (selectedTimeframe === '30d' || selectedTimeframe === '90d') {
      groupBy = 'week';
      const weeks = selectedTimeframe === '30d' ? 4 : 13;
      rangeStart.setDate(now.getDate() - (weeks * 7 - 1));
      for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i * 7);
        const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        labels.push(label);
        moodByLabel[label] = { sum: 0, count: 0, responses: 0 };
      }
    } else if (selectedTimeframe === '1y') {
      groupBy = 'month';
      rangeStart.setMonth(now.getMonth() - 11);
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        labels.push(label);
        moodByLabel[label] = { sum: 0, count: 0, responses: 0 };
      }
    }

    // Query mood_checkins in range
    const { data: moods, error } = await supabase
      .from('mood_checkins')
      .select('mood_score, created_at')
      .gte('created_at', rangeStart.toISOString());
    if (error) throw error;

    // Group by label
    moods?.forEach(m => {
      const d = new Date(m.created_at);
      let label = '';
      if (groupBy === 'day') {
        label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      } else if (groupBy === 'week') {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (moodByLabel[label]) {
        moodByLabel[label].sum += m.mood_score || 0;
        moodByLabel[label].count++;
        moodByLabel[label].responses++;
      }
    });
    const moodTrends = labels.map(label => {
      const date = new Date(label);
      let displayLabel = '';
      if (groupBy === 'day') {
        displayLabel = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      } else if (groupBy === 'week') {
        displayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        displayLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      const moodValue = moodByLabel[label].count ? Number((moodByLabel[label].sum / moodByLabel[label].count).toFixed(2)) : undefined;
      const base = {
        name: displayLabel,
        responses: moodByLabel[label].responses,
        value: moodValue ?? 0
      };
      return moodValue !== undefined ? { ...base, mood: moodValue } : base;
    });
    setMoodTrends(moodTrends);
  }

  const fetchSubscriptionBreakdown = async () => {
    // Query organizations and group by subscription_status
    const { data, error } = await supabase
      .from('organizations')
      .select('subscription_status')
    if (error) throw error
    const counts: Record<string, number> = {}
    data?.forEach(org => {
      const status = org.subscription_status || 'trial'
      counts[status] = (counts[status] || 0) + 1
    })
    const colorMap: Record<string, string> = {
      active: '#3B82F6',
      professional: '#10B981',
      trial: '#F59E0B',
      inactive: '#EF4444',
      suspended: '#8B5CF6'
    }
    const breakdown = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#6B7280'
    }))
    setSubscriptionData(breakdown)
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Error loading dashboard</h2>
        <p>{error}</p>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-10">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 flex items-center space-x-4 border border-gray-100">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</div>
            <div className="text-gray-600 text-sm">Organizations</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 flex items-center space-x-4 border border-gray-100">
          <Users className="w-8 h-8 text-purple-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
            <div className="text-gray-600 text-sm">Employees</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 flex items-center space-x-4 border border-gray-100">
          <MessageSquare className="w-8 h-8 text-green-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalResponses}</div>
            <div className="text-gray-600 text-sm">Responses</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 flex items-center space-x-4 border border-gray-100">
          <ActivitySquare className="w-8 h-8 text-orange-600" />
            <div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
            <div className="text-gray-600 text-sm">Active Users</div>
          </div>
        </div>
            </div>
            
      {/* Timeline Dropdown */}
      <div className="flex justify-end mb-2">
              <select 
                value={selectedTimeframe}
          onChange={e => setSelectedTimeframe(e.target.value)}
          className="bg-white/70 border border-gray-300 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
        </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-blue-600" />Monthly Trends</h2>
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
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                tick={(props) => (
                  <CustomXAxisTick
                    {...props}
                    selectedTimeframe={selectedTimeframe}
                  />
                )}
              />
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
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-purple-600" />Mood Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                tick={(props) => (
                  <CustomXAxisTick
                    {...props}
                    selectedTimeframe={selectedTimeframe}
                  />
                )}
              />
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
        </div>
        </div>

        {/* Organizations Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Building2 className="w-5 h-5 mr-2 text-blue-600" />Organizations</h2>
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
                  <td className="py-3 px-4 text-gray-700">Ksh {org.revenue}/mo</td>
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
                <td className="py-3 px-4 text-gray-700">Ksh {org.revenue}/mo</td>
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

// Custom XAxis tick renderer for better label spacing and formatting
function CustomXAxisTick({ x, y, payload, index, selectedTimeframe }: {
  x: number;
  y: number;
  payload: { value: string };
  index: number;
  selectedTimeframe: string;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={13}>
        {payload.value}
      </text>
    </g>
  );
}
