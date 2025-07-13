'use client'

import { useState, useEffect } from 'react'

interface SuccessAlertProps {
  message: string | null
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  className?: string
}

export default function SuccessAlert({ 
  message, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 4000,
  className = '' 
}: SuccessAlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
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
  }, [message, autoClose, autoCloseDelay, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.()
    }, 300) // Wait for fade out animation
  }

  if (!message) return null

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} ${className}`}>
      <div className="glass backdrop-blur-xl bg-green-50/80 border border-green-200/50 rounded-xl p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-green-800">
              {message}
            </p>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100/50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50 transition-colors"
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
