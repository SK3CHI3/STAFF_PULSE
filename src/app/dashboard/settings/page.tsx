'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/LoadingState'

export default function Settings() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Helper function to safely update settings
  const updateSettings = (updates: any) => {
    setSettings((prev: any) => ({ ...(prev || {}), ...updates }))
  }

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
      whatsappEnabled: api.whatsapp_enabled ?? true,
      emailEnabled: api.email_enabled ?? true,
      smsEnabled: api.sms_enabled ?? false,
      slackWebhook: api.slack_webhook || '',
      teamsWebhook: api.teams_webhook || '',
      discordWebhook: api.discord_webhook || '',
      twoFactorEnabled: api.two_factor_enabled ?? false,
      sessionTimeout: api.session_timeout ?? 30,
      passwordPolicy: api.password_policy || 'medium',
      auditLogging: api.audit_logging ?? true,
      dataRetention: api.data_retention ?? 365,
      backupFrequency: api.backup_frequency || 'daily',
      encryptionEnabled: api.encryption_enabled ?? true,
      companyAddress: api.address || '',
      companyWebsite: api.website || '',
      companyIndustry: api.industry || '',
      companySize: api.company_size || '',
      contactEmail: api.contact_email || '',
      phone: api.phone || ''
    }
  }

  // Map UI fields to API fields (excluding restricted fields)
  function mapUiToApi(ui: any) {
    return {
      // Note: Restricted fields are intentionally excluded:
      // - 'name' (company name) - contact support to change
      // - subscription fields - managed through billing system
      // - system-managed fields - calculated or set automatically
      check_in_frequency: ui.checkInFrequency,
      anonymous_allowed: ui.anonymousAllowed,
      reminder_enabled: ui.reminderEnabled,
      alert_threshold: ui.alertThreshold,
      working_hours: ui.workingHours,
      timezone: ui.timezone,
      email: ui.contactEmail,
      phone: ui.phone,
      address: ui.companyAddress,
      billing_email: ui.billingEmail,
      // Note: Integration settings like webhooks would be handled separately
      // whatsapp_enabled: ui.whatsappEnabled,
      // email_enabled: ui.emailEnabled,
      // sms_enabled: ui.smsEnabled,
      // slack_webhook: ui.slackWebhook,
      // teams_webhook: ui.teamsWebhook,
      // discord_webhook: ui.discordWebhook,
      // two_factor_enabled: ui.twoFactorEnabled,
      // session_timeout: ui.sessionTimeout,
      // password_policy: ui.passwordPolicy,
      // audit_logging: ui.auditLogging,
      // data_retention: ui.dataRetention,
      // backup_frequency: ui.backupFrequency,
      // encryption_enabled: ui.encryptionEnabled,
    }
  }

  // Fetch settings on mount - MOVED BEFORE AUTH GUARDS
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
    if (profile?.organization?.id) {
      fetchSettings()
    }
  }, [profile?.organization?.id])

  // Authentication is handled by dashboard layout AuthGuard
  if (!profile?.organization_id) {
    return <LoadingState message="Loading organization data..." />
  }

  // Wait for settings to load
  if (!settings) {
    return <LoadingState message="Loading settings..." />
  }

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
    const { organizationId, ...updateFields } = payload
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

  // Show loading state while fetching settings
  if (loading) {
    return <LoadingState message="Loading settings data..." />
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
              {/* Information Banner */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-blue-700">Settings Information</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      Some settings like company name and subscription details are read-only for security.
                      Contact support if you need to modify restricted fields.
                    </p>
                  </div>
                </div>
              </div>

              {success && <div className="mb-4 text-green-600 font-medium">{success}</div>}
              {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-lg font-semibold text-blue-700 mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">
                        Company Name
                        <span className="ml-2 text-xs text-gray-500 font-normal">(Read-only)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={settings?.companyName || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                          title="Company name cannot be changed. Contact support if you need to update this."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        To change your company name, please contact our support team.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Check-in Frequency</label>
                      <select
                        value={settings.checkInFrequency}
                        onChange={(e) => updateSettings({ checkInFrequency: e.target.value })}
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

                    {/* Subscription Information - Read Only */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-semibold text-blue-700 mb-3">
                        Subscription Information
                        <span className="ml-2 text-xs text-gray-500 font-normal">(Read-only)</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Plan:</span>
                          <span className="ml-2 font-medium text-gray-900 capitalize">
                            {profile?.organization?.subscription_plan || 'Free'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-2 font-medium capitalize ${
                            profile?.organization?.subscription_status === 'active'
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}>
                            {profile?.organization?.subscription_status || 'Active'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Employees:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {(profile?.organization as any)?.employee_count || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {(profile?.organization as any)?.created_at
                              ? new Date((profile.organization as any).created_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        To modify subscription details, visit the <a href="/dashboard/billing" className="text-blue-600 hover:underline">billing page</a> or contact support.
                      </p>
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
