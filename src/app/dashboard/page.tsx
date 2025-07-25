'use client'

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState, ErrorState } from '@/components/LoadingState'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { setHours, setMinutes } from 'date-fns';


function Dashboard() {
  const { profile, signOut } = useAuth()
  const router = useRouter()


  // Removed old loading state - now using consolidated dashboardState
  const [timeRange, setTimeRange] = useState('7d')
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedDept, setSelectedDept] = useState('All Departments')
  const [sendType, setSendType] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<{ name: string; count: number }[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null })
  const [recurrence, setRecurrence] = useState<'once' | 'weekly'>('once')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]

  // Removed complex loading components - keeping it simple like other pages



  // Simple state management (matching other pages exactly)
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    avgMood: 0,
    responseRate: 0,
    totalLastMonth: 0,
    responseRateLastWeek: 0,
    moodCategory: 'Unknown'
  })
  const [alerts, setAlerts] = useState<any[]>([])
  const [recentResponses, setRecentResponses] = useState<any[]>([])
  const [moodTrends, setMoodTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => { setHasHydrated(true) }, [])



  // Simple fetch employee stats (matching other pages pattern)
  const fetchEmployeeStats = async (orgId: string) => {
    try {
      // Get current date ranges
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all employees with mood check-ins and creation dates
      const { data, error } = await supabase
        .from('employees')
        .select('id, created_at, mood_checkins(mood_score, created_at)')
        .eq('organization_id', orgId);

      if (error) throw error;

      const total = data?.length || 0;

      // Calculate employees created last month for trend
      const totalLastMonth = data?.filter(emp =>
        new Date(emp.created_at) >= oneMonthAgo
      ).length || 0;

      // Get all mood check-ins with dates
      const allMoodCheckins = data?.flatMap(emp =>
        emp.mood_checkins?.map(c => ({
          mood_score: c.mood_score,
          created_at: new Date(c.created_at)
        })) || []
      ) || [];

      // Current period calculations
      const allMoods = allMoodCheckins.map(c => c.mood_score);
      const avgMood = allMoods.length > 0 ? allMoods.reduce((a, b) => a + b, 0) / allMoods.length : 0;
      const responseRate = total > 0 ? (allMoods.length / total) * 100 : 0;

      // Last week's response rate for comparison
      const lastWeekCheckins = allMoodCheckins.filter(c => c.created_at >= oneWeekAgo);
      const responseRateLastWeek = total > 0 ? (lastWeekCheckins.length / total) * 100 : 0;

      // Mood category based on average
      let moodCategory = 'Unknown';
      if (avgMood >= 4.5) moodCategory = 'Excellent';
      else if (avgMood >= 3.5) moodCategory = 'Good';
      else if (avgMood >= 2.5) moodCategory = 'Fair';
      else if (avgMood > 0) moodCategory = 'Needs attention';

      setEmployeeStats({
        total,
        avgMood,
        responseRate,
        totalLastMonth,
        responseRateLastWeek,
        moodCategory
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch employee stats');
    }
  };

  // Simple fetch alerts (matching other pages pattern)
  const fetchAlerts = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch alerts');
    }
  };

  // Simple fetch recent responses (matching other pages pattern)
  const fetchRecentResponses = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('mood_checkins')
        .select(`
          *,
          employees(first_name, last_name, department),
          organization:organizations(anonymous_allowed)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentResponses(data || []);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch recent responses');
    }
  };

  // Simple fetch mood trends (matching other pages pattern)
  const fetchMoodTrends = async (orgId: string) => {
    try {
      // Get mood check-ins for the organization with employee data
      const { data, error } = await supabase
        .from('mood_checkins')
        .select(`
          mood_score,
          created_at,
          employees!inner(organization_id)
        `)
        .eq('employees.organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1000); // Get more data for better trend analysis

      if (error) throw error;
      setMoodTrends(data || []);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch mood trends');
    }
  };

  // Simple chart data processing (matching other pages pattern)
  const chartData = useMemo(() => {
    if (!moodTrends || moodTrends.length === 0) return [];

    const now = new Date();
    let processedData: { day: string, mood: number }[] = [];

    if (timeRange === '7d') {
      // Group by day for last 7 days
      const dailyMoods: { [key: string]: number[] } = {};

      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayKey = date.toISOString().split('T')[0];
        dailyMoods[dayKey] = [];
      }

      // Group mood check-ins by day
      moodTrends.forEach((checkin: any) => {
        const checkinDate = new Date(checkin.created_at);
        const dayKey = checkinDate.toISOString().split('T')[0];
        if (dailyMoods.hasOwnProperty(dayKey)) {
          dailyMoods[dayKey].push(checkin.mood_score);
        }
      });

      // Calculate daily averages
      processedData = Object.entries(dailyMoods).map(([dayKey, moods]) => ({
        day: hasHydrated ? new Date(dayKey).toLocaleDateString(undefined, { weekday: 'short' }) : dayKey.slice(5),
        mood: moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
      }));

    } else if (timeRange === '30d') {
      // Group by week for last 30 days
      const weeklyMoods: { [key: string]: number[] } = {};

      moodTrends.forEach((checkin: any) => {
        const checkinDate = new Date(checkin.created_at);
        const weekStart = new Date(checkinDate);
        weekStart.setDate(checkinDate.getDate() - checkinDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyMoods[weekKey]) weeklyMoods[weekKey] = [];
        weeklyMoods[weekKey].push(checkin.mood_score);
      });

      processedData = Object.entries(weeklyMoods)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-4) // Last 4 weeks
        .map(([weekKey, moods]) => ({
          day: hasHydrated ? `Week of ${new Date(weekKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : weekKey.slice(5),
          mood: moods.reduce((a, b) => a + b, 0) / moods.length
        }));

    } else if (timeRange === '90d') {
      // Group by month for last 90 days
      const monthlyMoods: { [key: string]: number[] } = {};

      moodTrends.forEach((checkin: any) => {
        const checkinDate = new Date(checkin.created_at);
        const monthKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMoods[monthKey]) monthlyMoods[monthKey] = [];
        monthlyMoods[monthKey].push(checkin.mood_score);
      });

      processedData = Object.entries(monthlyMoods)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-3) // Last 3 months
        .map(([monthKey, moods]) => ({
          day: hasHydrated ? new Date(monthKey + '-01').toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : monthKey,
          mood: moods.reduce((a, b) => a + b, 0) / moods.length
        }));
    }

    // Filter out days with no data (mood = 0) and return only actual data
    return processedData.filter(item => item.mood > 0);
  }, [moodTrends, timeRange, hasHydrated]);

  // Simple refresh function for the refresh button
  const refreshDashboard = async () => {
    if (!profile?.organization?.id) return
    setLoading(true)
    setError(null)
    try {
      await fetchEmployeeStats(profile.organization.id)
      await fetchAlerts(profile.organization.id)
      await fetchRecentResponses(profile.organization.id)
      await fetchMoodTrends(profile.organization.id)
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard data')
    }
    setLoading(false)
  }

  // Export organization data
  const handleExportReport = async () => {
    if (!profile?.organization?.id) return;

    setExporting(true);
    try {
      const response = await fetch(`/api/organization/export?organizationId=${profile.organization.id}`);

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `organization_export_${profile.organization.id}.zip`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Export error:', error);
      setToast({
        message: error.message || 'Failed to export report',
        type: 'error'
      });
    } finally {
      setExporting(false);
    }
  };

  // Hydration effect (exactly like other pages)
  useEffect(() => { setHasHydrated(true) }, [])

  // Load dashboard data (exactly like settings page)
  useEffect(() => {
    async function fetchDashboardData() {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        // Sequential fetching (simple and reliable like other pages)
        await fetchEmployeeStats(profile.organization.id)
        await fetchAlerts(profile.organization.id)
        await fetchRecentResponses(profile.organization.id)
        await fetchMoodTrends(profile.organization.id)
      } catch (e: any) {
        setError(e.message || 'Failed to load dashboard data')
      }
      setLoading(false)
    }
    if (profile?.organization?.id) {
      fetchDashboardData()
    }
  }, [profile?.organization?.id])

  // Fetch real departments from database
  const fetchDepartmentsForCheckin = useCallback(async () => {
    if (!profile?.organization?.id) return;

    try {
      // Fetch departments from API
      const res = await fetch(`/api/departments?organizationId=${profile.organization.id}`);
      const result = await res.json();

      if (result.success && result.departments) {
        // Add "All Departments" option at the beginning
        const deptList = [
          { name: 'All Departments', count: 0 },
          ...result.departments.map((d: any) => ({ name: d.name, count: 0 }))
        ];
        setDepartments(deptList);
      } else {
        // Fallback to "All Departments" only
        setDepartments([{ name: 'All Departments', count: 0 }]);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      // Fallback to "All Departments" only
      setDepartments([{ name: 'All Departments', count: 0 }]);
    }
  }, [profile?.organization?.id]);

  // Fetch departments when modal opens
  useEffect(() => {
    if (showCheckinModal && profile?.organization?.id) {
      fetchDepartmentsForCheckin();
    }
  }, [showCheckinModal, profile?.organization?.id, fetchDepartmentsForCheckin]);

  // Toast timer
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: null }), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  // Auth guards are handled by the dashboard layout, no need to duplicate them here

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

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleSendCheckin = async () => {
    console.log('🚀 [Check-in] Starting check-in send process...')
    setSaving(true);
    setShowCheckinModal(false);
    try {
      if (sendType === 'schedule') {
        console.log('📅 [Check-in] Scheduling check-in...')
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
          console.error('❌ [Check-in] Missing organization or user ID')
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
        console.log('📅 [Check-in] Schedule payload:', payload);
        const res = await fetch('/api/checkins/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          console.log('✅ [Check-in] Schedule created successfully')
          setToast({ message: 'Check-in scheduled!', type: 'success' });
        } else {
          const result = await res.json();
          console.error('❌ [Check-in] Schedule failed:', result.error)
          setToast({ message: result.error || 'Failed to schedule check-in', type: 'error' });
        }
      } else {
        console.log('📱 [Check-in] Sending immediate check-in...')
        // Send immediate check-in
        const orgId = profile?.organization?.id;
        console.log('📱 [Check-in] Organization ID:', orgId)

        if (!orgId) {
          console.error('❌ [Check-in] No organization ID found')
          setToast({ message: 'Organization not found. Please refresh and try again.', type: 'error' });
          setSaving(false);
          return;
        }

        const payload = {
          type: 'bulk',
          organizationId: orgId,
          messageType: 'weekly'
        };

        console.log('📱 [Check-in] WhatsApp API payload:', payload);
        const res = await fetch('/api/whatsapp/send-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        console.log('📱 [Check-in] API response status:', res.status)
        const result = await res.json();
        console.log('📱 [Check-in] API response data:', result)

        if (result.success) {
          console.log('✅ [Check-in] Messages sent successfully:', result.successful)
          setToast({
            message: `Check-in sent to ${result.successful || 0} employees!`,
            type: 'success'
          });
        } else {
          console.error('❌ [Check-in] Send failed:', result.error)
          setToast({
            message: result.error || 'Failed to send check-in',
            type: 'error'
          });
        }
      }
    } catch (err) {
      setToast({ message: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Simple auth check - user must have organization_id
  if (!profile?.organization_id) {
    return <LoadingState message="Loading organization data..." />
  }

  // Simple loading check (matching other pages exactly)
  if (loading) {
    return <LoadingState message="Loading dashboard data..." />
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StaffPulse Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Welcome back, {profile?.first_name}! {profile?.organization?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={refreshDashboard}
                disabled={loading}
                className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh dashboard data"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                onClick={() => setShowCheckinModal(true)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Check-in</span>
              </button>
              <button
                onClick={handleExportReport}
                disabled={exporting}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span>{exporting ? 'Exporting...' : 'Export Report'}</span>
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
      <main className="p-6 lg:p-8 space-y-8">
        {/* Simple error display (matching other pages) */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600">{error}</div>
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Total Employees</p>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {employeeStats.total}
                </div>
                <p className={`text-sm font-medium ${employeeStats.totalLastMonth > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  {employeeStats.totalLastMonth > 0 ? `+${employeeStats.totalLastMonth} this month` : 'No new employees this month'}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Response Rate</p>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {`${employeeStats.responseRate.toFixed(1)}%`}
                </div>
                <p className={`text-sm font-medium ${
                  employeeStats.responseRate > employeeStats.responseRateLastWeek ? 'text-green-600' :
                  employeeStats.responseRate < employeeStats.responseRateLastWeek ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {employeeStats.responseRate === employeeStats.responseRateLastWeek ? 'No change from last week' :
                   `${employeeStats.responseRate > employeeStats.responseRateLastWeek ? '+' : ''}${(employeeStats.responseRate - employeeStats.responseRateLastWeek).toFixed(1)}% from last week`}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Average Mood</p>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {employeeStats.avgMood.toFixed(1)}
                </div>
                <p className={`text-sm font-medium ${
                  employeeStats.avgMood >= 4.5 ? 'text-green-600' :
                  employeeStats.avgMood >= 3.5 ? 'text-blue-600' :
                  employeeStats.avgMood >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {employeeStats.moodCategory}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Alerts</p>
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {alerts.length}
                </div>
                <p className={`text-sm font-medium ${
                  alerts.length > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {alerts.length > 0 ? 'Needs attention' : 'All good'}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>



        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mood Trends Chart (Redesigned) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mood Trends</h2>
                <p className="text-gray-600 text-sm">Average daily mood score ({timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 3 months'})</p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm hover:shadow-md transition-shadow"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
            </div>
            <div className="h-72 w-full">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium">No mood data available</p>
                    <p className="text-sm mt-1">Start collecting mood check-ins to see trends here</p>
                  </div>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3BB273" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3BB273" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tickCount={5} tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }} labelStyle={{ color: '#111827' }} formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                  <Area type="monotone" dataKey="mood" name="" stroke="#3BB273" fillOpacity={1} fill="url(#colorMood)" dot={{ r: 5, fill: '#3BB273', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Responses */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Responses</h2>

            <div className="space-y-4">
              {recentResponses.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent responses yet.</div>
              ) : (
                recentResponses.map((response, index) => {
                  // Check if organization allows anonymous responses and if this response is anonymous
                  const orgAllowsAnonymous = response.organization?.anonymous_allowed ?? true;
                  const isAnonymousResponse = response.is_anonymous && orgAllowsAnonymous;

                  const employeeName = isAnonymousResponse
                    ? 'Anonymous Employee'
                    : `${response.employees?.first_name || ''} ${response.employees?.last_name || ''}`.trim() || 'Unknown Employee';

                  const getMoodColor = (score: number) => {
                    if (score >= 4) return 'from-green-100 to-green-200 text-green-600';
                    if (score >= 3) return 'from-yellow-100 to-yellow-200 text-yellow-600';
                    return 'from-red-100 to-red-200 text-red-600';
                  };

                  const getMoodEmoji = (score: number) => {
                    if (score >= 4) return '😊';
                    if (score >= 3) return '😐';
                    return '😔';
                  };

                  const getMoodLabel = (score: number) => {
                    if (score === 5) return 'Excellent';
                    if (score === 4) return 'Good';
                    if (score === 3) return 'Okay';
                    if (score === 2) return 'Challenging';
                    if (score === 1) return 'Difficult';
                    return 'Unknown';
                  };

                  return (
                    <div key={response.id || index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-105">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getMoodColor(response.mood_score || 0)} rounded-xl flex items-center justify-center`}>
                        <span className="font-bold text-lg">{getMoodEmoji(response.mood_score || 0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{employeeName}</p>
                          {isAnonymousResponse && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Anonymous
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {response.created_at ? new Date(response.created_at).toLocaleDateString() : 'N/A'} • {isAnonymousResponse ? 'Anonymous Response' : (response.employees?.department || 'No Department')}
                        </p>
                        {response.response_text && (
                          <p className="text-xs text-gray-600 mt-1 italic">"{response.response_text.substring(0, 50)}{response.response_text.length > 50 ? '...' : ''}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-700">{response.mood_score || 0}</span>
                        <span className="text-xs text-gray-500">{getMoodLabel(response.mood_score || 0)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => router.push('/dashboard/responses')}
              className="w-full mt-8 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-all duration-200 py-3 rounded-xl hover:bg-blue-50 border border-blue-200 hover:border-blue-300 hover:scale-105"
            >
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
                {departments.length > 1 ? (
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
                  <span className="flex items-center">
                    <div className="flex items-center space-x-1 mr-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    Saving
                  </span>
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

export default memo(Dashboard);
