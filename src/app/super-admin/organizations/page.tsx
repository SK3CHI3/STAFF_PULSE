'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Organization {
  id: string
  name: string
  email: string
  subscription_status: string
  created_at: string
  updated_at: string
  employees_count: number
  responses_count: number
  last_activity: string
  billing_email: string
  phone: string
  address: string
}

export default function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchOrganizations()
    }
  }, [profile])

  useEffect(() => {
    filterOrganizations()
  }, [organizations, searchTerm, statusFilter])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          employees(count),
          mood_checkins(count),
          profiles(last_sign_in_at)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedOrgs = data?.map(org => ({
        ...org,
        employees_count: org.employees?.[0]?.count || 0,
        responses_count: org.mood_checkins?.[0]?.count || 0,
        last_activity: org.profiles?.[0]?.last_sign_in_at || org.updated_at
      })) || []

      setOrganizations(processedOrgs)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterOrganizations = () => {
    let filtered = organizations

    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.subscription_status === statusFilter)
    }

    setFilteredOrgs(filtered)
  }

  const updateOrganizationStatus = async (orgId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ subscription_status: status })
        .eq('id', orgId)

      if (error) throw error

      setOrganizations(prev => prev.map(org => 
        org.id === orgId ? { ...org, subscription_status: status } : org
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure? This will permanently delete the organization and all its data.')) return

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)

      if (error) throw error

      setOrganizations(prev => prev.filter(org => org.id !== orgId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!profile || profile.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Super Admin access required</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Glass Morphism Header */}
      <header className="backdrop-blur-md bg-white/30 border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center">
          <img src="/logo.svg" alt="StaffPulse Logo" className="w-8 h-8 rounded-lg bg-white p-0.5 shadow mr-4" />
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Organizations Management
              </h1>
              <p className="text-gray-600 mt-1">Manage all organizations on the platform</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="backdrop-blur-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 text-blue-700 px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Organization</span>
              </button>
              
              <button 
                onClick={fetchOrganizations}
                className="backdrop-blur-md bg-gray-500/20 hover:bg-gray-500/30 border border-gray-300/30 text-gray-700 px-3 py-2 rounded-xl transition-all duration-200"
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
      <main className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full backdrop-blur-md bg-white/20 border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Organizations"
            value={organizations.length}
            icon="🏢"
            color="blue"
          />
          <StatCard
            title="Active"
            value={organizations.filter(o => o.subscription_status === 'active').length}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Trial"
            value={organizations.filter(o => o.subscription_status === 'trial').length}
            icon="🔄"
            color="yellow"
          />
          <StatCard
            title="Inactive"
            value={organizations.filter(o => o.subscription_status === 'inactive').length}
            icon="⏸️"
            color="red"
          />
        </div>

        {/* Organizations Table */}
        <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20 border-b border-white/20">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Organization</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Contact</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Employees</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Responses</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Created</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-lg font-medium">No organizations found</p>
                        <p className="mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="border-b border-white/10 hover:bg-white/20 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-500">ID: {org.id.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm text-gray-900">{org.email}</div>
                          <div className="text-sm text-gray-500">{org.phone || 'No phone'}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-700">{org.employees_count}</td>
                      <td className="py-4 px-6 text-gray-700">{org.responses_count}</td>
                      <td className="py-4 px-6">
                        <select
                          value={org.subscription_status}
                          onChange={(e) => updateOrganizationStatus(org.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                            org.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                            org.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                            org.subscription_status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="trial">Trial</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingOrg(org)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="View/Edit Organization"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => window.open(`/dashboard?org=${org.id}`, '_blank')}
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                            title="View Organization Dashboard"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>

                          <button
                            onClick={() => updateOrganizationStatus(org.id, org.subscription_status === 'active' ? 'inactive' : 'active')}
                            className={`p-1 rounded ${
                              org.subscription_status === 'active'
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                            title={org.subscription_status === 'active' ? 'Suspend Organization' : 'Activate Organization'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {org.subscription_status === 'active' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create/Edit Organization Modal */}
      {(showCreateModal || editingOrg) && (
        <OrganizationModal 
          organization={editingOrg}
          onClose={() => {
            setShowCreateModal(false)
            setEditingOrg(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingOrg(null)
            fetchOrganizations()
          }}
        />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color }: {
  title: string
  value: number
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-200/30 text-blue-700',
    green: 'from-green-500/20 to-green-600/20 border-green-200/30 text-green-700',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-200/30 text-yellow-700',
    red: 'from-red-500/20 to-red-600/20 border-red-200/30 text-red-700'
  }

  return (
    <div className={`backdrop-blur-md bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 transition-all duration-200 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}

// Organization Modal Component (placeholder)
function OrganizationModal({ 
  organization, 
  onClose, 
  onSuccess 
}: {
  organization?: Organization | null
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {organization ? 'Edit Organization' : 'Create Organization'}
        </h2>
        <p className="text-gray-600 mb-4">
          Organization management form will be implemented in the next iteration.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
