'use client'

import React from 'react'
import Link from 'next/link'
import { useFeature, useAction } from '@/hooks/useFeatureAccess'

interface FeatureGateProps {
  feature?: string
  action?: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  upgradeMessage?: string
}

export function FeatureGate({ 
  feature, 
  action, 
  children, 
  fallback, 
  showUpgradePrompt = true,
  upgradeMessage 
}: FeatureGateProps) {
  // Use either feature or action check
  const featureResult = useFeature(feature || '')
  const actionResult = useAction(action || '')
  
  const result = feature ? featureResult : actionResult
  const { hasAccess, reason, plan, loading, currentCount, limit } = result

  if (loading) {
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

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Show upgrade prompt if enabled
  if (showUpgradePrompt) {
    return (
      <UpgradePrompt 
        reason={reason || upgradeMessage}
        plan={plan}
        currentCount={currentCount}
        limit={limit}
        feature={feature}
        action={action}
      />
    )
  }

  // Don't render anything if no access and no fallback
  return null
}

interface UpgradePromptProps {
  reason?: string
  plan?: string
  currentCount?: number
  limit?: number
  feature?: string
  action?: string
}

function UpgradePrompt({ reason, plan, currentCount, limit, feature, action }: UpgradePromptProps) {
  const getUpgradeMessage = () => {
    if (currentCount !== undefined && limit !== undefined) {
      return `You've reached your limit (${currentCount}/${limit}). Upgrade your plan to add more.`
    }
    
    if (reason) {
      return reason
    }

    if (feature) {
      return `This feature is not available in your current ${plan || 'free'} plan.`
    }

    if (action) {
      return `This action is not available in your current ${plan || 'free'} plan.`
    }

    return 'Upgrade your plan to access this feature.'
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">Upgrade Required</h3>
          <p className="mt-1 text-sm text-blue-700">
            {getUpgradeMessage()}
          </p>
          <div className="mt-3 flex space-x-3">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Upgrade Plan
            </Link>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Specific feature gates for common features
export function AIInsightsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <FeatureGate 
      feature="ai_insights" 
      fallback={fallback}
      upgradeMessage="AI insights are available in Professional and Enterprise plans."
    >
      {children}
    </FeatureGate>
  )
}

export function AdvancedAnalyticsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <FeatureGate 
      feature="advanced_analytics" 
      fallback={fallback}
      upgradeMessage="Advanced analytics are available in Professional and Enterprise plans."
    >
      {children}
    </FeatureGate>
  )
}

export function DataExportGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <FeatureGate 
      feature="data_export" 
      fallback={fallback}
      upgradeMessage="Data export is available in Professional and Enterprise plans."
    >
      {children}
    </FeatureGate>
  )
}

export function EmployeeLimitGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <FeatureGate 
      action="add_employee" 
      fallback={fallback}
      upgradeMessage="You've reached your employee limit. Upgrade to add more employees."
    >
      {children}
    </FeatureGate>
  )
}
