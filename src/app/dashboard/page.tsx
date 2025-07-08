'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  organization: {
    id: string
    name: string
    subscription_plan: string
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  // Mood data state for dynamic chart
  const [moodData, setMoodData] = useState([
    { day: 'Mon', mood: 3.8 },
    { day: 'Tue', mood: 4.2 },
    { day: 'Wed', mood: 4.0 },
    { day: 'Thu', mood: 4.4 },
    { day: 'Fri', mood: 4.1 },
    { day: 'Sat', mood: 3.9 },
    { day: 'Sun', mood: 4.3 },
  ])

  // Try to load cached profile from localStorage first
  useEffect(() => {
    const cachedProfile = localStorage.getItem('profile')
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile)
        // Ensure organization is a single object, not array
        let org = parsed.organization
        if (Array.isArray(org)) {
          org = org[0] || { id: '', name: '', subscription_plan: '' }
        }
        // Only set if all required fields are present and types match
        if (
          parsed &&
          typeof parsed.id === 'string' &&
          typeof parsed.first_name === 'string' &&
          typeof parsed.last_name === 'string' &&
          typeof parsed.email === 'string' &&
          typeof parsed.role === 'string' &&
          org &&
          typeof org.id === 'string' &&
          typeof org.name === 'string' &&
          typeof org.subscription_plan === 'string'
        ) {
          setProfile({
            id: parsed.id,
            first_name: parsed.first_name,
            last_name: parsed.last_name,
            email: parsed.email,
            role: parsed.role,
            organization: {
              id: org.id,
              name: org.name,
              subscription_plan: org.subscription_plan
            }
          })
          setLoading(false)
        }
      } catch (e) {
        // Ignore invalid cache
      }
    }
  }, [])

  useEffect(() => {
    async function loadUserData() {
      const start = performance.now();
      try {
        const { user: currentUser, error: userError } = await getCurrentUser()
        if (userError || !currentUser) {
          // Redirect to login if not authenticated
          window.location.href = '/auth/login'
          return
        }
        setUser(currentUser)

        // Get user profile with organization
        const { data: profileData, error: profileError } = await getUserProfile(currentUser.id)

        if (profileError) {
          console.error('Failed to load profile:', profileError)
        } else if (profileData) {
          // Ensure organization is a valid object before saving
          let orgCandidate = profileData.organization
          let org: { id: string; name: string; subscription_plan: string } = { id: '', name: '', subscription_plan: '' }
          if (Array.isArray(orgCandidate) && orgCandidate.length > 0 && typeof orgCandidate[0] === 'object') {
            org = orgCandidate[0] as { id: string; name: string; subscription_plan: string }
          } else if (orgCandidate && typeof orgCandidate === 'object' && !Array.isArray(orgCandidate)) {
            org = orgCandidate as { id: string; name: string; subscription_plan: string }
          }
          const safeProfile = {
            id: profileData.id || '',
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
            role: profileData.role || '',
            organization: org
          }
          setProfile(safeProfile)
          localStorage.setItem('profile', JSON.stringify(safeProfile))
        }

      } catch (error) {
        console.error('Error loading user data:', error)
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
        const duration = performance.now() - start;
        console.log(`[PERF] Dashboard user/profile load took ${duration.toFixed(2)}ms`);
      }
    }

    loadUserData()
  }, [])

  // MOCK DATA for dashboard stats and profile
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setProfile({
        id: '1',
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        role: 'hr_admin',
        organization: {
          id: 'org1',
          name: 'Acme Corp',
          subscription_plan: 'pro'
        }
      })
      setLoading(false)
    }, 500)
  }, [])

  // Helper to get last N month names
  function getLastNMonths(n: number) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(months[d.getMonth()]);
    }
    return result;
  }

  // Update mood data when timeRange changes (ready for real data fetch)
  useEffect(() => {
    if (timeRange === '7d') {
      setMoodData([
        { day: 'Mon', mood: 3.8 },
        { day: 'Tue', mood: 4.2 },
        { day: 'Wed', mood: 4.0 },
        { day: 'Thu', mood: 4.4 },
        { day: 'Fri', mood: 4.1 },
        { day: 'Sat', mood: 3.9 },
        { day: 'Sun', mood: 4.3 },
      ])
    } else if (timeRange === '30d') {
      setMoodData([
        { day: 'Week 1', mood: 4.0 },
        { day: 'Week 2', mood: 4.2 },
        { day: 'Week 3', mood: 4.1 },
        { day: 'Week 4', mood: 4.3 },
      ])
    } else if (timeRange === '90d') {
      const last3Months = getLastNMonths(3);
      setMoodData([
        { day: last3Months[0], mood: 4.1 },
        { day: last3Months[1], mood: 4.0 },
        { day: last3Months[2], mood: 4.2 },
      ])
    }
  }, [timeRange])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!profile && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center">
        <div className="glass backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-md"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StaffPulse Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Welcome back, {profile?.first_name}! {profile?.organization?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Check-in</span>
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Report</span>
              </button>
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                <p className="text-xs text-green-600 mt-1">+2 this month</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">87%</p>
                <p className="text-xs text-green-600 mt-1">+5% from last week</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Mood</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">4.2</p>
                <p className="text-xs text-blue-600 mt-1">Excellent range</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">2</p>
                <p className="text-xs text-orange-600 mt-1">Needs attention</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Trends Chart (Redesigned) */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Mood Trends</h2>
                <p className="text-gray-500 text-xs">Average daily mood score ({timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 3 months'})</p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3BB273" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3BB273" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tickCount={5} tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }} formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: '#3BB273', fontWeight: 500, fontSize: 14 }} />
                  <Area type="monotone" dataKey="mood" name="Average Mood" stroke="#3BB273" fillOpacity={1} fill="url(#colorMood)" dot={{ r: 5, fill: '#3BB273', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Responses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Responses</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">5</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Sarah K.</p>
                  <p className="text-xs text-gray-500">2 hours ago • Engineering</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">John D.</p>
                  <p className="text-xs text-gray-500">4 hours ago • Marketing</p>
                </div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">4</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Mary L.</p>
                  <p className="text-xs text-gray-500">6 hours ago • Design</p>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Alex M.</p>
                  <p className="text-xs text-gray-500">8 hours ago • Sales</p>
                </div>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>

            <button className="w-full mt-6 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors py-2 rounded-lg hover:bg-blue-50">
              View All Responses
            </button>
          </div>
        </div>


      </main>
    </div>
  );
}
