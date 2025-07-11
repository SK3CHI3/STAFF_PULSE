import { supabase } from './supabase'
import { createSupabaseAdmin } from './supabase'
import { AuthError, User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

export interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
  companyName: string
  teamSize: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  user: User | null
  error: AuthError | null
}

// Sign up new user (client-side, public client only)
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // 1. Create user account (public client)
    const { data: authData, error: authError } = await supabase.auth.signUp({
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

    if (authError) {
      console.error('Signup error:', authError)
      return { user: null, error: authError }
    }

    if (!authData.user) {
      return {
        user: null,
        error: new AuthError('Failed to create user account')
      }
    }

    // Only return the user; org/profile creation is handled by the API route
    return { user: authData.user, error: null }

  } catch (error) {
    console.error('Signup catch error:', error)
    return {
      user: null,
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

// Sign in existing user
export async function signIn(data: SignInData): Promise<AuthResponse> {
  console.log('🔐 [signIn] Starting sign-in process for:', data.email)

  try {
    console.log('🔐 [signIn] Calling Supabase auth.signInWithPassword...')
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    console.log('🔐 [signIn] Supabase response:', { user: authData?.user?.id, error: error?.message })

    if (error) {
      console.error('🔐 [signIn] Sign-in error:', error)
      return { user: null, error }
    }

    // Update last login time
    if (authData.user) {
      console.log('🔐 [signIn] Updating last login time...')
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)
    }

    console.log('🔐 [signIn] Sign-in successful!')
    return { user: authData.user, error: null }

  } catch (error) {
    console.error('🔐 [signIn] Unexpected error:', error)
    return {
      user: null,
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

// Sign out user
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { 
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error') 
    }
  }
}

// Reset password
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  } catch (error) {
    return { 
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error') 
    }
  }
}

// Get current user
export async function getCurrentUser(): Promise<{ user: User | null, error: AuthError | null }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    return { 
      user: null, 
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error') 
    }
  }
}

// Get user profile with organization
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, first_name, last_name, email, role, organization:organizations(id, name, subscription_plan)`)
      .eq('id', userId)
      .single()
    return { data, error }
  } catch (error) {
    return {
      data: null,
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

// Social login with Google
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return { user: null, error }
    }

    // OAuth returns different data structure - user will be available after redirect
    return { user: null, error: null }

  } catch (error) {
    return { 
      user: null, 
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error') 
    }
  }
}

// Social login with Facebook
export async function signInWithFacebook(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return { user: null, error }
    }

    // OAuth returns different data structure - user will be available after redirect
    return { user: null, error: null }

  } catch (error) {
    return { 
      user: null, 
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error') 
    }
  }
}

// Check if user has completed onboarding
export async function checkOnboardingStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', userId)
      .single()

    if (error) {
      return { completed: false, error }
    }

    const completed = !!(data?.organization_id && data?.role)
    return { completed, error: null }

  } catch (error) {
    return { 
      completed: false, 
      error: new AuthError(error instanceof Error ? error.message : 'Unknown error') 
    }
  }
}

// React hook for authentication
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Add a method to force-refresh the profile
  const refreshProfile = async () => {
    if (loading) return // Prevent multiple simultaneous calls

    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const res = await fetch('/api/profile', {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const data = await res.json()

      if (data.profile) {
        setProfile(data.profile)
        if (typeof window !== 'undefined') {
          localStorage.setItem('profile', JSON.stringify(data.profile))
        }
      }
    } catch (error) {
      console.error('Profile refresh failed:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData } = await getUserProfile(session.user.id)
          if (isMounted) {
            setProfile(profileData)
          }
        }

        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData } = await getUserProfile(session.user.id)
          if (isMounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }

        if (isMounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // After successful login, always fetch profile
  useEffect(() => {
    if (user && !profile && !loading && initialized) {
      refreshProfile()
    }
  }, [user, profile, loading, initialized])

  return {
    user,
    profile,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
    refreshProfile,
  }
}
