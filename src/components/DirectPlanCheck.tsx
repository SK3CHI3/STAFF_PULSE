'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface DirectPlanCheckProps {
  children: React.ReactNode
  requiredPlans: string[] // Array of plan IDs that have access
  featureName: string
}

export function DirectPlanCheck({ 
  children, 
  requiredPlans, 
  featureName 
}: DirectPlanCheckProps) {
  const { profile, loading: profileLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (profileLoading) return

    // Simple direct check - if the organization's plan is in the requiredPlans array
    if (profile?.organization?.subscription_plan) {
      const currentPlan = profile.organization.subscription_plan
      console.log(`🔍 [DirectPlanCheck] Checking plan: ${currentPlan} for feature: ${featureName}`)
      console.log(`🔍 [DirectPlanCheck] Required plans:`, requiredPlans)
      console.log(`🔍 [DirectPlanCheck] Organization:`, JSON.stringify(profile.organization, null, 2))
      
      const planHasAccess = requiredPlans.includes(currentPlan)
      console.log(`🔍 [DirectPlanCheck] Has access: ${planHasAccess}`)
      
      setHasAccess(planHasAccess)
    } else {
      console.log(`❌ [DirectPlanCheck] No subscription plan found in profile`)
      setHasAccess(false)
    }
    
    setChecking(false)
  }, [profile, profileLoading, requiredPlans, featureName])

  if (checking || profileLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  // Show upgrade prompt
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {/* Lock Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Upgrade Required
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {featureName === 'ai_insights' 
              ? 'AI insights are available in Professional and Enterprise plans.'
              : `This feature requires a higher subscription plan.`
            }
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/dashboard/billing"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Upgrade Plan
            </Link>
            <Link
              href="/dashboard/billing"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Specific feature gates
export function AIInsightsDirectCheck({ children }: { children: React.ReactNode }) {
  return (
    <DirectPlanCheck
      requiredPlans={['team', 'enterprise']}
      featureName="ai_insights"
    >
      {children}
    </DirectPlanCheck>
  )
}
