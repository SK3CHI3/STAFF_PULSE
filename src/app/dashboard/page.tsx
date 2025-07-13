'use client'

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState, ErrorState } from '@/components/LoadingState'
import { useRouter } from 'next/navigation'
// Remove this import - signOut is available from useAuth hook
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase'
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { setHours, setMinutes } from 'date-fns';

function Dashboard() {
  const { profile, signOut } = useAuth()
  const router = useRouter()


  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedDept, setSelectedDept] = useState('All Departments')
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

  // Enhanced Loading Components
  const PulseLoader = ({ size = 'md', color = 'blue' }: { size?: 'sm' | 'md' | 'lg', color?: string }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    }

    return (
      <div className="flex items-center justify-center">
        <div className={`${sizeClasses[size]} relative`}>
          <div className={`absolute inset-0 rounded-full bg-${color}-200 animate-ping`}></div>
          <div className={`relative rounded-full ${sizeClasses[size]} bg-${color}-600 animate-pulse`}></div>
        </div>
      </div>
    )
  }

  const SkeletonLoader = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  )

  const DotsLoader = ({ color = 'blue' }: { color?: string }) => (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  )



  // Add new state for dashboard metrics
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    avgMood: 0,
    responseRate: 0,
    totalLastMonth: 0,
    responseRateLastWeek: 0,
    moodCategory: 'Unknown'
  });
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
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => { setHasHydrated(true) }, [])



  // Fetch employee stats (total, avg mood, response rate)
  const fetchEmployeeStats = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setEmployeeStatsLoading(true);
    setEmployeeStatsError(null);
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
      setEmployeeStatsError(error.message || 'Failed to fetch employee stats');
    } finally {
      setEmployeeStatsLoading(false);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setAlertsLoading(true);
    setAlertsError(null);
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
      setAlertsError(error.message || 'Failed to fetch alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Fetch recent responses
  const fetchRecentResponses = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setRecentResponsesLoading(true);
    setRecentResponsesError(null);
    try {
      const { data, error } = await supabase
        .from('mood_checkins')
        .select('*, employees(first_name, last_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentResponses(data || []);
    } catch (error: any) {
      setRecentResponsesError(error.message || 'Failed to fetch recent responses');
    } finally {
      setRecentResponsesLoading(false);
    }
  }, []);

  // Fetch mood trends from actual mood check-ins
  const fetchMoodTrends = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setMoodTrendsLoading(true);
    setMoodTrendsError(null);
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
      setMoodTrendsError(error.message || 'Failed to fetch mood trends');
    } finally {
      setMoodTrendsLoading(false);
    }
  }, []);

  // Helper to process moodTrends into chart data - memoized for performance
  const chartData = useMemo(() => {
    if (moodTrendsLoading || moodTrendsError) return [];
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
  }, [moodTrends, moodTrendsLoading, moodTrendsError, timeRange, hasHydrated]);

  // Load dashboard data function
  const loadDashboardData = useCallback(async (orgId?: string) => {
    // Use passed orgId or get from current profile
    const organizationId = orgId || profile?.organization?.id;

    if (!organizationId) {
      return
    }

    if (loading) {
      return // Prevent multiple simultaneous calls
    }

    setLoading(true)
    try {
      // Use Promise.allSettled to prevent one failure from stopping others
      const results = await Promise.allSettled([
        fetchEmployeeStats(organizationId),
        fetchAlerts(organizationId),
        fetchRecentResponses(organizationId),
        fetchMoodTrends(organizationId)
      ])

      // Log any failures but don't crash
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Dashboard data fetch ${index} failed:`, result.reason)
        }
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchEmployeeStats, fetchAlerts, fetchRecentResponses, fetchMoodTrends]);

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
      alert(error.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Load dashboard data when profile is available - SINGLE useEffect
  useEffect(() => {
    const orgId = profile?.organization?.id;
    console.log('🔄 [DASHBOARD] useEffect triggered, orgId:', orgId);
    if (orgId) {
      console.log('🚀 [DASHBOARD] Loading dashboard data...');
      loadDashboardData(orgId) // Pass orgId explicitly
    }
  }, [profile?.organization?.id, loadDashboardData]);

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
    } finally {
      setDepartmentsLoading(false);
    }
  }, [profile?.organization?.id]);

  // Fetch departments when modal opens
  useEffect(() => {
    if (showCheckinModal && profile?.organization?.id) {
      setDepartmentsLoading(true);
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

  // Profile is guaranteed to exist here due to auth guards above

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
      <main className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {employeeStatsLoading ? (
                    <div className="flex items-center">
                      <SkeletonLoader className="h-8 w-16" />
                    </div>
                  ) : employeeStatsError ? (
                    <span className="text-red-600">{employeeStatsError}</span>
                  ) : (
                    employeeStats.total
                  )}
                </div>
                <p className={`text-xs mt-1 ${employeeStats.totalLastMonth > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  {employeeStatsLoading ? '...' :
                   employeeStats.totalLastMonth > 0 ? `+${employeeStats.totalLastMonth} this month` : 'No new employees this month'}
                </p>
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
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {employeeStatsLoading ? (
                    <div className="flex items-center">
                      <SkeletonLoader className="h-8 w-20" />
                    </div>
                  ) : employeeStatsError ? (
                    <span className="text-red-600">{employeeStatsError}</span>
                  ) : (
                    `${employeeStats.responseRate}%`
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  employeeStatsLoading ? 'text-gray-500' :
                  employeeStats.responseRate > employeeStats.responseRateLastWeek ? 'text-green-600' :
                  employeeStats.responseRate < employeeStats.responseRateLastWeek ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {employeeStatsLoading ? '...' :
                   employeeStats.responseRate === employeeStats.responseRateLastWeek ? 'No change from last week' :
                   `${employeeStats.responseRate > employeeStats.responseRateLastWeek ? '+' : ''}${(employeeStats.responseRate - employeeStats.responseRateLastWeek).toFixed(1)}% from last week`}
                </p>
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
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {employeeStatsLoading ? (
                    <div className="flex items-center">
                      <SkeletonLoader className="h-8 w-12" />
                    </div>
                  ) : employeeStatsError ? (
                    <span className="text-red-600">{employeeStatsError}</span>
                  ) : (
                    employeeStats.avgMood.toFixed(1)
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  employeeStatsLoading ? 'text-gray-500' :
                  employeeStats.avgMood >= 4.5 ? 'text-green-600' :
                  employeeStats.avgMood >= 3.5 ? 'text-blue-600' :
                  employeeStats.avgMood >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {employeeStatsLoading ? '...' : employeeStats.moodCategory}
                </p>
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
                <div className="text-3xl font-bold text-orange-600 mt-2">
                  {alertsLoading ? (
                    <div className="flex items-center">
                      <SkeletonLoader className="h-8 w-8" />
                    </div>
                  ) : alertsError ? (
                    <span className="text-red-600">{alertsError}</span>
                  ) : (
                    alerts.length
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  alertsLoading ? 'text-gray-500' :
                  alerts.length > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {alertsLoading ? '...' :
                   alerts.length > 0 ? 'Needs attention' : 'All good'}
                </p>
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
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="relative">
                    <PulseLoader size="lg" color="blue" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <DotsLoader color="blue" />
                    <span className="text-gray-600 font-medium">Loading mood trends</span>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="flex space-x-2">
                      <SkeletonLoader className="h-16 w-8" />
                      <SkeletonLoader className="h-20 w-8" />
                      <SkeletonLoader className="h-12 w-8" />
                      <SkeletonLoader className="h-24 w-8" />
                      <SkeletonLoader className="h-16 w-8" />
                      <SkeletonLoader className="h-18 w-8" />
                      <SkeletonLoader className="h-14 w-8" />
                    </div>
                  </div>
                </div>
              ) : moodTrendsError ? (
                <div className="flex items-center justify-center h-full text-red-600">{moodTrendsError}</div>
              ) : chartData.length === 0 ? (
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
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                      <SkeletonLoader className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <SkeletonLoader className="h-4 w-32" />
                        <SkeletonLoader className="h-3 w-24" />
                      </div>
                      <SkeletonLoader className="h-8 w-16 rounded-full" />
                    </div>
                  ))}
                  <div className="flex items-center justify-center py-4">
                    <DotsLoader color="blue" />
                    <span className="ml-3 text-gray-600">Loading responses</span>
                  </div>
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
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <DotsLoader color="blue" />
                    <span className="text-blue-700 font-medium">Loading departments</span>
                  </div>
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
