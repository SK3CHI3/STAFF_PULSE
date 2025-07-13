'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  const router = useRouter()
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [deptCreating, setDeptCreating] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  })
  const [empCreating, setEmpCreating] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
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

  // Create department function
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !profile?.organization?.id) return;

    setDeptCreating(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: profile.organization.id,
          name: newDeptName.trim()
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to create department');

      // Reset form and close modal
      setNewDeptName('');
      setShowDeptModal(false);

      // Refresh departments
      await fetchDepartments();
    } catch (error: any) {
      alert(error.message || 'Failed to create department');
    } finally {
      setDeptCreating(false);
    }
  };

  // Create employee function
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.first_name.trim() || !newEmployee.last_name.trim() || !newEmployee.phone.trim() || !profile?.organization?.id) return;

    setEmpCreating(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: profile.organization.id,
          ...newEmployee
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to create employee');

      // Reset form and close modal
      setNewEmployee({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        position: ''
      });
      setShowAddModal(false);

      // Refresh employees
      await fetchEmployees();
    } catch (error: any) {
      alert(error.message || 'Failed to create employee');
    } finally {
      setEmpCreating(false);
    }
  };

  // Handle CSV file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setImportResult(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  // Handle CSV import
  const handleImportCSV = async () => {
    if (!csvFile || !profile?.organization?.id) return;

    setCsvImporting(true);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await csvFile.text();

      // Send to API
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: profile.organization.id,
          csvData: fileContent
        })
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);

      // If successful, refresh employees
      if (result.imported > 0) {
        await fetchEmployees();
      }

    } catch (error: any) {
      alert(error.message || 'Failed to import CSV');
    } finally {
      setCsvImporting(false);
    }
  };

  // Download CSV template
  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/employees/import', { method: 'GET' });
      const csvContent = await res.text();

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download template');
    }
  };

  // Reset import modal
  const resetImportModal = () => {
    setCsvFile(null);
    setImportResult(null);
    setShowImportModal(false);
  };

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
  }, [profile?.organization?.id, selectedDepartment, selectedStatus]);

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
    if (!departments.length || !employees.length) return;

    const deptCountMap: Record<string, number> = {};
    employees.forEach((emp: any) => {
      if (emp.department) {
        const deptKey = emp.department.trim().toLowerCase();
        deptCountMap[deptKey] = (deptCountMap[deptKey] || 0) + 1;
      }
    });

    setDepartments(prev => prev.map(d => {
      const deptKey = d.name.trim().toLowerCase();
      const count = deptCountMap[deptKey] || 0;
      return { ...d, count };
    }));
  }, [employees, departments.length]);

  // Fetch departments initially
  useEffect(() => {
    if (profile?.organization?.id) {
      fetchDepartments();
    }
  }, [profile?.organization?.id, fetchDepartments]);

  // Fetch employees when filters or profile change
  useEffect(() => {
    if (profile?.organization?.id) {
      fetchEmployees();
    }
  }, [profile?.organization?.id, selectedDepartment, selectedStatus, fetchEmployees]);

  // Authentication is handled by dashboard layout AuthGuard
  if (!profile?.organization_id) {
    return <LoadingState message="Loading organization data..." />
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => {
                setShowAddModal(false);
                setNewEmployee({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  department: '',
                  position: ''
                });
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">Add New Employee</h2>
            <form onSubmit={handleCreateEmployee}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={newEmployee.first_name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="John"
                    required
                    disabled={empCreating}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={newEmployee.last_name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Doe"
                    required
                    disabled={empCreating}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="john.doe@company.com"
                  disabled={empCreating}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="+254712345678"
                  required
                  disabled={empCreating}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-900 mb-2">
                    Department
                  </label>
                  <select
                    id="department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    disabled={empCreating}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-900 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Software Developer"
                    disabled={empCreating}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmployee({
                      first_name: '',
                      last_name: '',
                      email: '',
                      phone: '',
                      department: '',
                      position: ''
                    });
                  }}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={empCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  disabled={empCreating || !newEmployee.first_name.trim() || !newEmployee.last_name.trim() || !newEmployee.phone.trim()}
                >
                  {empCreating ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={resetImportModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">Import Employees from CSV</h2>

            {!importResult ? (
              <div>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Upload a CSV file to bulk import employees. Make sure your CSV includes the required columns.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>first_name</strong> (required)</li>
                      <li>• <strong>last_name</strong> (required)</li>
                      <li>• <strong>phone</strong> (required)</li>
                      <li>• <strong>email</strong> (optional)</li>
                      <li>• <strong>department</strong> (optional)</li>
                      <li>• <strong>position</strong> (optional)</li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={downloadTemplate}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download CSV Template</span>
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="csvFileInput"
                    />
                    <label htmlFor="csvFileInput" className="cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600 mb-2">
                        {csvFile ? csvFile.name : 'Click to select CSV file or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-500">CSV files only</p>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={resetImportModal}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={csvImporting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportCSV}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    disabled={!csvFile || csvImporting}
                  >
                    {csvImporting ? 'Importing...' : 'Import Employees'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className={`p-4 rounded-lg ${importResult.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h4 className={`font-medium mb-2 ${importResult.imported > 0 ? 'text-green-900' : 'text-red-900'}`}>
                      Import Results
                    </h4>
                    <div className={`text-sm ${importResult.imported > 0 ? 'text-green-800' : 'text-red-800'}`}>
                      <p>✅ Successfully imported: {importResult.imported} employees</p>
                      {importResult.failed > 0 && (
                        <p>❌ Failed to import: {importResult.failed} employees</p>
                      )}
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-900 mb-2">Import Errors:</h5>
                      <div className="text-sm text-yellow-800 max-h-32 overflow-y-auto">
                        {importResult.errors.map((error: any, index: number) => (
                          <p key={index}>Row {error.row}: {error.error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={resetImportModal}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => {
                setShowDeptModal(false);
                setNewDeptName('');
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">Create New Department</h2>
            <form onSubmit={handleCreateDepartment}>
              <div className="mb-6">
                <label htmlFor="deptName" className="block text-sm font-medium text-gray-900 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  id="deptName"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., Engineering, Marketing, Sales"
                  required
                  disabled={deptCreating}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeptModal(false);
                    setNewDeptName('');
                  }}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={deptCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  disabled={deptCreating || !newDeptName.trim()}
                >
                  {deptCreating ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
