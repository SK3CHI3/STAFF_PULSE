'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface FeatureAccessResult {
  hasAccess: boolean
  reason?: string
  plan?: string
  currentCount?: number
  limit?: number
  loading?: boolean
}

interface FeatureAccessState {
  loading: boolean
  error: string | null
  access: Record<string, FeatureAccessResult>
  plan: string
  isActive: boolean
  employeeCount: number
  employeeLimit: number
  overEmployeeLimit: boolean
}

export function useFeatureAccess() {
  const { profile } = useAuth()
  const [state, setState] = useState<FeatureAccessState>({
    loading: true,
    error: null,
    access: {},
    plan: 'free',
    isActive: true,
    employeeCount: 0,
    employeeLimit: 4,
    overEmployeeLimit: false
  })

  const fetchFeatureAccess = useCallback(async () => {
    if (!profile?.organization?.id) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch(`/api/billing/features?organizationId=${profile.organization.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feature access')
      }

      setState(prev => ({
        ...prev,
        loading: false,
        access: data.features || {},
        plan: data.plan || 'free',
        isActive: data.isActive || false,
        employeeCount: data.employeeCount || 0,
        employeeLimit: data.employeeLimit || 4,
        overEmployeeLimit: data.overEmployeeLimit || false
      }))

    } catch (error) {
      console.error('Error fetching feature access:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check feature access'
      }))
    }
  }, [profile?.organization?.id])

  useEffect(() => {
    fetchFeatureAccess()
  }, [fetchFeatureAccess])

  // Check if a specific feature is available
  const hasFeature = useCallback((featureName: string): FeatureAccessResult => {
    const feature = state.access[featureName]
    if (!feature) {
      return { hasAccess: false, reason: 'Feature not found' }
    }
    return feature
  }, [state.access])

  // Check if an action can be performed
  const canPerformAction = useCallback(async (action: string): Promise<FeatureAccessResult> => {
    if (!profile?.organization?.id) {
      return { hasAccess: false, reason: 'Organization not found' }
    }

    try {
      const response = await fetch(`/api/billing/features?organizationId=${profile.organization.id}&action=${action}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check action permission')
      }

      return {
        hasAccess: data.canPerform || false,
        reason: data.reason,
        plan: data.plan,
        currentCount: data.currentCount,
        limit: data.limit
      }
    } catch (error) {
      console.error('Error checking action permission:', error)
      return { hasAccess: false, reason: 'Error checking permission' }
    }
  }, [profile?.organization?.id])

  return {
    ...state,
    hasFeature,
    canPerformAction,
    refresh: fetchFeatureAccess
  }
}

// Hook for checking specific feature
export function useFeature(featureName: string) {
  const { hasFeature, loading, error } = useFeatureAccess()
  const [featureState, setFeatureState] = useState<FeatureAccessResult>({
    hasAccess: false
  })

  useEffect(() => {
    if (!loading) {
      setFeatureState(hasFeature(featureName))
    }
  }, [featureName, hasFeature, loading])

  return {
    ...featureState,
    loading,
    error
  }
}

// Hook for checking specific action
export function useAction(action: string) {
  const { canPerformAction } = useFeatureAccess()
  const [actionState, setActionState] = useState<FeatureAccessResult>({
    hasAccess: false,
    loading: true
  })

  useEffect(() => {
    let mounted = true
    
    canPerformAction(action).then(result => {
      if (mounted) {
        setActionState({ ...result, loading: false })
      }
    })

    return () => {
      mounted = false
    }
  }, [action, canPerformAction])

  return actionState
}
