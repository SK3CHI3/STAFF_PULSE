import { useAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'

export function useAuthGuard() {
  const { user, profile, loading, initialized } = useAuth()
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'no-org'>('loading')

  useEffect(() => {
    // Only evaluate auth state after initialization
    if (!initialized || loading) {
      setAuthState('loading')
      return
    }

    // No user = not authenticated
    if (!user) {
      setAuthState('unauthenticated')
      return
    }

    // User but no profile = still loading or error
    if (!profile) {
      // Give it a moment for profile to load, but don't wait forever
      const timeout = setTimeout(() => {
        setAuthState('unauthenticated') // Treat as auth failure if profile doesn't load
      }, 15000) // Increased from 5s to 15s

      return () => clearTimeout(timeout)
    }

    // User and profile but no organization = setup incomplete
    if (!profile.organization?.id) {
      setAuthState('no-org')
      return
    }

    // All good!
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
