// Enhanced API client with better error handling for Netlify deployment

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    console.log(`🌐 [API] Making request to: ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    console.log(`🌐 [API] Response status: ${response.status}`)
    console.log(`🌐 [API] Response headers:`, Object.fromEntries(response.headers.entries()))

    // Check if response is HTML (common issue on Netlify)
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.includes('application/json')) {
      console.error(`❌ [API] Expected JSON but got: ${contentType}`)
      const text = await response.text()
      console.error(`❌ [API] Response body: ${text.substring(0, 200)}...`)
      throw new ApiError(
        `Expected JSON response but got ${contentType}. This usually means the API route is not working correctly.`,
        response.status,
        text
      )
    }

    const data = await response.json()
    console.log(`🌐 [API] Response data:`, data)

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    console.error(`❌ [API] Error calling ${url}:`, error)
    
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle JSON parsing errors (common when receiving HTML instead of JSON)
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new ApiError(
        'Received invalid JSON response. This usually means the API route returned HTML instead of JSON.',
        500,
        error.message
      )
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown API error',
      500,
      error
    )
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, options?: RequestInit) => 
    apiCall<T>(url, { ...options, method: 'GET' }),
    
  post: <T = any>(url: string, data?: any, options?: RequestInit) => 
    apiCall<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T = any>(url: string, data?: any, options?: RequestInit) => 
    apiCall<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T = any>(url: string, options?: RequestInit) => 
    apiCall<T>(url, { ...options, method: 'DELETE' }),
}
