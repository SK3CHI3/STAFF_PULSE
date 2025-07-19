'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Types
export interface UserProfile {
  id: string
  organization_id: string | null
  first_name: string | null
  last_name: string | null
  email: string
  role: 'super_admin' | 'hr_admin'
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  organization?: {
    id: string
    name: string
    email: string
    subscription_plan: string
    subscription_status: string
  } | null
  created_at: string
  updated_at: string
}

export interface SignInData {
  email: string
  password: string
}

export interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
  companyName: string
  teamSize: string
}

export interface AuthResponse {
  user: User | null
  error: AuthError | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (data: SignInData) => Promise<AuthResponse>
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signOut: () => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Generate unique ID for this provider instance (each tab gets its own)
  // This is normal - Supabase handles multi-tab sync via localStorage and auth events
  const providerId = useMemo(() => Math.random().toString(36).substr(2, 9), [])

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null
  })

  // Add timeout and retry state
  const [initTimeout, setInitTimeout] = useState<NodeJS.Timeout | null>(null)
  const [profileFetching, setProfileFetching] = useState(false)
  const MAX_RETRIES = 2 // Reduced retries
  const INIT_TIMEOUT = 10000 // 10 seconds
  const PROFILE_TIMEOUT = 8000 // 8 seconds for profile fetch

  // Global profile cache key for multi-tab coordination
  const PROFILE_CACHE_KEY = 'staffpulse_profile_cache'
  const PROFILE_FETCH_LOCK_KEY = 'staffpulse_profile_fetching'

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear profile cache when user changes
  const clearProfileCache = useCallback(() => {
    localStorage.removeItem(PROFILE_CACHE_KEY)
    localStorage.removeItem(PROFILE_FETCH_LOCK_KEY)
  }, [PROFILE_CACHE_KEY, PROFILE_FETCH_LOCK_KEY])

  // Optimized profile fetch with multi-tab coordination
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    // Check if another tab is already fetching
    const isAnotherTabFetching = localStorage.getItem(PROFILE_FETCH_LOCK_KEY)
    if (isAnotherTabFetching && profileFetching) {
      console.log(`🔐 [AuthProvider:${providerId}] Another tab is fetching profile, waiting...`)

      // Wait for the other tab to finish and check cache
      await new Promise(resolve => setTimeout(resolve, 1000))
      const cachedProfile = localStorage.getItem(PROFILE_CACHE_KEY)
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile)
          if (parsed.userId === userId && Date.now() - parsed.timestamp < 30000) { // 30 second cache
            console.log(`🔐 [AuthProvider:${providerId}] Using cached profile from another tab`)
            return parsed.profile
          }
        } catch (error) {
          console.warn('Failed to parse cached profile:', error)
        }
      }
    }

    // Prevent concurrent profile fetches in this tab
    if (profileFetching) {
      console.log(`🔐 [AuthProvider:${providerId}] Profile fetch already in progress in this tab, skipping`)
      return null
    }

    setProfileFetching(true)
    localStorage.setItem(PROFILE_FETCH_LOCK_KEY, Date.now().toString())

    try {
      console.log(`🔐 [AuthProvider:${providerId}] Fetching profile for user: ${userId}`)

      // Check cache first - use longer cache during connectivity issues
      const cachedProfile = localStorage.getItem(PROFILE_CACHE_KEY)
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile)
          const cacheAge = Date.now() - parsed.timestamp
          const maxCacheAge = 300000 // 5 minutes during connectivity issues

          if (parsed.userId === userId && cacheAge < maxCacheAge) {
            console.log(`🔐 [AuthProvider:${providerId}] Using cached profile (age: ${Math.round(cacheAge/1000)}s)`)
            return parsed.profile
          }
        } catch (error) {
          console.warn('Failed to parse cached profile:', error)
        }
      }

      // Debug: Check current session before making query
      const currentSession = await supabase.auth.getSession()
      console.log(`🔐 [AuthProvider:${providerId}] Current session before profile fetch:`, {
        hasSession: !!currentSession.data.session,
        hasUser: !!currentSession.data.session?.user,
        userId: currentSession.data.session?.user?.id,
        sessionError: currentSession.error?.message
      })

      // Fetch from database with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, organization_id')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_TIMEOUT)
      )

      let profileData = null
      let profileError = null

      try {
        console.log(`🔐 [AuthProvider:${providerId}] Starting profile query...`)
        const result = await Promise.race([
          profilePromise,
          timeoutPromise
        ]) as any

        console.log(`🔐 [AuthProvider:${providerId}] Profile query completed:`, {
          hasData: !!result.data,
          hasError: !!result.error,
          errorMessage: result.error?.message,
          errorCode: result.error?.code
        })

        profileData = result.data
        profileError = result.error
      } catch (timeoutError) {
        console.warn(`🔐 [AuthProvider:${providerId}] Profile fetch timed out, checking for stale cache`)

        // If fetch times out, try to use stale cache
        const staleCache = localStorage.getItem(PROFILE_CACHE_KEY)
        if (staleCache) {
          try {
            const parsed = JSON.parse(staleCache)
            if (parsed.userId === userId) {
              console.log(`🔐 [AuthProvider:${providerId}] Using stale cached profile due to timeout`)
              return parsed.profile
            }
          } catch (error) {
            console.warn('Failed to parse stale cache:', error)
          }
        }

        // No cache available, return null
        return null
      }

      if (profileError) {
        console.error(`🔐 [AuthProvider:${providerId}] Profile fetch error:`, profileError.message)

        // If profile doesn't exist, just return null
        if (profileError.code === 'PGRST116') {
          console.log(`🔐 [AuthProvider:${providerId}] Profile not found`)
          return null
        }

        // Try stale cache on error too
        const staleCache = localStorage.getItem(PROFILE_CACHE_KEY)
        if (staleCache) {
          try {
            const parsed = JSON.parse(staleCache)
            if (parsed.userId === userId) {
              console.log(`🔐 [AuthProvider:${providerId}] Using stale cached profile due to error`)
              return parsed.profile
            }
          } catch (error) {
            console.warn('Failed to parse stale cache on error:', error)
          }
        }

        return null
      }

      console.log('🔐 [AuthProvider] Profile data fetched:', {
        userId: profileData.id,
        email: profileData.email,
        role: profileData.role,
        hasOrganization: !!profileData.organization_id,
        organizationId: profileData.organization_id
      })

      // Try to fetch organization data quickly if organization_id exists
      let organizationData = null
      if (profileData.organization_id) {
        try {
          console.log('🔐 [AuthProvider] Fetching organization data quickly...')
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, subscription_plan')
            .eq('id', profileData.organization_id)
            .single()

          if (orgError) {
            console.warn('🔐 [AuthProvider] Organization fetch failed:', orgError.message)
          } else {
            organizationData = orgData
            console.log('🔐 [AuthProvider] Organization data loaded:', organizationData.name)
          }
        } catch (error) {
          console.warn('🔐 [AuthProvider] Organization fetch exception:', error)
        }
      }

      const userProfile: UserProfile = {
        ...profileData,
        organization: organizationData
      }

      // Cache the profile for other tabs
      const cacheData = {
        userId,
        profile: userProfile,
        timestamp: Date.now()
      }
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData))

      console.log(`🔐 [AuthProvider:${providerId}] Profile fetch completed successfully`)
      return userProfile
    } catch (error) {
      console.error(`🔐 [AuthProvider:${providerId}] Profile fetch exception:`,
        error instanceof Error ? error.message : 'Unknown error')
      return null
    } finally {
      setProfileFetching(false)
      localStorage.removeItem(PROFILE_FETCH_LOCK_KEY)
    }
  }, [PROFILE_TIMEOUT, profileFetching, providerId, PROFILE_CACHE_KEY, PROFILE_FETCH_LOCK_KEY])



  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!state.user) {
      console.log('🔐 [AuthProvider] No user to refresh profile for')
      return
    }

    console.log('🔐 [AuthProvider] Refreshing profile...')
    const profile = await fetchProfile(state.user.id)

    setState(prev => ({
      ...prev,
      profile,
      error: profile ? null : 'Failed to load profile'
    }))
  }, [state.user, fetchProfile])

  // Simplified user and profile setting - fail fast approach
  const setUserAndProfile = useCallback(async (user: User | null) => {
    console.log('🔐 [AuthProvider] Setting user and profile:', { userId: user?.id })

    if (!user) {
      console.log(`🔐 [AuthProvider:${providerId}] No user provided, clearing state`)
      clearProfileCache() // Clear cache when user logs out
      setState(prev => ({
        ...prev,
        user: null,
        profile: null,
        error: null,
        loading: false,
        initialized: true
      }))
      return
    }

    // Set user immediately and mark as complete - authentication is done
    setState(prev => ({
      ...prev,
      user,
      error: null,
      loading: false,
      initialized: true
    }))

    // Try to fetch profile quickly - if it fails, continue without it
    console.log('🔐 [AuthProvider] Attempting quick profile fetch...')
    try {
      const profile = await fetchProfile(user.id)
      setState(prev => ({
        ...prev,
        profile,
        error: profile ? null : 'Profile could not be loaded, but you are authenticated'
      }))
    } catch (error) {
      console.warn('🔐 [AuthProvider] Profile fetch failed, continuing without profile:', error)
      setState(prev => ({
        ...prev,
        profile: null,
        error: 'Profile could not be loaded, but you are authenticated'
      }))
    }
  }, [fetchProfile])

  // Sign in function
  const signIn = useCallback(async (data: SignInData): Promise<AuthResponse> => {
    try {
      console.log('🔐 [AuthProvider] Signing in...')
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        console.error('🔐 [AuthProvider] Sign-in error:', error)
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        return { user: null, error }
      }

      console.log('🔐 [AuthProvider] Sign-in successful')
      // User will be set via auth state change listener
      setState(prev => ({ ...prev, loading: false }))
      return { user: authData.user, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔐 [AuthProvider] Sign-in exception:', errorMessage)
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { user: null, error: new AuthError(errorMessage) }
    }
  }, [])

  // Sign up function
  const signUp = useCallback(async (data: SignUpData): Promise<AuthResponse> => {
    try {
      console.log('🔐 [AuthProvider] Signing up...')
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            company_name: data.companyName,
            team_size: data.teamSize
          }
        }
      })

      if (error) {
        console.error('🔐 [AuthProvider] Sign-up error:', error)
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        return { user: null, error }
      }

      console.log('🔐 [AuthProvider] Sign-up successful')
      setState(prev => ({ ...prev, loading: false }))
      return { user: authData.user, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔐 [AuthProvider] Sign-up exception:', errorMessage)
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { user: null, error: new AuthError(errorMessage) }
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      console.log('🔐 [AuthProvider] Signing out...')

      // Clear all local storage first
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
          console.log('🔐 [AuthProvider] Local storage cleared')
        } catch (storageError) {
          console.warn('🔐 [AuthProvider] Failed to clear storage:', storageError)
        }
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('🔐 [AuthProvider] Sign-out error:', error)
        // Even if signOut fails, clear the state
        setState(prev => ({
          ...prev,
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: null
        }))
        return { error }
      }

      console.log('🔐 [AuthProvider] Sign-out successful')
      // User will be cleared via auth state change listener
      return { error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔐 [AuthProvider] Sign-out exception:', errorMessage)
      // Clear state even on exception
      setState(prev => ({
        ...prev,
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        error: null
      }))
      return { error: new AuthError(errorMessage) }
    }
  }, [])

  // Enhanced authentication initialization with timeout
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.log('🔐 [AuthProvider] Server-side rendering, skipping session check')
          return
        }

        // Prevent multiple initializations by checking current state
        if (state.initialized || state.loading === false) {
          console.log(`🔐 [AuthProvider:${providerId}] Already initialized or completed, skipping`)
          return
        }

        console.log(`🔐 [AuthProvider:${providerId}] Initializing authentication (new tab/refresh)...`)

        // Set up initialization timeout
        const timeout = setTimeout(() => {
          if (isMounted) {
            console.warn('🔐 [AuthProvider] Initialization timeout - forcing completion')
            setState(prev => ({
              ...prev,
              loading: false,
              initialized: true,
              error: 'Authentication initialization timed out'
            }))
          }
        }, INIT_TIMEOUT)

        setInitTimeout(timeout)

        // Session check with timeout and retry
        let session = null
        let error = null

        try {
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), 8000) // Increased timeout
          )

          const result = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any

          session = result.data?.session
          error = result.error
        } catch (timeoutError) {
          console.warn(`🔐 [AuthProvider:${providerId}] Session check timed out, checking localStorage fallback`)

          // Fallback: check localStorage directly for session
          try {
            const storedSession = localStorage.getItem('sb-auth-token')
            if (storedSession) {
              const parsed = JSON.parse(storedSession)
              if (parsed.access_token && parsed.expires_at > Date.now() / 1000) {
                console.log(`🔐 [AuthProvider:${providerId}] Found valid session in localStorage`)
                // Create a minimal session object
                session = {
                  user: { id: parsed.user?.id },
                  access_token: parsed.access_token
                }
              }
            }
          } catch (fallbackError) {
            console.error(`🔐 [AuthProvider:${providerId}] localStorage fallback failed:`, fallbackError)
          }
        }

        // Clear timeout if we got here successfully
        clearTimeout(timeout)
        setInitTimeout(null)

        if (!isMounted) return

        if (error && !session) {
          console.error(`🔐 [AuthProvider:${providerId}] Session error:`, error)
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
            error: null
          }))
          return
        }

        console.log(`🔐 [AuthProvider:${providerId}] Initial session:`, {
          hasSession: !!session,
          userId: session?.user?.id,
          isNewTab: !state.initialized
        })

        if (session?.user) {
          await setUserAndProfile(session.user)
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true
          }))
        }

      } catch (error) {
        console.error('🔐 [AuthProvider] Initialization error:', error)
        if (isMounted) {
          // Clear any pending timeout
          if (initTimeout) {
            clearTimeout(initTimeout)
            setInitTimeout(null)
          }

          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
            error: error instanceof Error ? error.message : 'Authentication failed'
          }))
        }
      }
    }

    initializeAuth()

    // Simple auth state change listener - let Supabase handle multi-tab sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 [AuthProvider:${providerId}] Auth state change:`, {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          isMultiTabSync: event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT'
        })

        if (!isMounted) return

        // Skip INITIAL_SESSION events to avoid duplicate processing
        if (event === 'INITIAL_SESSION') {
          console.log('🔐 [AuthProvider] Skipping INITIAL_SESSION event to avoid duplicates')
          return
        }

        // Simple: just update state based on session
        if (session?.user) {
          await setUserAndProfile(session.user)
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            profile: null,
            error: null,
            loading: false,
            initialized: true
          }))
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
      // Clean up any pending timeout
      if (initTimeout) {
        clearTimeout(initTimeout)
        setInitTimeout(null)
      }
    }
  }, [setUserAndProfile, state.initialized])

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    clearError
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
