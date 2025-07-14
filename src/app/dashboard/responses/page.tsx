'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/LoadingState'
import Pagination, { usePagination } from '@/components/Pagination'

export default function Responses() {
  // ALL HOOKS MUST BE DECLARED FIRST - NO CONDITIONAL RETURNS BEFORE THIS
  const { profile } = useAuth()
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterPeriod, setFilterPeriod] = useState('7d')
  const [filterMood, setFilterMood] = useState('all')
  const [filterAnonymous, setFilterAnonymous] = useState('all')
  const [hasHydrated, setHasHydrated] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })

  // Pagination hook
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPagination
  } = usePagination()

  // FUNCTION DEFINITIONS FIRST
  // Fetch responses with pagination
  const fetchResponses = async () => {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        let url = `/api/responses?organizationId=${profile.organization.id}&page=${currentPage}&limit=${itemsPerPage}`
        url += `&filterPeriod=${filterPeriod}&filterMood=${filterMood}&filterAnonymous=${filterAnonymous}`

        const res = await fetch(url)
        const result = await res.json()
        if (!result.success) throw new Error(result.error || 'Failed to fetch responses')

        setResponses(result.responses || [])

        // Update pagination state
        if (result.pagination) {
          setPagination(result.pagination)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch responses')
      } finally {
        setLoading(false)
      }
    }

  // ALL useEffect HOOKS MUST BE DECLARED HERE
  useEffect(() => { setHasHydrated(true) }, [])

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination()
  }, [filterPeriod, filterMood, filterAnonymous, resetPagination])

  // Load responses data when profile, pagination, or filters change
  useEffect(() => {
    if (profile?.organization?.id) {
      fetchResponses()
    }
  }, [profile?.organization?.id, currentPage, itemsPerPage, filterPeriod, filterMood, filterAnonymous])

  // Memoize formatted responses - MUST BE WITH OTHER HOOKS
  const formattedResponses = useMemo(() => {
    return responses.map(r => ({
      ...r,
      formattedTimestamp: r.timestamp
        ? (hasHydrated ? new Date(r.timestamp).toLocaleString() : new Date(r.timestamp).toISOString().replace('T',' ').slice(0,16))
        : ''
    }))
  }, [responses, hasHydrated])

  // Authentication is handled by dashboard layout AuthGuard
  if (!profile?.organization_id) {
    return <LoadingState message="Loading organization data..." />
  }

  // Use the memoized filtered responses
  const filteredResponses = formattedResponses

  const getMoodColor = (mood: number) => {
    if (mood >= 4) return 'text-green-600 bg-green-100'
    if (mood >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }
  const getMoodLabel = (mood: number) => {
    const labels = ['', 'Very Poor', 'Poor', 'Neutral', 'Good', 'Excellent']
    return labels[mood] || 'Unknown'
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
              <button
                onClick={fetchResponses}
                disabled={loading}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
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
      <main className="p-6">
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
                <option value="positive">Positive (4-5)</option>
                <option value="neutral">Neutral (3)</option>
                <option value="negative">Concerning (1-2)</option>
              </select>
              <select
                value={filterAnonymous}
                onChange={(e) => setFilterAnonymous(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Responses</option>
                <option value="identified">Identified Only</option>
                <option value="anonymous">Anonymous Only</option>
              </select>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm text-gray-600">
                Showing {filteredResponses.length} of {responses.length} responses
              </span>
            </div>
          </div>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading responses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Response Cards */}
        {!loading && !error && (
          <div className="space-y-4">
            {formattedResponses.map((response) => (
            <div key={response.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-gray-900">
                    {response.anonymous ? 'Anonymous Employee' : response.employee}
                  </span>
                  {response.anonymous && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Anonymous
                    </span>
                  )}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getMoodColor(response.mood)}`}>
                  {getMoodLabel(response.mood)}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {response.anonymous ? 'Anonymous Response' : response.department}
                </span>
              </div>
              <div className="text-gray-700 mb-3 leading-relaxed">
                {response.comment ? (
                  <span>"{response.comment}"</span>
                ) : (
                  <span className="italic text-gray-400">No additional comment provided</span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {response.formattedTimestamp}
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && formattedResponses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && formattedResponses.length === 0 && (
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
