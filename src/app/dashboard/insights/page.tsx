'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface AIInsight {
  id: string
  insight_type: 'trend_analysis' | 'risk_detection' | 'recommendation' | 'department_insight' | 'employee_insight'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  department?: string
  employee_id?: string
  data_points: any
  action_items: string[]
  is_read: boolean
  is_dismissed: boolean
  created_at: string
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [filteredInsights, setFilteredInsights] = useState<AIInsight[]>([])
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [showDismissed, setShowDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  
  const { user, profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchInsights()
    }
  }, [profile?.organization_id])

  useEffect(() => {
    filterInsights()
  }, [insights, selectedType, selectedSeverity, showDismissed])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedInsights = data?.map(insight => ({
        ...insight,
        action_items: typeof insight.action_items === 'string' 
          ? JSON.parse(insight.action_items) 
          : insight.action_items || []
      })) || []

      setInsights(processedInsights)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterInsights = () => {
    let filtered = insights

    if (selectedType !== 'all') {
      filtered = filtered.filter(insight => insight.insight_type === selectedType)
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(insight => insight.severity === selectedSeverity)
    }

    if (!showDismissed) {
      filtered = filtered.filter(insight => !insight.is_dismissed)
    }

    setFilteredInsights(filtered)
  }

  const generateNewInsights = async () => {
    try {
      setGeneratingInsights(true)
      
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: profile?.organization_id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchInsights()
      } else {
        setError('Failed to generate insights')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingInsights(false)
    }
  }

  const markAsRead = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId)

      if (error) throw error

      setInsights(prev => prev.map(insight => 
        insight.id === insightId ? { ...insight, is_read: true } : insight
      ))
    } catch (err: any) {
      console.error('Error marking insight as read:', err)
    }
  }

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', insightId)

      if (error) throw error

      setInsights(prev => prev.map(insight => 
        insight.id === insightId ? { ...insight, is_dismissed: true } : insight
      ))
    } catch (err: any) {
      console.error('Error dismissing insight:', err)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk_detection':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'trend_analysis':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'recommendation':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading insights...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
              <p className="text-gray-600 text-sm mt-1">
                AI-powered insights and recommendations for your team
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={generateNewInsights}
                disabled={generatingInsights}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{generatingInsights ? 'Generating...' : 'Generate New Insights'}</span>
              </button>
              <button 
                onClick={fetchInsights}
                className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex gap-4 flex-1">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="risk_detection">Risk Detection</option>
                <option value="trend_analysis">Trend Analysis</option>
                <option value="recommendation">Recommendations</option>
                <option value="department_insight">Department Insights</option>
                <option value="employee_insight">Employee Insights</option>
              </select>
              
              <select 
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showDismissed}
                onChange={(e) => setShowDismissed(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show dismissed</span>
            </label>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
              <p className="text-gray-600 mb-4">
                {insights.length === 0 
                  ? "Generate your first AI insights to get started" 
                  : "Try adjusting your filters or generate new insights"
                }
              </p>
              {insights.length === 0 && (
                <button 
                  onClick={generateNewInsights}
                  disabled={generatingInsights}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generatingInsights ? 'Generating...' : 'Generate Insights'}
                </button>
              )}
            </div>
          ) : (
            filteredInsights.map((insight) => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onMarkAsRead={markAsRead}
                onDismiss={dismissInsight}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

// Individual Insight Card Component
function InsightCard({ 
  insight, 
  onMarkAsRead, 
  onDismiss 
}: { 
  insight: AIInsight
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const handleCardClick = () => {
    if (!insight.is_read) {
      onMarkAsRead(insight.id)
    }
    setExpanded(!expanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk_detection':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'trend_analysis':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 ${
      insight.is_dismissed ? 'opacity-60 border-gray-200' : 
      insight.is_read ? 'border-gray-100' : 'border-blue-200 shadow-md'
    }`}>
      <div 
        className="p-6 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              {getTypeIcon(insight.insight_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`text-lg font-medium ${
                  insight.is_read ? 'text-gray-900' : 'text-blue-900'
                }`}>
                  {insight.title}
                </h3>
                {!insight.is_read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
              
              <p className="text-gray-600 mb-3">{insight.description}</p>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(insight.severity)}`}>
                  {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                </span>
                
                {insight.department && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {insight.department}
                  </span>
                )}
                
                <span className="text-xs text-gray-500">
                  {new Date(insight.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {!insight.is_dismissed && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(insight.id)
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Recommended Actions:</h4>
            <ul className="space-y-2">
              {insight.action_items.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
