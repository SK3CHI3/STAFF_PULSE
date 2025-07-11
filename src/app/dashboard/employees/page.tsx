'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { LoadingState, ErrorState } from '@/components/LoadingState'

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
  id: string;
  name: string;
  count?: number;
}

export default function Employees() {
  // ALL HOOKS MUST BE DECLARED FIRST - NO CONDITIONAL RETURNS BEFORE THIS
  const { authState, profile, isAuthenticated, needsAuth, needsOrg } = useAuthGuard()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    if (!profile?.organization?.id) return;
    setDepartmentsLoading(true);
    try {
      const res = await fetch(`/api/departments?organizationId=${profile.organization.id}`);
      const result = await res.json();
      if (result.success) {
        const deptList: Department[] = (result.departments || []).map((d: any) => ({ id: d.id, name: d.name, count: 0 }));
        setDepartments(deptList);
      } else {
        setDepartments([]);
      }
    } catch {
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  }, [profile?.organization?.id]);

  // Fetch employees and departments from API
  const fetchEmployees = useCallback(async () => {
    if (!profile?.organization?.id) return;
    setLoading(true);
    setError(null);
    try {
      let url = `/api/employees?organizationId=${profile.organization.id}`;
      if (selectedDepartment && selectedDepartment !== 'all') {
        url += `&department=${encodeURIComponent(selectedDepartment)}`;
      }
      if (selectedStatus && selectedStatus !== 'all') {
        url += `&status=${encodeURIComponent(selectedStatus)}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch employees');
      setEmployees(result.employees || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
    await fetchDepartments();
  }, [profile?.organization?.id, selectedDepartment, selectedStatus, fetchDepartments]);

  // Memoize formatted last_response for each employee
  const employeesWithFormattedDates = useMemo(() => {
    return employees.map(emp => ({
      ...emp,
      last_response: emp.last_response
        ? (hasHydrated ? new Date(emp.last_response).toLocaleDateString() : new Date(emp.last_response).toISOString().slice(0,10))
        : null
    }))
  }, [employees, hasHydrated])

  // Filter employees - memoized for performance
  const filteredEmployees = useMemo(() => {
    return employeesWithFormattedDates.filter(employee => {
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
  }, [employeesWithFormattedDates, searchTerm, selectedDepartment, selectedStatus])

  // ALL useEffect HOOKS
  useEffect(() => { setHasHydrated(true) }, [])

  // Recalculate department counts whenever employees or departments change
  useEffect(() => {
    if (!departments.length) return;
    const deptCountMap: Record<string, number> = {};
    employees.forEach((emp: any) => {
      if (emp.department) {
        const deptKey = emp.department.trim().toLowerCase();
        deptCountMap[deptKey] = (deptCountMap[deptKey] || 0) + 1;
      }
    });
    setDepartments(prev => prev.map(d => {
      const deptKey = d.name.trim().toLowerCase();
      return { ...d, count: deptCountMap[deptKey] || 0 };
    }));
  }, [employees, departments.length]);

  // Fetch employees when filters or profile change
  useEffect(() => {
    if (profile?.organization?.id) {
      fetchEmployees();
    }
  }, [profile?.organization?.id, selectedDepartment, selectedStatus, fetchEmployees]);

  // NOW CONDITIONAL RETURNS ARE SAFE
  if (authState === 'loading') {
    return <LoadingState message="Loading employees..." />
  }

  if (needsAuth) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
    return <LoadingState message="Redirecting to login..." />
  }

  if (needsOrg) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/organization/setup'
    }
    return <LoadingState message="Setting up your organization..." />
  }

  if (!isAuthenticated) {
    return <ErrorState message="Authentication failed" />
  }

  if (loading) {
    return <LoadingState message="Loading employees data..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => {
      setError(null)
      setLoading(true)
      if (profile?.organization?.id) {
        fetchEmployees()
      }
    }} />
  }

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchEmployees();
  };
  
  const handleImportSuccess = () => {
    setShowImportModal(false);
    fetchEmployees();
  };

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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 cursor-pointer"
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
                onClick={() => setShowDeptModal(true)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Department</span>
              </button>
              <button
                onClick={() => {
                  setLoading(true)
                  fetchEmployees()
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

      {/* Department Summary Cards */}
      {departments.length > 0 && (
        <div className="px-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map(dept => (
              <div
                key={dept.name}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-blue-700 transition-colors">{dept.name}</h3>
                <p className="text-3xl font-extrabold text-blue-600 mt-1 mb-1 group-hover:text-blue-800 transition-colors">{dept.count}</p>
                <p className="text-sm text-gray-500">employees</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                className="text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </main>
    </div>
  )
}
