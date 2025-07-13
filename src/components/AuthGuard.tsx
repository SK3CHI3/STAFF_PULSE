'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { LoadingState, ErrorState } from '@/components/LoadingState'

interface AuthGuardProps {
  children: React.ReactNode
  requireOrganization?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

/**
 * Authentication guard component
 * Handles authentication checks and redirects consistently across the app
 */
export function AuthGuard({ 
  children, 
  requireOrganization = true, 
  redirectTo = '/auth/login',
  fallback 
}: AuthGuardProps) {
  const { authState, needsAuth, needsOrganization, error } = useAuthGuard()
  const router = useRouter()

  // Handle redirects
  useEffect(() => {
    if (needsAuth) {
      console.log('🔐 [AuthGuard] Redirecting to login...')
      router.push(redirectTo)
    } else if (requireOrganization && needsOrganization) {
      console.log('🔐 [AuthGuard] Redirecting to organization setup...')
      router.push('/dashboard/organization/setup')
    }
  }, [needsAuth, needsOrganization, requireOrganization, router, redirectTo])

  // Loading state
  if (authState === 'loading') {
    return fallback || <LoadingState message="Loading..." />
  }

  // Authentication required but not authenticated
  if (needsAuth) {
    return fallback || <LoadingState message="Redirecting to login..." />
  }

  // Organization required but not set up
  if (requireOrganization && needsOrganization) {
    return fallback || <LoadingState message="Setting up your organization..." />
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />
  }

  // All checks passed - render children
  return <>{children}</>
}

/**
 * Higher-order component for protecting pages
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
