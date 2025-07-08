'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Schedule {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
  day_of_week?: number
  time_of_day: string
  timezone: string
  is_active: boolean
  message_template?: string
  target_departments?: string[]
  target_employees?: string[]
  created_at: string
  updated_at: string
}

interface Department {
  name: string
  count: number
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const { user, profile: authProfile } = useAuth()

  // Load cached profile from localStorage first
  useEffect(() => {
    const cachedProfile = localStorage.getItem('profile')
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile)
        let orgCandidate = parsed.organization
        let org: { id: string; name: string; subscription_plan: string } = { id: '', name: '', subscription_plan: '' }
        if (Array.isArray(orgCandidate) && orgCandidate.length > 0 && typeof orgCandidate[0] === 'object') {
          org = orgCandidate[0] as { id: string; name: string; subscription_plan: string }
        } else if (orgCandidate && typeof orgCandidate === 'object' && !Array.isArray(orgCandidate)) {
          org = orgCandidate as { id: string; name: string; subscription_plan: string }
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
      } catch (e) {
        // Ignore invalid cache
      }
    }
  }, [])

  // MOCK DATA for schedules and departments
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setSchedules([
        {
          id: '1',
          name: 'Weekly Check-in',
          frequency: 'weekly',
          day_of_week: 1,
          time_of_day: '09:00',
          timezone: 'Africa/Nairobi',
          is_active: true,
          message_template: 'How are you feeling this week?',
          target_departments: ['Engineering'],
          target_employees: [],
          created_at: '2024-01-01',
          updated_at: '2024-07-01'
        },
        {
          id: '2',
          name: 'Monthly All-Hands',
          frequency: 'monthly',
          day_of_week: undefined,
          time_of_day: '10:00',
          timezone: 'Africa/Nairobi',
          is_active: false,
          message_template: 'Share your thoughts for the month!',
          target_departments: ['All'],
          target_employees: [],
          created_at: '2024-01-05',
          updated_at: '2024-07-01'
        }
      ])
      setDepartments([
        { name: 'Engineering', count: 5 },
        { name: 'Design', count: 3 }
      ])
      setLoading(false)
    }, 500)
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('checkin_schedules')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedSchedules = data?.map(schedule => ({
        ...schedule,
        target_departments: typeof schedule.target_departments === 'string' 
          ? JSON.parse(schedule.target_departments) 
          : schedule.target_departments || [],
        target_employees: typeof schedule.target_employees === 'string' 
          ? JSON.parse(schedule.target_employees) 
          : schedule.target_employees || []
      })) || []

      setSchedules(processedSchedules)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)

      if (error) throw error

      const deptCounts = data?.reduce((acc: Record<string, number>, emp) => {
        const dept = emp.department || 'Unassigned'
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      }, {}) || {}

      const deptList = Object.entries(deptCounts).map(([name, count]) => ({
        name,
        count: count as number
      }))

      setDepartments(deptList)
    } catch (err: any) {
      console.error('Error fetching departments:', err)
    }
  }

  const toggleScheduleStatus = async (scheduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('checkin_schedules')
        .update({ is_active: !isActive })
        .eq('id', scheduleId)

      if (error) throw error

      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, is_active: !isActive } : schedule
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const { error } = await supabase
        .from('checkin_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const sendTestMessage = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/whatsapp/send-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'scheduled',
          scheduleId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Test messages sent successfully! Sent to ${result.sent} employees.`)
      } else {
        alert(`Failed to send test messages: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Error sending test messages: ${err.message}`)
    }
  }

  const getDayName = (dayNumber?: number) => {
    if (dayNumber === undefined) return ''
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayNumber] || ''
  }

  const getFrequencyDisplay = (schedule: Schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return `Weekly on ${getDayName(schedule.day_of_week)}`
      case 'bi-weekly':
        return `Bi-weekly on ${getDayName(schedule.day_of_week)}`
      case 'monthly':
        return 'Monthly'
      default:
        return schedule.frequency
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Schedules</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage automated check-in schedules for your team
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Schedule</span>
              </button>
              <button 
                onClick={fetchSchedules}
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

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-600 mb-4">
                Create your first WhatsApp check-in schedule to get started
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Schedule
              </button>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{schedule.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Frequency:</span> {getFrequencyDisplay(schedule)}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {schedule.time_of_day} ({schedule.timezone})
                      </div>
                      <div>
                        <span className="font-medium">Target:</span> {
                          schedule.target_departments && schedule.target_departments.length > 0
                            ? `${schedule.target_departments.length} departments`
                            : schedule.target_employees && schedule.target_employees.length > 0
                            ? `${schedule.target_employees.length} employees`
                            : 'All employees'
                        }
                      </div>
                    </div>

                    {schedule.target_departments && schedule.target_departments.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-gray-700">Departments: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {schedule.target_departments.map(dept => (
                            <span key={dept} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => sendTestMessage(schedule.id)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                      title="Send Test Message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                      title="Edit Schedule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => toggleScheduleStatus(schedule.id, schedule.is_active)}
                      className={`p-2 rounded-lg ${
                        schedule.is_active 
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      title={schedule.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {schedule.is_active ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      title="Delete Schedule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create/Edit Schedule Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal 
          schedule={editingSchedule}
          departments={departments}
          onClose={() => {
            setShowCreateModal(false)
            setEditingSchedule(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingSchedule(null)
            fetchSchedules()
          }}
          organizationId={profile?.organization_id}
        />
      )}
    </div>
  )
}

// Schedule Modal Component
function ScheduleModal({ 
  schedule, 
  departments, 
  onClose, 
  onSuccess, 
  organizationId 
}: {
  schedule?: Schedule | null
  departments: Department[]
  onClose: () => void
  onSuccess: () => void
  organizationId?: string
}) {
  const [name, setName] = useState(schedule?.name || '');
  const [frequency, setFrequency] = useState<Schedule['frequency']>(schedule?.frequency || 'weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(schedule?.day_of_week ?? 1);
  const [timeOfDay, setTimeOfDay] = useState(schedule?.time_of_day || '09:00');
  const [timezone, setTimezone] = useState(schedule?.timezone || 'Africa/Nairobi');
  const [messageTemplate, setMessageTemplate] = useState(schedule?.message_template || '');
  const [targetDepartments, setTargetDepartments] = useState<string[]>(schedule?.target_departments || []);
  const [isActive, setIsActive] = useState(schedule?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const validFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly'];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const method = schedule ? 'PUT' : 'POST';
      const body: any = {
        organizationId,
        name,
        frequency,
        day_of_week: (frequency === 'weekly' || frequency === 'bi-weekly') ? dayOfWeek : undefined,
        time_of_day: timeOfDay,
        timezone,
        message_template: messageTemplate,
        target_departments: targetDepartments,
        is_active: isActive,
      };
      if (schedule) body.scheduleId = schedule.id;
      const res = await fetch('/api/schedules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save schedule');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {schedule ? 'Edit Schedule' : 'Create Schedule'}
        </h2>
        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Schedule Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Frequency</label>
            <select className="w-full border rounded px-3 py-2" value={frequency} onChange={e => setFrequency(e.target.value as Schedule['frequency'])}>
              {validFrequencies.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>
          {(frequency === 'weekly' || frequency === 'bi-weekly') && (
            <div>
              <label className="block font-medium mb-1">Day of Week</label>
              <select className="w-full border rounded px-3 py-2" value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}>
                {daysOfWeek.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block font-medium mb-1">Time of Day</label>
            <input type="time" className="w-full border rounded px-3 py-2" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Timezone</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={timezone} onChange={e => setTimezone(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Target Departments</label>
            <select multiple className="w-full border rounded px-3 py-2" value={targetDepartments} onChange={e => setTargetDepartments(Array.from(e.target.selectedOptions, o => o.value))}>
              {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Message Template</label>
            <textarea className="w-full border rounded px-3 py-2" rows={4} value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder="Enter the WhatsApp message template for this schedule..." />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="active" />
            <label htmlFor="active" className="font-medium">Active</label>
          </div>
        </div>
        <div className="flex justify-end mt-6 space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
