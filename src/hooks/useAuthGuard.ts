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
 * Optimized authentication guard hook
 * Provides consistent authentication state across all components
 * Now handles profile loading failures gracefully
 */
export function useAuthGuard(): AuthGuardResult {
  const { user, profile, loading, initialized, error } = useAuth()
  const [forceComplete, setForceComplete] = useState(false)

  // Safety timeout - if we're stuck in loading for too long, force completion
  useEffect(() => {
    if (loading && initialized) {
      const timeout = setTimeout(() => {
        console.warn('🔐 [AuthGuard] Loading timeout - forcing completion')
        setForceComplete(true)
      }, 15000) // 15 seconds timeout

      return () => clearTimeout(timeout)
    }
  }, [loading, initialized])

  const authState: AuthState = useMemo(() => {
    // Force completion if timeout occurred
    if (forceComplete) {
      console.log('🔐 [AuthGuard] State: forced completion due to timeout')
      return user ? 'no-organization' : 'unauthenticated'
    }

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

    // User is authenticated - profile loading is optional
    // If profile failed to load but user exists, we can still proceed
    if (!profile) {
      console.log('🔐 [AuthGuard] State: authenticated (no profile, but user exists)')
      // If there's an error message about profile loading, treat as no-organization
      // This allows the user to proceed and potentially set up their profile
      if (error && (error.includes('Profile could not be loaded') || error.includes('Profile loading timed out'))) {
        console.log('🔐 [AuthGuard] Profile failed to load, treating as no-organization')
        return 'no-organization'
      }
      // If no error, assume we're still loading (but this should be rare now)
      return 'loading'
    }

    // Debug: Log the actual profile data to see what's happening
    console.log('🔐 [AuthGuard] Profile debug:', {
      hasProfile: !!profile,
      organizationId: profile?.organization_id,
      role: profile?.role,
      organization: profile?.organization
    })

    // User and profile but no organization = setup incomplete (except for super admins)
    // Since users set up organization during signup, this should be rare
    if (!profile.organization_id && profile.role !== 'super_admin') {
      console.log('🔐 [AuthGuard] State: no-organization (this should be rare since org is created during signup)')
      return 'no-organization'
    }

    // All good!
    console.log('🔐 [AuthGuard] State: authenticated')
    return 'authenticated'
  }, [user, profile, loading, initialized, error, forceComplete])

  return {
    authState,
    user,
    profile,
    loading: authState === 'loading',
    isAuthenticated: authState === 'authenticated',
    needsAuth: authState === 'unauthenticated',
    needsOrganization: authState === 'no-organization',
    error
  }
}
