'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null
  })

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔐 [AuthProvider] Fetching profile for user:', userId)

      // First, fetch the profile data only
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('🔐 [AuthProvider] Profile fetch error:', profileError)
        return null
      }

      console.log('🔐 [AuthProvider] Profile data fetched:', {
        userId: profileData.id,
        email: profileData.email,
        hasOrganization: !!profileData.organization_id
      })

      // If profile has organization_id, fetch organization data separately
      let organizationData = null
      if (profileData.organization_id) {
        console.log('🔐 [AuthProvider] Fetching organization data...')
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, email, subscription_plan, subscription_status')
          .eq('id', profileData.organization_id)
          .single()

        if (orgError) {
          console.warn('🔐 [AuthProvider] Organization fetch warning:', orgError.message)
          // Don't fail the whole profile fetch if org fetch fails
        } else {
          organizationData = orgData
          console.log('🔐 [AuthProvider] Organization data fetched:', organizationData.name)
        }
      }

      // Combine profile and organization data
      const userProfile: UserProfile = {
        ...profileData,
        organization: organizationData
      }

      console.log('🔐 [AuthProvider] Profile fetch completed successfully')
      return userProfile
    } catch (error) {
      console.error('🔐 [AuthProvider] Profile fetch exception:', error)
      return null
    }
  }, [])

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

  // Set user and fetch profile
  const setUserAndProfile = useCallback(async (user: User | null) => {
    console.log('🔐 [AuthProvider] Setting user and profile:', { userId: user?.id })

    if (!user) {
      console.log('🔐 [AuthProvider] No user provided, clearing state')
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

    // Set user immediately
    console.log('🔐 [AuthProvider] Setting user in state')
    setState(prev => ({ ...prev, user, error: null }))

    // Fetch profile
    console.log('🔐 [AuthProvider] Starting profile fetch...')
    const profile = await fetchProfile(user.id)

    if (profile) {
      console.log('🔐 [AuthProvider] Profile fetch successful, updating state')
    } else {
      console.error('🔐 [AuthProvider] Profile fetch failed')
    }

    setState(prev => ({
      ...prev,
      profile,
      error: profile ? null : 'Failed to load profile - please check your account setup',
      loading: false,
      initialized: true
    }))
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
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('🔐 [AuthProvider] Sign-out error:', error)
        return { error }
      }

      console.log('🔐 [AuthProvider] Sign-out successful')
      // User will be cleared via auth state change listener
      return { error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔐 [AuthProvider] Sign-out exception:', errorMessage)
      return { error: new AuthError(errorMessage) }
    }
  }, [])

  // Initialize authentication
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔐 [AuthProvider] Initializing authentication...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) {
          console.log('🔐 [AuthProvider] Component unmounted during initialization')
          return
        }

        if (error) {
          console.error('🔐 [AuthProvider] Session error:', error)
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            initialized: true, 
            error: error.message 
          }))
          return
        }

        console.log('🔐 [AuthProvider] Initial session:', { 
          hasSession: !!session, 
          userId: session?.user?.id 
        })

        if (session?.user) {
          await setUserAndProfile(session.user)
        } else {
          // No session, set initialized state
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true
          }))
        }

      } catch (error) {
        console.error('🔐 [AuthProvider] Initialization error:', error)
        if (isMounted) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            initialized: true, 
            error: error instanceof Error ? error.message : 'Initialization failed' 
          }))
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [AuthProvider] Auth state change:', { 
          event, 
          hasSession: !!session, 
          userId: session?.user?.id 
        })

        if (!isMounted) {
          console.log('🔐 [AuthProvider] Component unmounted, ignoring auth change')
          return
        }

        if (session?.user) {
          await setUserAndProfile(session.user)
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            profile: null,
            error: null
          }))
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setUserAndProfile])

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
