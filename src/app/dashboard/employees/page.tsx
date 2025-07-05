'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  position: string
  is_active: boolean
  created_at: string
  last_response?: string
  avg_mood?: number
  response_count?: number
}

interface Department {
  name: string
  count: number
}

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
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

  // MOCK DATA for employees and departments
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setEmployees([
        {
          id: '1',
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@example.com',
          phone: '+254700000001',
          department: 'Engineering',
          position: 'Developer',
          is_active: true,
          created_at: '2024-01-01',
          last_response: '2024-07-01',
          avg_mood: 4.5,
          response_count: 12
        },
        {
          id: '2',
          first_name: 'Bob',
          last_name: 'Smith',
          email: 'bob@example.com',
          phone: '+254700000002',
          department: 'Design',
          position: 'Designer',
          is_active: false,
          created_at: '2024-01-02',
          last_response: '2024-06-28',
          avg_mood: 3.8,
          response_count: 8
        }
      ])
      setDepartments([
        { name: 'Engineering', count: 1 },
        { name: 'Design', count: 1 }
      ])
      setLoading(false)
    }, 500)
  }, [])

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && employee.is_active) ||
      (selectedStatus === 'inactive' && !employee.is_active)

    return matchesSearch && matchesDepartment && matchesStatus
  })

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">Error loading employees</div>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              setTimeout(() => {
                setEmployees([
                  {
                    id: '1',
                    first_name: 'Alice',
                    last_name: 'Johnson',
                    email: 'alice@example.com',
                    phone: '+254700000001',
                    department: 'Engineering',
                    position: 'Developer',
                    is_active: true,
                    created_at: '2024-01-01',
                    last_response: '2024-07-01',
                    avg_mood: 4.5,
                    response_count: 12
                  },
                  {
                    id: '2',
                    first_name: 'Bob',
                    last_name: 'Smith',
                    email: 'bob@example.com',
                    phone: '+254700000002',
                    department: 'Design',
                    position: 'Designer',
                    is_active: false,
                    created_at: '2024-01-02',
                    last_response: '2024-06-28',
                    avg_mood: 3.8,
                    response_count: 8
                  }
                ])
                setDepartments([
                  { name: 'Engineering', count: 1 },
                  { name: 'Design', count: 1 }
                ])
                setLoading(false)
              }, 500)
            }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your team members and their wellness data ({employees.length} total)
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Employee</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => {
                  setLoading(true)
                  setTimeout(() => {
                    setEmployees([
                      {
                        id: '1',
                        first_name: 'Alice',
                        last_name: 'Johnson',
                        email: 'alice@example.com',
                        phone: '+254700000001',
                        department: 'Engineering',
                        position: 'Developer',
                        is_active: true,
                        created_at: '2024-01-01',
                        last_response: '2024-07-01',
                        avg_mood: 4.5,
                        response_count: 12
                      },
                      {
                        id: '2',
                        first_name: 'Bob',
                        last_name: 'Smith',
                        email: 'bob@example.com',
                        phone: '+254700000002',
                        department: 'Design',
                        position: 'Designer',
                        is_active: false,
                        created_at: '2024-01-02',
                        last_response: '2024-06-28',
                        avg_mood: 3.8,
                        response_count: 8
                      }
                    ])
                    setDepartments([
                      { name: 'Engineering', count: 1 },
                      { name: 'Design', count: 1 }
                    ])
                    setLoading(false)
                  }, 500)
                }}
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
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name} ({dept.count})
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Team Members ({filteredEmployees.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Response</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Mood</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="mt-1">Try adjusting your search or filters, or add your first employee.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{employee.email || 'No email'}</div>
                            <div className="text-xs text-gray-400">{employee.position || 'No position'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {employee.department || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          employee.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.last_response || 'No responses'}
                        {employee.response_count !== undefined && (
                          <div className="text-xs text-gray-400">
                            {employee.response_count} total responses
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.avg_mood ? (
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              employee.avg_mood >= 4 ? 'text-green-600' :
                              employee.avg_mood >= 3 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {employee.avg_mood}
                            </span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  employee.avg_mood >= 4 ? 'bg-green-500' :
                                  employee.avg_mood >= 3 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${(employee.avg_mood / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit Employee"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Send Check-in"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                          <button
                            className={`p-1 rounded ${
                              employee.is_active
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={employee.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {employee.is_active ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        {/* Department Summary Cards */}
        {departments.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map(dept => (
              <div key={dept.name} className="bg-white p-4 rounded-lg border border-gray-100">
                <h3 className="font-medium text-gray-900">{dept.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{dept.count}</p>
                <p className="text-sm text-gray-500">employees</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            setLoading(true)
            setTimeout(() => {
              setEmployees([
                ...employees,
                {
                  id: (employees.length + 1).toString(),
                  first_name: 'New',
                  last_name: 'Employee',
                  email: 'new@example.com',
                  phone: '+254700000000',
                  department: 'New',
                  position: 'New',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  last_response: new Date().toISOString(),
                  avg_mood: 4.5,
                  response_count: 1
                }
              ])
              setDepartments([
                ...departments,
                { name: 'New', count: 1 }
              ])
              setLoading(false)
            }, 500)
          }}
          organizationId={profile?.organization_id}
        />
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <ImportEmployeesModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            setLoading(true)
            setTimeout(() => {
              setEmployees([
                ...employees,
                {
                  id: (employees.length + 1).toString(),
                  first_name: 'New',
                  last_name: 'Employee',
                  email: 'new@example.com',
                  phone: '+254700000000',
                  department: 'New',
                  position: 'New',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  last_response: new Date().toISOString(),
                  avg_mood: 4.5,
                  response_count: 1
                }
              ])
              setDepartments([
                ...departments,
                { name: 'New', count: 1 }
              ])
              setLoading(false)
            }, 500)
          }}
          organizationId={profile?.organization_id}
        />
      )}
    </div>
  )
}

// Add Employee Modal Component
function AddEmployeeModal({ onClose, onSuccess, organizationId }: {
  onClose: () => void
  onSuccess: () => void
  organizationId?: string
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('employees')
        .insert({
          ...formData,
          organization_id: organizationId,
          phone: formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`
        })

      if (insertError) throw insertError

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add New Employee</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+254712345678"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Import Employees Modal Component
function ImportEmployeesModal({ onClose, onSuccess, organizationId }: {
  onClose: () => void
  onSuccess: () => void
  organizationId?: string
}) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importResults, setImportResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setCsvFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)

      // Parse for preview
      try {
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })
        setPreviewData(preview)
        setStep('preview')
      } catch (err) {
        setError('Error parsing CSV file')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!organizationId || !csvData) return

    setStep('importing')
    setLoading(true)

    try {
      const response = await fetch('/api/employees/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          csvData
        })
      })

      const results = await response.json()
      setImportResults(results)
      setStep('results')

      if (results.success && results.imported > 0) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message)
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/employees/import')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employee_import_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download template')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Import Employees</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</p>
                <p className="text-gray-600 mb-4">Select a CSV file with employee data</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                >
                  Choose File
                </label>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>first_name</strong> (required): Employee's first name</li>
                <li>• <strong>last_name</strong> (required): Employee's last name</li>
                <li>• <strong>phone</strong> (required): WhatsApp phone number with country code</li>
                <li>• <strong>email</strong> (optional): Employee's email address</li>
                <li>• <strong>department</strong> (optional): Department name</li>
                <li>• <strong>position</strong> (optional): Job position/title</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Download Template CSV
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Preview Data</h3>
              <p className="text-sm text-gray-600">
                Showing first 5 rows of {csvData.split('\n').length - 1} total rows
              </p>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">First Name</th>
                    <th className="px-4 py-2 text-left">Last Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Department</th>
                    <th className="px-4 py-2 text-left">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{row.first_name || '-'}</td>
                      <td className="px-4 py-2">{row.last_name || '-'}</td>
                      <td className="px-4 py-2">{row.email || '-'}</td>
                      <td className="px-4 py-2">{row.phone || '-'}</td>
                      <td className="px-4 py-2">{row.department || '-'}</td>
                      <td className="px-4 py-2">{row.position || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Import Employees
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Importing employees...</p>
            <p className="text-gray-600">Please wait while we process your data</p>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && importResults && (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                importResults.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  importResults.success ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {importResults.success ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
                <p className="text-sm text-green-700">Successfully Imported</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {importResults.errors.map((error: any, index: number) => (
                    <div key={index} className="p-3 border-b last:border-b-0">
                      <p className="text-sm font-medium text-red-600">Row {error.row}: {error.error}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(error.data)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
