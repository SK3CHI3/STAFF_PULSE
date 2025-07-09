'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

export default function Settings() {
  const { profile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Map API fields to UI fields
  function mapApiToUi(api: any) {
    return {
      companyName: api.name || '',
      checkInFrequency: api.check_in_frequency || 'weekly',
      anonymousAllowed: api.anonymous_allowed ?? true,
      reminderEnabled: api.reminder_enabled ?? true,
      alertThreshold: api.alert_threshold ?? 2.5,
      workingHours: api.working_hours || '09:00-17:00',
      timezone: api.timezone || 'Africa/Nairobi',
      address: api.address || '',
      billingEmail: api.billing_email || '',
      email: api.email || '',
      phone: api.phone || '',
    }
  }
  function mapUiToApi(ui: any) {
    return {
      name: ui.companyName,
      check_in_frequency: ui.checkInFrequency,
      anonymous_allowed: ui.anonymousAllowed,
      reminder_enabled: ui.reminderEnabled,
      alert_threshold: ui.alertThreshold,
      working_hours: ui.workingHours,
      timezone: ui.timezone,
      address: ui.address,
      billing_email: ui.billingEmail,
      email: ui.email,
      phone: ui.phone,
    }
  }

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/organization/settings?organizationId=${profile.organization.id}`)
        const data = await res.json()
        if (!data.success || !data.settings) {
          setError(data.error || 'Failed to load settings')
          setSettings(null)
        } else {
          setSettings(mapApiToUi(data.settings))
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load settings')
        setSettings(null)
      }
      setLoading(false)
    }
    if (!authLoading && profile?.organization?.id) {
      fetchSettings()
    }
  }, [authLoading, profile?.organization?.id])

  const tabs = [
    { id: 'general', name: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'notifications', name: 'Notifications', icon: 'M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM20 3H4v10h16V3z' },
    { id: 'integrations', name: 'Integrations', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'security', name: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
  ]

  const handleSave = async () => {
    if (!profile?.organization?.id || !settings) {
      setError('Organization ID or settings missing. Cannot save.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    const payload = { organizationId: profile.organization.id, ...mapUiToApi(settings) }
    // Remove organizationId from update fields for validation
    const updateFields = { ...payload }
    delete updateFields.organizationId
    // Defensive: must have at least one field to update
    if (Object.keys(updateFields).length === 0) {
      setError('No valid fields to update. Please modify a setting before saving.')
      setSaving(false)
      return
    }
    // Log payload for debugging
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('Settings Save Payload:', payload)
    }
    try {
      const res = await fetch('/api/organization/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to save settings')
        setSuccess(null)
      } else {
        setSuccess('Settings saved successfully!')
        setSettings(mapApiToUi(data.settings))
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save settings')
      setSuccess(null)
    }
    setSaving(false)
  }

  // Loading and error states
  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading settings...</div>
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>
  }
  if (!settings) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">No settings found.</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Settings</h1>
              <p className="text-purple-600 text-sm mt-1">Manage your organization and system preferences</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {success && <div className="mb-4 text-green-600 font-medium">{success}</div>}
              {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Check-in Frequency</label>
                      <select
                        value={settings.checkInFrequency}
                        onChange={(e) => setSettings({...settings, checkInFrequency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Working Hours</label>
                      <input
                        type="text"
                        value={settings.workingHours}
                        onChange={(e) => setSettings({...settings, workingHours: e.target.value})}
                        placeholder="09:00-17:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Allow Anonymous Responses</label>
                        <p className="text-xs text-purple-600">Let employees submit feedback anonymously</p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, anonymousAllowed: !settings.anonymousAllowed})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.anonymousAllowed ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.anonymousAllowed ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 mb-6">Notification Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Send Reminders</label>
                        <p className="text-xs text-purple-600">Send WhatsApp reminders for check-ins</p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, reminderEnabled: !settings.reminderEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.reminderEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Alert Threshold</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={settings.alertThreshold}
                        onChange={(e) => setSettings({...settings, alertThreshold: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-purple-600 mt-1">Send alerts when average mood drops below this value</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 mb-6">Integrations</h2>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-blue-700">WhatsApp Business</h3>
                            <p className="text-sm text-purple-600">Connected</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-blue-700">Email Notifications</h3>
                            <p className="text-sm text-purple-600">Not configured</p>
                          </div>
                        </div>
                        <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-blue-700 rounded-full hover:bg-gray-200">
                          Configure
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h3 className="font-medium text-blue-700">Data Protection</h3>
                          <p className="text-sm text-purple-600 mt-1">
                            All data is encrypted and stored securely. We comply with GDPR and local data protection laws.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-blue-700 mb-3">Data Retention</h3>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                        <option value="1year">1 Year</option>
                        <option value="2years">2 Years</option>
                        <option value="3years">3 Years</option>
                        <option value="indefinite">Indefinite</option>
                      </select>
                    </div>

                    <div>
                      <button
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        onClick={async () => {
                          if (!profile?.organization?.id) return
                          setExporting(true)
                          setExportError(null)
                          try {
                            const res = await fetch(`/api/organization/export?organizationId=${profile.organization.id}`)
                            if (!res.ok) throw new Error('Failed to export data')
                            const blob = await res.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `organization_export_${profile.organization.id}.zip`
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            window.URL.revokeObjectURL(url)
                          } catch (e: any) {
                            setExportError(e.message || 'Failed to export data')
                          }
                          setExporting(false)
                        }}
                        disabled={exporting}
                      >
                        {exporting ? 'Exporting...' : 'Export All Data'}
                      </button>
                      {exportError && <p className="text-xs text-red-600 mt-2">{exportError}</p>}
                      <p className="text-xs text-purple-600 mt-2">Download all your organization's data</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
