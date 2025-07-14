'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useMemo, useEffect, useState } from 'react'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'no-organization'

export interface AuthGuardResult {
  authState: AuthState
  user: any
  profile: any
  loading: boolean
  isAuthenticated: boolean
  needsAuth: boolean
  needsOrganization: boolean
  error: string | null
}

/**
 * Simplified authentication guard hook
 * Provides consistent authentication state across all components
 */
export function useAuthGuard(): AuthGuardResult {
  const { user, profile, loading, initialized, error } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (initialized && user && !profile && !error) {
      console.log('🔐 [AuthGuard] Starting profile load timeout (5s)')
      const timeout = setTimeout(() => {
        console.warn('🔐 [AuthGuard] Profile load timeout reached - this may indicate a network or database issue')
        setTimeoutReached(true)
      }, 5000) // Reduced to 5 second timeout

      return () => clearTimeout(timeout)
    } else {
      setTimeoutReached(false)
    }
  }, [initialized, user, profile, error])

  const authState: AuthState = useMemo(() => {
    // Still initializing or loading
    if (!initialized || loading) {
      console.log('🔐 [AuthGuard] State: loading (initialized:', initialized, 'loading:', loading, ')')
      return 'loading'
    }

    // No user = not authenticated
    if (!user) {
      console.log('🔐 [AuthGuard] State: unauthenticated (no user)')
      return 'unauthenticated'
    }

    // User but no profile = still loading or error
    if (!profile) {
      if (timeoutReached) {
        console.error('🔐 [AuthGuard] State: unauthenticated (profile timeout)')
        return 'unauthenticated'
      }
      console.log('🔐 [AuthGuard] State: loading (waiting for profile)')
      return 'loading'
    }

    // User and profile but no organization = setup incomplete (except for super admins)
    if (!profile.organization_id && profile.role !== 'super_admin') {
      console.log('🔐 [AuthGuard] State: no-organization')
      return 'no-organization'
    }

    // All good!
    console.log('🔐 [AuthGuard] State: authenticated')
    return 'authenticated'
  }, [user, profile, loading, initialized, timeoutReached])

  return {
    authState,
    user,
    profile,
    loading: authState === 'loading',
    isAuthenticated: authState === 'authenticated',
    needsAuth: authState === 'unauthenticated',
    needsOrganization: authState === 'no-organization',
    error: timeoutReached ? 'Profile loading timeout - please refresh the page' : error
  }
}
