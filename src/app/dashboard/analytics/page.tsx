'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useMemo } from 'react'

interface MoodCheckin {
  mood_score: number
  created_at: string
}
interface Employee {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  department?: string
  position?: string
  is_active: boolean
  mood_checkins?: MoodCheckin[]
}

export default function Analytics() {
  const { profile, loading: authLoading } = useAuth()
  const [timeRange, setTimeRange] = useState('30d')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => { setHasHydrated(true) }, [])

  // Fetch employees and insights
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        // Fetch employees with mood_checkins
        const empRes = await fetch(`/api/employees?organizationId=${profile.organization.id}`)
        const empJson = await empRes.json()
        if (!empJson.success) throw new Error(empJson.error || 'Failed to fetch employees')
        setEmployees(empJson.employees || [])

        // Fetch AI insights
        const insightsRes = await fetch(`/api/ai/insights?organizationId=${profile.organization.id}&limit=50`)
        const insightsJson = await insightsRes.json()
        if (!insightsJson.success) throw new Error(insightsJson.error || 'Failed to fetch insights')
        setInsights(insightsJson.insights || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data')
      } finally {
        setLoading(false)
      }
    }
    if (profile?.organization?.id) fetchData()
  }, [profile?.organization?.id, timeRange])

  // Compute metrics
  let avgMood = 0, responseRate = 0, engagementScore = 0, riskAlerts = 0
  let moodDist: number[] = [0, 0, 0, 0, 0]
  let deptStats: { department: string; score: number; trend: string; color: string }[] = []
  let totalResponses = 0
  let totalPossibleResponses = 0
  let departments: Record<string, number[]> = {}
  let prevPeriodMood = 0
  let prevPeriodDeptMood: Record<string, number[]> = {}

  if (employees.length > 0) {
    // Filter mood_checkins by timeRange
    const now = new Date()
    let days = 30
    if (timeRange === '7d') days = 7
    else if (timeRange === '90d') days = 90
    else if (timeRange === '1y') days = 365
    const since = new Date(now)
    since.setDate(now.getDate() - days)

    let allMoods: number[] = []
    let prevPeriodMoods: number[] = []
    employees.forEach(emp => {
      const moods = (emp.mood_checkins || []).filter((m: MoodCheckin) => new Date(m.created_at) >= since)
      allMoods.push(...moods.map((m: MoodCheckin) => m.mood_score))
      // For previous period
      const prevSince = new Date(since)
      prevSince.setDate(since.getDate() - days)
      const prevMoods = (emp.mood_checkins || []).filter((m: MoodCheckin) => new Date(m.created_at) >= prevSince && new Date(m.created_at) < since)
      prevPeriodMoods.push(...prevMoods.map((m: MoodCheckin) => m.mood_score))
      // Mood distribution
      moods.forEach((m: MoodCheckin) => { if (m.mood_score >= 1 && m.mood_score <= 5) moodDist[m.mood_score - 1]++ })
      // Department stats
      const dept = emp.department || 'Unassigned'
      if (!departments[dept]) departments[dept] = []
      departments[dept].push(...moods.map((m: MoodCheckin) => m.mood_score))
      if (!prevPeriodDeptMood[dept]) prevPeriodDeptMood[dept] = []
      prevPeriodDeptMood[dept].push(...prevMoods.map((m: MoodCheckin) => m.mood_score))
    })
    totalResponses = allMoods.length
    totalPossibleResponses = employees.length * days
    avgMood = allMoods.length > 0 ? allMoods.reduce((a, b) => a + b, 0) / allMoods.length : 0
    prevPeriodMood = prevPeriodMoods.length > 0 ? prevPeriodMoods.reduce((a, b) => a + b, 0) / prevPeriodMoods.length : 0
    responseRate = totalPossibleResponses > 0 ? (totalResponses / totalPossibleResponses) * 100 : 0
    // Engagement score: for now, use response rate scaled to 10
    engagementScore = Math.round((responseRate / 10) * 10) / 10
    // Department stats
    deptStats = Object.entries(departments).map(([dept, moods]) => {
      const avg = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
      const prevAvg = prevPeriodDeptMood[dept] && prevPeriodDeptMood[dept].length > 0 ? prevPeriodDeptMood[dept].reduce((a, b) => a + b, 0) / prevPeriodDeptMood[dept].length : 0
      return { department: dept, score: avg, trend: (avg - prevAvg).toFixed(1), color: avg - prevAvg >= 0 ? 'text-green-600' : 'text-red-600' }
    })
  }

  // Risk alerts from AI insights
  riskAlerts = insights.filter((i: any) => i.severity === 'critical' || i.insight_type === 'risk_detection').length

  // AI Insights for display
  const aiInsights = insights.slice(0, 3)

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">Error loading analytics</div>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 text-sm mt-1">Deep insights into team wellness and engagement</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="p-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Mood</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{avgMood ? avgMood.toFixed(1) : '-'}</p>
                <p className="text-xs text-green-600 mt-1">{(avgMood - prevPeriodMood >= 0 ? '+' : '') + (avgMood - prevPeriodMood).toFixed(1)} from last period</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{responseRate ? responseRate.toFixed(0) + '%' : '-'}</p>
                <p className="text-xs text-green-600 mt-1">{totalResponses} responses</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{engagementScore ? engagementScore.toFixed(1) : '-'}</p>
                <p className="text-xs text-purple-600 mt-1">Based on response rate</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Alerts</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{riskAlerts}</p>
                <p className="text-xs text-orange-600 mt-1">AI detected</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mood Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Mood Distribution</h2>
            <div className="space-y-4">
              {['Excellent (5)', 'Good (4)', 'Neutral (3)', 'Poor (2)', 'Very Poor (1)'].map((mood, i) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
                const total = moodDist.reduce((a, b) => a + b, 0)
                const count = moodDist[4 - i] // Reverse order for display
                const percentage = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${colors[4 - i]}`}></div>
                      <span className="text-sm font-medium text-gray-700">{mood}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                          className={`h-2 rounded-full ${colors[4 - i]}`}
                          style={{ width: `${percentage}%` }}
                      ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Department Comparison */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Department Comparison</h2>
            <div className="space-y-4">
              {deptStats.length === 0 ? (
                <div className="text-gray-500">No department data</div>
              ) : (
                deptStats.map((dept, index) => {
                  const trendNum = Number(dept.trend)
                  return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <span className="font-medium text-gray-900">{dept.department}</span>
                  <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">{dept.score ? dept.score.toFixed(1) : '-'}</span>
                        <span className={`text-sm font-medium ${dept.color}`}>{trendNum >= 0 ? '+' : ''}{trendNum.toFixed(1)}</span>
                  </div>
                </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
        {/* Insights and Recommendations */}
      </main>
    </div>
  )
}
