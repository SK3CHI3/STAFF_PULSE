'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, Building2, BarChart2, HeartPulse, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (profile && profile.role !== 'super_admin') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, profile, loading, router])

  // Show loading while authentication is in progress
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show access denied if we're sure the user is not a super admin
  if (profile.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Super Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-white/80 shadow-xl border-r border-gray-200 backdrop-blur-xl fixed top-0 left-0 z-40">
        <div className="flex items-center h-16 px-6 border-b border-gray-100">
          <img src="/logo.svg" alt="StaffPulse Logo" className="w-8 h-8 rounded-lg bg-white p-0.5 shadow" />
          <span className="ml-3 text-xl font-bold text-gray-900">StaffPulse</span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link href="/super-admin" className="flex items-center px-4 py-2 rounded-lg text-gray-800 hover:bg-blue-50 font-medium group">
            <LayoutDashboard className="w-5 h-5 mr-3 text-blue-600 group-hover:text-blue-800" />
            Overview
          </Link>
          <Link href="/super-admin/organizations" className="flex items-center px-4 py-2 rounded-lg text-gray-800 hover:bg-blue-50 font-medium group">
            <Building2 className="w-5 h-5 mr-3 text-blue-600 group-hover:text-blue-800" />
            Organizations
          </Link>
          <Link href="/super-admin/analytics" className="flex items-center px-4 py-2 rounded-lg text-gray-800 hover:bg-blue-50 font-medium group">
            <BarChart2 className="w-5 h-5 mr-3 text-blue-600 group-hover:text-blue-800" />
            Analytics
          </Link>
          <Link href="/super-admin/system" className="flex items-center px-4 py-2 rounded-lg text-gray-800 hover:bg-blue-50 font-medium group">
            <HeartPulse className="w-5 h-5 mr-3 text-blue-600 group-hover:text-blue-800" />
            System Health
          </Link>
        </nav>
        <div className="mt-auto px-6 py-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">{profile?.first_name?.[0] || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
            <button onClick={signOut} className="text-gray-400 hover:text-red-600" title="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <div className="lg:ml-64 flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            {/* Add quick actions or notifications here if needed */}
          </div>
        </header>
        {/* Main content area */}
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}
