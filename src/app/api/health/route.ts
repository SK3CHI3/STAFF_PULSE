import { NextResponse } from 'next/server'

// Simple health check endpoint to test API routing
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      message: 'API is working correctly'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
