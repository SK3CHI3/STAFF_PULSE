'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase'
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { setHours, setMinutes } from 'date-fns';

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
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedDept, setSelectedDept] = useState('all')
  const [sendType, setSendType] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<{ name: string; count: number }[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null })
  const [recurrence, setRecurrence] = useState<'once' | 'weekly'>('once')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]

  // Mock departments (replace with real fetch if needed)
  const mockDepartments = [
    { name: 'All Departments', value: 'all' },
    { name: 'Engineering', value: 'Engineering' },
    { name: 'Design', value: 'Design' },
    { name: 'Marketing', value: 'Marketing' },
    { name: 'Sales', value: 'Sales' },
  ]

  // Add new state for dashboard metrics
  const [employeeStats, setEmployeeStats] = useState({ total: 0, avgMood: 0, responseRate: 0 });
  const [employeeStatsLoading, setEmployeeStatsLoading] = useState(true);
  const [employeeStatsError, setEmployeeStatsError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  const [recentResponsesLoading, setRecentResponsesLoading] = useState(true);
  const [recentResponsesError, setRecentResponsesError] = useState<string | null>(null);

  const [moodTrends, setMoodTrends] = useState<any[]>([]);
  const [moodTrendsLoading, setMoodTrendsLoading] = useState(true);
  const [moodTrendsError, setMoodTrendsError] = useState<string | null>(null);

  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => { setHasHydrated(true) }, [])
  // In all places where toLocaleDateString is used for chart labels, use:
  // hasHydrated ? new Date(...).toLocaleDateString() : new Date(...).toISOString().slice(0,10)

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

  // Helper to process moodTrends into chart data
  const processMoodTrends = useCallback(() => {
    if (moodTrendsLoading || moodTrendsError) return [];
    if (!moodTrends || moodTrends.length === 0) return [];

    // Try to extract a time series from moodTrends (AI insights)
    // If insights have a date and average mood, use those
    // Otherwise, fallback to static data
    // Example: [{ created_at, data_points: { average_mood } }]
    let chartData: { day: string, mood: number }[] = [];
    if (timeRange === '7d') {
      // Use last 7 days
      chartData = moodTrends
        .filter((insight: any) => insight.created_at && insight.data_points && insight.data_points.average_mood)
        .slice(0, 7)
        .map((insight: any) => ({
          day: hasHydrated ? new Date(insight.created_at).toLocaleDateString(undefined, { weekday: 'short' }) : insight.created_at.slice(0, 10),
          mood: Number(insight.data_points.average_mood)
        }));
    } else if (timeRange === '30d') {
      // Group by week (4 weeks)
      const weeks: { [key: string]: number[] } = {};
      moodTrends.forEach((insight: any) => {
        if (insight.created_at && insight.data_points && insight.data_points.average_mood) {
          const date = new Date(insight.created_at);
          const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
          if (!weeks[week]) weeks[week] = [];
          weeks[week].push(Number(insight.data_points.average_mood));
        }
      });
      chartData = Object.entries(weeks).slice(-4).map(([week, moods]) => ({
        day: week,
        mood: moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
      }));
    } else if (timeRange === '90d') {
      // Group by month (3 months)
      const months: { [key: string]: number[] } = {};
      moodTrends.forEach((insight: any) => {
        if (insight.created_at && insight.data_points && insight.data_points.average_mood) {
          const date = new Date(insight.created_at);
          const month = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
          if (!months[month]) months[month] = [];
          months[month].push(Number(insight.data_points.average_mood));
        }
      });
      chartData = Object.entries(months).slice(-3).map(([month, moods]) => ({
        day: month,
        mood: moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
      }));
    }
    // Fallback to static data if not enough points
    if (chartData.length === 0) {
      if (timeRange === '7d') {
        chartData = [
        { day: 'Mon', mood: 3.8 },
        { day: 'Tue', mood: 4.2 },
        { day: 'Wed', mood: 4.0 },
        { day: 'Thu', mood: 4.4 },
        { day: 'Fri', mood: 4.1 },
        { day: 'Sat', mood: 3.9 },
        { day: 'Sun', mood: 4.3 },
        ];
    } else if (timeRange === '30d') {
        chartData = [
        { day: 'Week 1', mood: 4.0 },
        { day: 'Week 2', mood: 4.2 },
        { day: 'Week 3', mood: 4.1 },
        { day: 'Week 4', mood: 4.3 },
        ];
    } else if (timeRange === '90d') {
        chartData = [
          { day: 'Jan', mood: 4.1 },
          { day: 'Feb', mood: 4.0 },
          { day: 'Mar', mood: 4.2 },
        ];
      }
    }
    return chartData;
  }, [moodTrends, moodTrendsLoading, moodTrendsError, timeRange, hasHydrated]);

  // Fetch departments when modal opens
  useEffect(() => {
    if (showCheckinModal) {
      setDepartmentsLoading(true);
      // Fetch unique departments for the current org
      const fetchDepartments = async () => {
        const profileStr = localStorage.getItem('profile');
        let orgId = '';
        if (profileStr) {
          try {
            const parsed = JSON.parse(profileStr);
            orgId = parsed.organization?.id || parsed.organization_id || '';
          } catch {}
        }
        if (!orgId) {
          setDepartments([]);
          setDepartmentsLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('employees')
          .select('department')
          .eq('organization_id', orgId)
          .neq('department', null);
        if (error) {
          setDepartments([]);
          setDepartmentsLoading(false);
          setToast({ message: 'Failed to load departments', type: 'error' });
          return;
        }
        const unique = Array.from(new Set((data || []).map((e: any) => e.department))).filter(Boolean);
        setDepartments([{ name: 'All Departments', count: 0 }, ...unique.map((name: string) => ({ name, count: 0 }))]);
        setDepartmentsLoading(false);
      };
      fetchDepartments();
    }
  }, [showCheckinModal]);

  // Fetch employee stats (total, avg mood, response rate)
  const fetchEmployeeStats = useCallback(async (orgId: string) => {
    setEmployeeStatsLoading(true);
    setEmployeeStatsError(null);
    try {
      const res = await fetch(`/api/employees?organizationId=${orgId}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch employees');
      const employees = result.employees || [];
      const total = employees.length;
      let totalResponses = 0;
      let moodSum = 0;
      let moodCount = 0;
      employees.forEach((emp: any) => {
        if (typeof emp.response_count === 'number') totalResponses += emp.response_count;
        if (typeof emp.avg_mood === 'number') {
          moodSum += emp.avg_mood;
          moodCount++;
        }
      });
      const avgMood = moodCount > 0 ? moodSum / moodCount : 0;
      // For response rate, assume 1 check-in per week per employee (or adjust as needed)
      const responseRate = total > 0 ? Math.round((totalResponses / total) * 100) : 0;
      setEmployeeStats({ total, avgMood, responseRate });
    } catch (err: any) {
      setEmployeeStatsError(err.message || 'Failed to fetch employee stats');
    } finally {
      setEmployeeStatsLoading(false);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async (orgId: string) => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const res = await fetch(`/api/super-admin/system-health?organizationId=${orgId}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch alerts');
      // Only unresolved/active alerts
      const activeAlerts = (result.alerts || []).filter((a: any) => !a.resolved);
      setAlerts(activeAlerts);
    } catch (err: any) {
      setAlertsError(err.message || 'Failed to fetch alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Fetch recent responses
  const fetchRecentResponses = useCallback(async (orgId: string) => {
    setRecentResponsesLoading(true);
    setRecentResponsesError(null);
    try {
      const res = await fetch(`/api/whatsapp/send-checkin?organizationId=${orgId}&limit=4`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch responses');
      setRecentResponses(result.data || []);
    } catch (err: any) {
      setRecentResponsesError(err.message || 'Failed to fetch responses');
    } finally {
      setRecentResponsesLoading(false);
    }
  }, []);

  // Fetch mood trends (use AI insights or mood_checkins as available)
  const fetchMoodTrends = useCallback(async (orgId: string) => {
    setMoodTrendsLoading(true);
    setMoodTrendsError(null);
    try {
      // For now, use AI insights endpoint for mood trends
      const res = await fetch(`/api/ai/insights?organizationId=${orgId}&limit=50`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch mood trends');
      // If insights have trend data, extract it; else fallback to empty
      // (You may want to adjust this logic based on your actual data)
      setMoodTrends(result.insights || []);
    } catch (err: any) {
      setMoodTrendsError(err.message || 'Failed to fetch mood trends');
    } finally {
      setMoodTrendsLoading(false);
    }
  }, []);

  // Fetch all dashboard data when profile is loaded
  useEffect(() => {
    if (profile?.organization?.id) {
      fetchEmployeeStats(profile.organization.id);
      fetchAlerts(profile.organization.id);
      fetchRecentResponses(profile.organization.id);
      fetchMoodTrends(profile.organization.id);
    }
  }, [profile, fetchEmployeeStats, fetchAlerts, fetchRecentResponses, fetchMoodTrends]);

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const [saving, setSaving] = useState(false);

  const handleSendCheckin = async () => {
    setSaving(true);
    setShowCheckinModal(false);
    try {
      if (sendType === 'schedule') {
        // Call API to schedule (with recurrence)
        const profileStr = localStorage.getItem('profile');
        let orgId = '', userId = '';
        if (profileStr) {
          try {
            const parsed = JSON.parse(profileStr);
            orgId = parsed.organization?.id || parsed.organization_id || '';
            userId = parsed.id || '';
          } catch {}
        }
        if (!orgId || !userId) {
          setToast({ message: 'User or organization not found. Please log in again.', type: 'error' });
          setSaving(false);
          return;
        }
        const payload = {
          organization_id: orgId,
          department: selectedDept === 'All Departments' ? null : selectedDept,
          scheduled_at: scheduleDate ? scheduleDate.toISOString() : '',
          created_by: userId,
          message: '',
          recurrence,
          day_of_week: recurrence === 'weekly' ? dayOfWeek : null,
        };
        console.log('Schedule payload:', payload);
        const res = await fetch('/api/checkins/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setToast({ message: 'Check-in scheduled!', type: 'success' });
        } else {
          const result = await res.json();
          setToast({ message: result.error || 'Failed to schedule check-in', type: 'error' });
        }
      } else {
        setToast({ message: 'Check-in sent!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: null }), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                onClick={() => setShowCheckinModal(true)}
              >
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
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {employeeStatsLoading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></span>
                  ) : employeeStatsError ? (
                    <span className="text-red-600">{employeeStatsError}</span>
                  ) : (
                    employeeStats.total
                  )}
                </p>
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
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {employeeStatsLoading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></span>
                  ) : employeeStatsError ? (
                    <span className="text-red-600">{employeeStatsError}</span>
                  ) : (
                    employeeStats.responseRate
                  )}%
                </p>
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
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {employeeStatsLoading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></span>
                  ) : employeeStatsError ? (
                    <span className="text-red-600">{employeeStatsError}</span>
                  ) : (
                    employeeStats.avgMood.toFixed(1)
                  )}</p>
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
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {alertsLoading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mr-2"></span>
                  ) : alertsError ? (
                    <span className="text-red-600">{alertsError}</span>
                  ) : (
                    alerts.length
                  )}
                </p>
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
              {moodTrendsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                  <span className="ml-2 text-gray-700">Loading mood trends...</span>
                </div>
              ) : moodTrendsError ? (
                <div className="flex items-center justify-center h-full text-red-600">{moodTrendsError}</div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processMoodTrends()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
              )}
            </div>
          </div>

          {/* Recent Responses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Responses</h2>

            <div className="space-y-4">
              {recentResponsesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></span>
                  <span className="ml-2 text-gray-700">Loading responses...</span>
                </div>
              ) : recentResponsesError ? (
                <div className="text-center text-red-600 py-8">{recentResponsesError}</div>
              ) : recentResponses.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent responses yet.</div>
              ) : (
                recentResponses.map((response, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">{response.response_count || 0}</span>
                </div>
                <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{response.employee_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {response.sent_at ? new Date(response.sent_at).toLocaleDateString() : 'N/A'} • {response.department || 'N/A'}
                      </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
                ))
              )}
            </div>

            <button className="w-full mt-6 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors py-2 rounded-lg hover:bg-blue-50">
              View All Responses
            </button>
          </div>
        </div>

        {/* Check-in Modal */}
        {showCheckinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowCheckinModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-gray-900">Send Check-in</h2>
              <div className="mb-4">
                <label className="block text-gray-900 font-medium mb-2">Department</label>
                {departmentsLoading ? (
                  <div className="flex items-center space-x-2 text-gray-700"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></span> Loading...</div>
                ) : departments.length > 1 ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                  >
                    {departments.map(dept => (
                      <option key={dept.name} value={dept.name} className="text-gray-900">{dept.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-700 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    No departments found. The check-in will be sent to all employees.
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-medium mb-2">Send Type</label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center text-gray-900">
                    <input
                      type="radio"
                      name="sendType"
                      value="now"
                      checked={sendType === 'now'}
                      onChange={() => setSendType('now')}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Send Now</span>
                  </label>
                  <label className="flex items-center text-gray-900">
                    <input
                      type="radio"
                      name="sendType"
                      value="schedule"
                      checked={sendType === 'schedule'}
                      onChange={() => setSendType('schedule')}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Schedule</span>
                  </label>
                </div>
              </div>
              {sendType === 'schedule' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-900 font-medium mb-2">Schedule Date & Time</label>
                    <ReactDatePicker
                      selected={scheduleDate}
                      onChange={date => {
                        setScheduleDate(date);
                        // Validate date: must be in the future
                        if (!date || date <= new Date()) {
                          setDateError('Please select a future date and time.');
                        } else {
                          setDateError(null);
                        }
                      }}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      minDate={new Date()}
                      minTime={setHours(setMinutes(new Date(), 0), 0)}
                      maxTime={setHours(setMinutes(new Date(), 45), 23)}
                      className={`w-full px-3 py-2 border ${dateError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900`}
                      placeholderText="Select date and time"
                    />
                    {dateError && <div className="text-red-600 text-sm mt-1">{dateError}</div>}
                  </div>
                  <div className="mb-4 border border-blue-200 rounded-lg p-3 bg-blue-50">
                    <div className="font-semibold text-blue-700 mb-2">Automate</div>
                    <div className="mb-3">
                      <label className="block text-gray-900 font-medium mb-1">Recurrence</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={recurrence}
                        onChange={e => setRecurrence(e.target.value as 'once' | 'weekly')}
                      >
                        <option value="once">Once</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    {recurrence === 'weekly' && (
                      <div>
                        <label className="block text-gray-900 font-medium mb-1">Day of Week</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          value={dayOfWeek}
                          onChange={e => setDayOfWeek(Number(e.target.value))}
                        >
                          {daysOfWeek.map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-2 flex items-center justify-center"
                onClick={handleSendCheckin}
                disabled={saving || !!dateError || (sendType === 'schedule' && (!scheduleDate || (recurrence === 'weekly' && dayOfWeek === null)))}
              >
                {saving ? (
                  <span className="flex items-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>Saving...</span>
                ) : (
                  <span className="text-white">{sendType === 'now' ? 'Send Now' : 'Save Schedule'}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.message && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
            onAnimationEnd={() => setToast({ message: '', type: null })}
          >
            {toast.message}
          </div>
        )}

      </main>
    </div>
  );
}
