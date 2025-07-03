'use client'

import { useState } from 'react'

export default function Responses() {
  const [filterPeriod, setFilterPeriod] = useState('7d')
  const [filterMood, setFilterMood] = useState('all')

  const responses = [
    { 
      id: 1, 
      employee: 'Sarah Johnson', 
      department: 'Engineering', 
      mood: 5, 
      comment: 'Great week! Really enjoying the new project challenges.', 
      timestamp: '2024-01-15 09:30', 
      anonymous: false 
    },
    { 
      id: 2, 
      employee: 'John Doe', 
      department: 'Marketing', 
      mood: 3, 
      comment: 'Feeling a bit overwhelmed with the current workload.', 
      timestamp: '2024-01-15 10:15', 
      anonymous: false 
    },
    { 
      id: 3, 
      employee: 'Anonymous', 
      department: 'Design', 
      mood: 4, 
      comment: 'Good progress on projects, but could use better communication.', 
      timestamp: '2024-01-15 11:00', 
      anonymous: true 
    },
    { 
      id: 4, 
      employee: 'Alex Wilson', 
      department: 'Sales', 
      mood: 2, 
      comment: 'Struggling with motivation lately. Need some support.', 
      timestamp: '2024-01-14 16:45', 
      anonymous: false 
    },
    { 
      id: 5, 
      employee: 'Mary Smith', 
      department: 'Design', 
      mood: 5, 
      comment: 'Excellent collaboration with the team this week!', 
      timestamp: '2024-01-14 14:20', 
      anonymous: false 
    },
  ]

  const filteredResponses = responses.filter(response => {
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
              <select 
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div key={response.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{response.employee}</span>
                        {response.anonymous && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            Anonymous
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {response.department}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-gray-700 leading-relaxed">{response.comment}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{response.timestamp}</span>
                  </div>
                </div>
                
                <div className="ml-6 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getMoodColor(response.mood)}`}>
                    <span className="text-lg font-bold">{response.mood}</span>
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{getMoodLabel(response.mood)}</span>
                </div>
              </div>
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
