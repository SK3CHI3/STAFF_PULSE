'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth'

export default function Responses() {
  const { profile: authProfile, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPeriod, setFilterPeriod] = useState('7d')
  const [filterMood, setFilterMood] = useState('all')
  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => { setHasHydrated(true) }, [])

  // Load profile from useAuth or localStorage
  useEffect(() => {
    if (authProfile && authProfile.organization) {
      setProfile(authProfile)
    } else {
      const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem('profile') : null
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile)
          let orgCandidate = parsed.organization
          let org = { id: '', name: '', subscription_plan: '' }
          if (Array.isArray(orgCandidate) && orgCandidate.length > 0 && typeof orgCandidate[0] === 'object') {
            org = orgCandidate[0]
          } else if (orgCandidate && typeof orgCandidate === 'object' && !Array.isArray(orgCandidate)) {
            org = orgCandidate
          }
          setProfile({
            id: parsed.id || '',
            first_name: parsed.first_name || '',
            last_name: parsed.last_name || '',
            email: parsed.email || '',
            role: parsed.role || '',
            organization: org,
            organization_id: org.id || ''
          })
        } catch {}
      }
    }
  }, [authProfile])

  // Fetch employees and aggregate mood check-ins
  useEffect(() => {
    const fetchResponses = async () => {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/employees?organizationId=${profile.organization.id}`)
        const result = await res.json()
        if (!result.success) throw new Error(result.error || 'Failed to fetch employees')
        const employees = result.employees || []
        // Aggregate all mood check-ins
        const allResponses: any[] = []
        employees.forEach((emp: any) => {
          if (Array.isArray(emp.mood_checkins)) {
            emp.mood_checkins.forEach((m: any) => {
              allResponses.push({
                id: m.id || `${emp.id}_${m.created_at}`,
                employee: `${emp.first_name} ${emp.last_name}`,
                department: emp.department || 'Unassigned',
                mood: m.mood_score,
                comment: m.comment || '',
                timestamp: m.created_at,
                anonymous: m.anonymous || false
              })
            })
          }
        })
        // Sort by timestamp desc
        allResponses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setResponses(allResponses)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch responses')
      } finally {
        setLoading(false)
      }
    }
    if (profile?.organization?.id) fetchResponses()
  }, [profile?.organization?.id])

  // Filtering logic
  const now = new Date()
  let days = 7
  if (filterPeriod === '30d') days = 30
  else if (filterPeriod === '90d') days = 90
  const since = new Date(now)
  since.setDate(now.getDate() - days)
  // Memoize formatted responses
  const formattedResponses = useMemo(() => {
    return responses.map(r => ({
      ...r,
      formattedTimestamp: r.timestamp
        ? (hasHydrated ? new Date(r.timestamp).toLocaleString() : new Date(r.timestamp).toISOString().replace('T',' ').slice(0,16))
        : ''
    }))
  }, [responses, hasHydrated])
  const filteredResponses = formattedResponses.filter(response => {
    // Filter by period
    if (response.timestamp && new Date(response.timestamp) < since) return false
    // Filter by mood
    if (filterMood !== 'all') {
      const moodRange = filterMood.split('-').map(Number)
      if (moodRange.length === 2) {
        if (response.mood < moodRange[0] || response.mood > moodRange[1]) return false
      } else {
        if (response.mood !== parseInt(filterMood)) return false
      }
    }
    return true
  })

  const getMoodColor = (mood: number) => {
    if (mood >= 4) return 'text-green-600 bg-green-100'
    if (mood >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }
  const getMoodLabel = (mood: number) => {
    const labels = ['', 'Very Poor', 'Poor', 'Neutral', 'Good', 'Excellent']
    return labels[mood] || 'Unknown'
  }

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading responses...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">Error loading responses</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
              <p className="text-gray-600 text-sm mt-1">View and analyze team mood responses</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="p-4">
        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-3">
              <select 
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
              <select 
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Moods</option>
                <option value="5">Excellent (5)</option>
                <option value="4">Good (4)</option>
                <option value="3">Neutral (3)</option>
                <option value="2">Poor (2)</option>
                <option value="1">Very Poor (1)</option>
                <option value="4-5">Positive (4-5)</option>
                <option value="1-2">Concerning (1-2)</option>
              </select>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm text-gray-600">
                Showing {filteredResponses.length} of {responses.length} responses
              </span>
            </div>
          </div>
        </div>
        {/* Response Cards */}
        <div className="space-y-4">
          {filteredResponses.map((response) => (
            <div key={response.id} className="glass backdrop-blur-xl bg-gradient-to-br from-blue-500/30 to-purple-500/40 border border-white/20 rounded-2xl shadow-2xl p-6 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg">{response.anonymous ? 'Anonymous' : response.employee}</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 ml-2">{getMoodLabel(response.mood)}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 ml-2">{response.department}</span>
              </div>
              <div className="text-gray-800 mb-2">{response.comment || <span className="italic text-gray-400">No comment</span>}</div>
              <div className="text-xs text-gray-500">{response.formattedTimestamp}</div>
            </div>
          ))}
        </div>
        {/* Empty State */}
        {filteredResponses.length === 0 && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later for new responses.</p>
          </div>
        )}
      </main>
    </div>
  )
}
