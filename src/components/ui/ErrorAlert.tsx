'use client'

import { useState, useEffect } from 'react'

interface ErrorAlertProps {
  error: string | null
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  className?: string
}

export default function ErrorAlert({ 
  error, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 5000,
  className = '' 
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => {
            onClose?.()
          }, 300) // Wait for fade out animation
        }, autoCloseDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [error, autoClose, autoCloseDelay, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.()
    }, 300) // Wait for fade out animation
  }

  if (!error) return null

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} ${className}`}>
      <div className="glass backdrop-blur-xl bg-red-50/80 border border-red-200/50 rounded-xl p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">
              {error}
            </p>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
