'use client'

import React from 'react'
import Link from 'next/link'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

interface PlanStatusProps {
  className?: string
  showDetails?: boolean
}

export function PlanStatus({ className = '', showDetails = true }: PlanStatusProps) {
  const { 
    plan, 
    isActive, 
    employeeCount, 
    employeeLimit, 
    overEmployeeLimit, 
    loading, 
    error 
  } = useFeatureAccess()

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading plan status
      </div>
    )
  }

  const planNames: Record<string, string> = {
    free: 'Starter',
    team: 'Professional', 
    enterprise: 'Enterprise'
  }

  const planName = planNames[plan] || plan
  const employeePercentage = employeeLimit > 0 ? (employeeCount / employeeLimit) * 100 : 0

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{planName} Plan</h3>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            {overEmployeeLimit && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Over Limit
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Manage
        </Link>
      </div>

      {showDetails && (
        <div className="space-y-3">
          {/* Employee Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Employees</span>
              <span className={`font-medium ${overEmployeeLimit ? 'text-red-600' : 'text-gray-900'}`}>
                {employeeCount}/{employeeLimit === -1 ? '∞' : employeeLimit}
              </span>
            </div>
            {employeeLimit > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    overEmployeeLimit 
                      ? 'bg-red-500' 
                      : employeePercentage > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(employeePercentage, 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Upgrade prompt if needed */}
          {(overEmployeeLimit || employeePercentage > 90) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    {overEmployeeLimit ? 'Employee limit exceeded' : 'Approaching employee limit'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Consider upgrading your plan to add more employees and unlock additional features.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Upgrade Plan
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar or header
export function PlanStatusCompact({ className = '' }: { className?: string }) {
  const { plan, employeeCount, employeeLimit, overEmployeeLimit, loading } = useFeatureAccess()

  if (loading) {
    return <div className={`animate-pulse h-4 bg-gray-200 rounded ${className}`}></div>
  }

  const planNames: Record<string, string> = {
    free: 'Starter',
    team: 'Pro', 
    enterprise: 'Enterprise'
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <span className="text-gray-600">{planNames[plan] || plan}</span>
      <span className={`font-medium ${overEmployeeLimit ? 'text-red-600' : 'text-gray-900'}`}>
        {employeeCount}/{employeeLimit === -1 ? '∞' : employeeLimit}
      </span>
      {overEmployeeLimit && (
        <span className="text-red-600">⚠️</span>
      )}
    </div>
  )
}
