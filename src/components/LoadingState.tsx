interface LoadingStateProps {
  message?: string
  showRetry?: boolean
  onRetry?: () => void
}

export function LoadingState({ 
  message = "Loading...", 
  showRetry = false, 
  onRetry 
}: LoadingStateProps) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export function ErrorState({ 
  message = "Something went wrong", 
  onRetry 
}: { 
  message?: string
  onRetry?: () => void 
}) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 text-lg font-medium">{message}</div>
        <p className="text-gray-600 mt-2">Please try again or contact support.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
        <button
          className="mt-2 ml-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.clear()
              window.location.href = '/auth/login'
            }
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
