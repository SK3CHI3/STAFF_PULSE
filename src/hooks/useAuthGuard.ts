import { useAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'

export function useAuthGuard() {
  const { user, profile, loading, initialized } = useAuth()
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'no-org'>('loading')

  useEffect(() => {
    console.log('🛡️ [AuthGuard] State check:', {
      initialized,
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      hasOrg: !!profile?.organization?.id,
      currentAuthState: authState
    })

    // Only evaluate auth state after initialization
    if (!initialized || loading) {
      console.log('🛡️ [AuthGuard] Still loading/initializing')
      setAuthState('loading')
      return
    }

    // No user = not authenticated
    if (!user) {
      console.log('🛡️ [AuthGuard] No user found - unauthenticated')
      setAuthState('unauthenticated')
      return
    }

    // User but no profile = still loading or error
    if (!profile) {
      console.log('🛡️ [AuthGuard] User found but no profile - waiting...')
      // Give it a moment for profile to load, but don't wait forever
      const timeout = setTimeout(() => {
        console.log('🛡️ [AuthGuard] Profile timeout - treating as auth failure')
        setAuthState('unauthenticated') // Treat as auth failure if profile doesn't load
      }, 15000) // Increased from 5s to 15s

      return () => clearTimeout(timeout)
    }

    // User and profile but no organization = setup incomplete
    if (!profile.organization?.id) {
      console.log('🛡️ [AuthGuard] Profile found but no organization - needs setup')
      console.log('🛡️ [AuthGuard] Profile structure:', {
        hasOrganizationId: !!profile.organization_id,
        organizationId: profile.organization_id,
        hasOrganizationObject: !!profile.organization,
        organizationObject: profile.organization
      })
      setAuthState('no-org')
      return
    }

    // All good!
    console.log('🛡️ [AuthGuard] All checks passed - authenticated')
    setAuthState('authenticated')
  }, [user, profile, initialized, loading])

  return {
    authState,
    user,
    profile,
    loading: authState === 'loading',
    isAuthenticated: authState === 'authenticated',
    needsAuth: authState === 'unauthenticated',
    needsOrg: authState === 'no-org'
  }
}
