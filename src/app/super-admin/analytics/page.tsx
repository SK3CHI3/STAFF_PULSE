'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts'
import { DollarSign, TrendingUp, Users, ArrowDown } from 'lucide-react'

interface AnalyticsData {
  userGrowth: any[]
  revenueData: any[]
  engagementMetrics: any[]
  retentionData: any[]
  usagePatterns: any[]
}

export default function SuperAdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: [],
    revenueData: [],
    engagementMetrics: [],
    retentionData: [],
    usagePatterns: []
  })
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchAnalyticsData()
    }
  }, [profile, selectedTimeframe])

  const fetchAnalyticsData = async () => {
    try {
      setDataLoading(true)
      // Fetch real analytics data from Supabase
      const [userGrowth, revenueData, engagementMetrics, retentionData, usagePatterns] = await Promise.all([
        fetchUserGrowthData(),
        fetchRevenueData(),
        fetchEngagementMetrics(),
        fetchRetentionData(),
        fetchUsagePatterns()
      ])
      setAnalyticsData(data => ({
        ...data,
        userGrowth,
        revenueData,
        engagementMetrics,
        retentionData,
        usagePatterns
      }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDataLoading(false)
    }
  }

  // Fetch user growth data (organizations, employees, active users)
  const fetchUserGrowthData = async () => {
    const now = new Date();
    let labels: string[] = [];
    let groupBy: 'day' | 'week' | 'month' = 'month';
    let rangeStart = new Date(now);
    if (selectedTimeframe === '7d') {
      groupBy = 'day';
      rangeStart.setDate(now.getDate() - 6);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' }));
      }
    } else if (selectedTimeframe === '30d' || selectedTimeframe === '90d') {
      groupBy = 'week';
      const weeks = selectedTimeframe === '30d' ? 4 : 13;
      rangeStart.setDate(now.getDate() - (weeks * 7 - 1));
      for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i * 7);
        labels.push(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    } else if (selectedTimeframe === '1y') {
      groupBy = 'month';
      rangeStart.setMonth(now.getMonth() - 11);
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
    }
    // Query organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, created_at')
      .gte('created_at', rangeStart.toISOString());
    if (orgsError) throw orgsError;
    // Query employees
    const { data: emps, error: empsError } = await supabase
      .from('employees')
      .select('id, created_at')
      .gte('created_at', rangeStart.toISOString());
    if (empsError) throw empsError;
    // Query active users (profiles updated in range)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .gte('updated_at', rangeStart.toISOString());
    if (profilesError) throw profilesError;
    // Group by label
    const orgsByLabel = Object.fromEntries(labels.map(l => [l, 0]));
    const empsByLabel = Object.fromEntries(labels.map(l => [l, 0]));
    const activeByLabel = Object.fromEntries(labels.map(l => [l, 0]));
    orgs?.forEach(org => {
      const d = new Date(org.created_at);
      let label = '';
      if (groupBy === 'day') label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      else if (groupBy === 'week') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      else label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (orgsByLabel[label] !== undefined) orgsByLabel[label]++;
    });
    emps?.forEach(emp => {
      const d = new Date(emp.created_at);
      let label = '';
      if (groupBy === 'day') label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      else if (groupBy === 'week') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      else label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (empsByLabel[label] !== undefined) empsByLabel[label]++;
    });
    profiles?.forEach(profile => {
      const d = new Date(profile.updated_at);
      let label = '';
      if (groupBy === 'day') label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      else if (groupBy === 'week') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      else label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (activeByLabel[label] !== undefined) activeByLabel[label]++;
    });
    return labels.map(label => ({
      name: label,
      organizations: orgsByLabel[label],
      employees: empsByLabel[label],
      activeUsers: activeByLabel[label]
    }));
  }

  // Fetch revenue data (sum of org revenue, MRR, churn placeholder)
  const fetchRevenueData = async () => {
    const now = new Date();
    let labels: string[] = [];
    let groupBy: 'day' | 'week' | 'month' = 'month';
    let rangeStart = new Date(now);
    if (selectedTimeframe === '7d') {
      groupBy = 'day';
      rangeStart.setDate(now.getDate() - 6);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' }));
      }
    } else if (selectedTimeframe === '30d' || selectedTimeframe === '90d') {
      groupBy = 'week';
      const weeks = selectedTimeframe === '30d' ? 4 : 13;
      rangeStart.setDate(now.getDate() - (weeks * 7 - 1));
      for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i * 7);
        labels.push(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    } else if (selectedTimeframe === '1y') {
      groupBy = 'month';
      rangeStart.setMonth(now.getMonth() - 11);
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
    }
    // Query organizations for revenue
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, created_at, employee_count, subscription_plan')
      .gte('created_at', rangeStart.toISOString());
    if (orgsError) throw orgsError;
    // Group by label
    const revenueByLabel = Object.fromEntries(labels.map(l => [l, 0]));
    orgs?.forEach(org => {
      const d = new Date(org.created_at);
      let label = '';
      if (groupBy === 'day') label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      else if (groupBy === 'week') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      else label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      // Example: revenue = employee_count * plan price (assume 500 for paid, 0 for free)
      let planPrice = org.subscription_plan === 'paid' ? 500 : 0;
      revenueByLabel[label] += (org.employee_count || 0) * planPrice;
    });
    return labels.map(label => ({
      name: label,
      revenue: revenueByLabel[label],
      mrr: revenueByLabel[label], // Placeholder for MRR
      churn: 0 // Placeholder for churn
    }));
  }

  // Fetch engagement metrics (response rate, avg mood, messages per user)
  const fetchEngagementMetrics = async () => {
    const now = new Date();
    let labels: string[] = [];
    let groupBy: 'day' | 'week' | 'month' = 'day';
    let rangeStart = new Date(now);
    if (selectedTimeframe === '7d') {
      groupBy = 'day';
      rangeStart.setDate(now.getDate() - 6);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' }));
      }
    } else if (selectedTimeframe === '30d' || selectedTimeframe === '90d') {
      groupBy = 'week';
      const weeks = selectedTimeframe === '30d' ? 4 : 13;
      rangeStart.setDate(now.getDate() - (weeks * 7 - 1));
      for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i * 7);
        labels.push(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    } else if (selectedTimeframe === '1y') {
      groupBy = 'month';
      rangeStart.setMonth(now.getMonth() - 11);
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
    }
    // Query mood_checkins for response rate and mood
    const { data: moods, error: moodsError } = await supabase
      .from('mood_checkins')
      .select('id, created_at, mood_score, employee_id')
      .gte('created_at', rangeStart.toISOString());
    if (moodsError) throw moodsError;
    // Query employees for denominator
    const { data: emps, error: empsError } = await supabase
      .from('employees')
      .select('id')
    if (empsError) throw empsError;
    // Query messages (if you have a messages table, otherwise skip)
    // We'll estimate messages per user as responses for now
    // Group by label
    const byLabel = Object.fromEntries(labels.map(l => [l, { responses: 0, moodSum: 0, moodCount: 0 }]));
    moods?.forEach(m => {
      const d = new Date(m.created_at);
      let label = '';
      if (groupBy === 'day') label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric', month: 'short' });
      else if (groupBy === 'week') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      else label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (byLabel[label]) {
        byLabel[label].responses++;
        if (m.mood_score) {
          byLabel[label].moodSum += m.mood_score;
          byLabel[label].moodCount++;
        }
      }
    });
    return labels.map(label => {
      const totalEmployees = emps?.length || 1;
      const responseRate = totalEmployees > 0 ? (byLabel[label].responses / totalEmployees) * 100 : 0;
      const avgMood = byLabel[label].moodCount > 0 ? byLabel[label].moodSum / byLabel[label].moodCount : 0;
      return {
        date: label,
        responseRate: Number(responseRate.toFixed(2)),
        avgMood: Number(avgMood.toFixed(2)),
        messagesPerUser: byLabel[label].responses // Placeholder
      };
    });
  }

  // Fetch retention data (cohort analysis, basic)
  const fetchRetentionData = async () => {
    // Cohort: for each month, what percent of users are still active after 1, 2, 3, 6, 12 months
    // We'll use employees as the cohort base
    const { data: emps, error: empsError } = await supabase
      .from('employees')
      .select('id, created_at, updated_at')
    if (empsError) throw empsError;
    // Group employees by signup month
    const cohorts: Record<string, any[]> = {};
    (emps as any[] | undefined)?.forEach(emp => {
      const created = new Date(emp.created_at);
      const cohort = created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!cohorts[cohort]) cohorts[cohort] = [];
      cohorts[cohort].push(emp);
    });
    // For each cohort, calculate retention at 1, 2, 3, 6, 12 months
    const now = new Date();
    const retention = Object.entries(cohorts).map(([cohort, cohortEmps]) => {
      const base = cohortEmps.length;
      const months = [1, 2, 3, 6, 12];
      const rates: Record<string, number> = {};
      months.forEach(m => {
        const retained = (cohortEmps as any[]).filter(emp => {
          if (!emp.updated_at) return false;
          const lastActive = new Date(emp.updated_at);
          const created = new Date(emp.created_at);
          return (lastActive.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30) >= m;
        }).length;
        rates[`month${m}`] = base > 0 ? Math.round((retained / base) * 100) : 0;
      });
      return {
        cohort,
        month1: 100,
        month2: rates['month2'],
        month3: rates['month3'],
        month6: rates['month6'],
        month12: rates['month12']
      };
    });
    return retention;
  }

  // Fetch usage patterns (activity by hour)
  const fetchUsagePatterns = async () => {
    // Group mood_checkins by hour of day for the selected timeframe
    const now = new Date();
    let rangeStart = new Date(now);
    if (selectedTimeframe === '7d') rangeStart.setDate(now.getDate() - 6);
    else if (selectedTimeframe === '30d') rangeStart.setDate(now.getDate() - 29);
    else if (selectedTimeframe === '90d') rangeStart.setDate(now.getDate() - 89);
    else if (selectedTimeframe === '1y') rangeStart.setMonth(now.getMonth() - 11);
    const { data: moods, error } = await supabase
      .from('mood_checkins')
      .select('id, created_at')
      .gte('created_at', rangeStart.toISOString());
    if (error) throw error;
    // Group by hour
    const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, label: i.toString().padStart(2, '0'), messages: 0, responses: 0 }));
    moods?.forEach(m => {
      const d = new Date(m.created_at);
      const hour = d.getHours();
      byHour[hour].messages++;
      byHour[hour].responses++;
    });
    // Sort by hour to ensure order is 00-23
    byHour.sort((a, b) => a.hour - b.hour);
    return byHour;
  }

  // Helper to get week number of year
  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Custom XAxis tick renderer for better label spacing and formatting
  function CustomXAxisTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={13}>
          {payload.value}
        </text>
      </g>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
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

  if (dataLoading) {
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
        <div className="px-6 py-4 flex items-center">
          <img src="/logo.svg" alt="StaffPulse Logo" className="w-8 h-8 rounded-lg bg-white p-0.5 shadow mr-4" />
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
                className="bg-white/70 border border-gray-300 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </header>

      {/* Content */}
      <main className="px-6 pb-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(() => {
            const revData = analyticsData.revenueData;
            const last = revData[revData.length-1] || {};
            const prev = revData[revData.length-2] || {};
            // Total Revenue
            const totalRevenue = last.revenue || 0;
            const prevRevenue = prev.revenue || 0;
            const revenueChange = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
            // MRR
            const mrr = last.mrr || 0;
            const prevMRR = prev.mrr || 0;
            const mrrChange = prevMRR ? ((mrr - prevMRR) / prevMRR) * 100 : 0;
            // CLV (using churn as placeholder, you may want to replace with real CLV logic)
            const clv = last.churn || 0;
            const prevCLV = prev.churn || 0;
            const clvChange = prevCLV ? ((clv - prevCLV) / prevCLV) * 100 : 0;
            // Churn Rate
            const churn = last.churn || 0;
            const prevChurn = prev.churn || 0;
            const churnChange = prevChurn ? ((churn - prevChurn) / prevChurn) * 100 : 0;
            return <>
              <KPICard
                title="Total Revenue"
                value={`Ksh ${totalRevenue.toLocaleString()}`}
                change={`${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`}
                trend={revenueChange >= 0 ? 'up' : 'down'}
                icon={<DollarSign className="w-6 h-6 text-green-600" />}
              />
              <KPICard
                title="Monthly Recurring Revenue"
                value={`Ksh ${mrr.toLocaleString()}`}
                change={`${mrrChange >= 0 ? '+' : ''}${mrrChange.toFixed(1)}%`}
                trend={mrrChange >= 0 ? 'up' : 'down'}
                icon={<TrendingUp className="w-6 h-6 text-green-600" />}
              />
              <KPICard
                title="Customer Lifetime Value"
                value={`Ksh ${clv.toLocaleString()}`}
                change={`${clvChange >= 0 ? '+' : ''}${clvChange.toFixed(1)}%`}
                trend={clvChange >= 0 ? 'up' : 'down'}
                icon={<Users className="w-6 h-6 text-green-600" />}
              />
              <KPICard
                title="Churn Rate"
                value={`${churn.toFixed(1)}%`}
                change={`${churnChange >= 0 ? '+' : ''}${churnChange.toFixed(1)}%`}
                trend={churnChange >= 0 ? 'up' : 'down'}
                icon={<ArrowDown className="w-6 h-6 text-red-600" />}
              />
            </>;
          })()}
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
                <XAxis dataKey="name" stroke="#6B7280" tick={props => <CustomXAxisTick {...props} />} />
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
                <XAxis dataKey="name" stroke="#6B7280" tick={props => <CustomXAxisTick {...props} />} />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6' }} />
                <Line type="monotone" dataKey="mrr" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B' }} />
              </LineChart>
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
                <XAxis dataKey="date" stroke="#6B7280" tick={props => <CustomXAxisTick {...props} />} />
                <YAxis stroke="#6B7280" domain={[0, 'auto']} />
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
                <XAxis dataKey="label" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="messages" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="responses" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
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
  icon: React.ReactNode
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
