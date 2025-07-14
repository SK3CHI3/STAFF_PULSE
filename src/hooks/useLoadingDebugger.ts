'use client'

import { useEffect, useRef } from 'react'

interface LoadingState {
  isLoading: boolean
  source: string
  timestamp?: number
}

/**
 * Debug hook to track loading states and detect stuck loading scenarios
 */
export function useLoadingDebugger(loadingStates: LoadingState[]) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastStatesRef = useRef<LoadingState[]>([])

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Check if any loading state is active
    const activeLoadingStates = loadingStates.filter(state => state.isLoading)
    
    if (activeLoadingStates.length > 0) {
      console.log('🔄 [LoadingDebugger] Active loading states:', activeLoadingStates.map(s => s.source))
      
      // Set a timeout to detect stuck loading states
      timeoutRef.current = setTimeout(() => {
        console.warn('🚨 [LoadingDebugger] Potential stuck loading detected!')
        console.warn('🚨 [LoadingDebugger] States that may be stuck:', activeLoadingStates)
        
        // Log additional debugging info
        console.warn('🚨 [LoadingDebugger] Current URL:', window.location.href)
        console.warn('🚨 [LoadingDebugger] User Agent:', navigator.userAgent)
        console.warn('🚨 [LoadingDebugger] Network Status:', navigator.onLine ? 'Online' : 'Offline')
        
        // Check for common issues
        if (typeof window !== 'undefined') {
          console.warn('🚨 [LoadingDebugger] Local Storage Size:', 
            JSON.stringify(localStorage).length + ' characters')
          console.warn('🚨 [LoadingDebugger] Session Storage Size:', 
            JSON.stringify(sessionStorage).length + ' characters')
        }
      }, 8000) // 8 second timeout for stuck detection
    } else {
      console.log('✅ [LoadingDebugger] All loading states cleared')
    }

    // Store current states for comparison
    lastStatesRef.current = [...loadingStates]

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [loadingStates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}

/**
 * Hook to monitor page visibility and detect when users return to stuck pages
 */
export function usePageVisibilityDebugger() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [PageVisibility] Page became visible')
        
        // Check if page has been stuck for a while
        const pageLoadTime = performance.now()
        if (pageLoadTime > 10000) { // More than 10 seconds since page load
          console.warn('🚨 [PageVisibility] Page has been loading for a long time:', pageLoadTime + 'ms')
        }
      } else {
        console.log('👁️ [PageVisibility] Page became hidden')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}

/**
 * Hook to detect and log navigation events
 */
export function useNavigationDebugger() {
  useEffect(() => {
    const startTime = performance.now()
    
    const handleBeforeUnload = () => {
      const timeOnPage = performance.now() - startTime
      console.log('🚪 [Navigation] Leaving page after:', timeOnPage + 'ms')
    }

    const handlePopState = () => {
      console.log('🔙 [Navigation] Browser back/forward navigation detected')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
}
