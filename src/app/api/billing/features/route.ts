import { NextRequest, NextResponse } from 'next/server'
import { FeatureAccess } from '@/lib/feature-access'

// Get feature access for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const feature = searchParams.get('feature')
    const action = searchParams.get('action')

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID is required' 
      }, { status: 400 })
    }

    // Check specific feature access
    if (feature) {
      const result = await FeatureAccess.hasFeatureAccess(organizationId, feature as any)
      return NextResponse.json({
        success: true,
        feature,
        hasAccess: result.hasAccess,
        reason: result.reason,
        plan: result.plan
      })
    }

    // Check specific action permission
    if (action) {
      const result = await FeatureAccess.canPerformAction(organizationId, action as any)
      return NextResponse.json({
        success: true,
        action,
        canPerform: result.canPerform,
        reason: result.reason,
        plan: result.plan,
        currentCount: result.currentCount,
        limit: result.limit
      })
    }

    // Get all feature access
    const result = await FeatureAccess.getFeatureAccess(organizationId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ...result.access
    })

  } catch (error) {
    console.error('Feature access API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update feature access (for testing or admin purposes)
export async function POST(request: NextRequest) {
  try {
    const { organizationId, action, metadata } = await request.json()

    if (!organizationId || !action) {
      return NextResponse.json({ 
        error: 'Organization ID and action are required' 
      }, { status: 400 })
    }

    // This could be used for admin actions like granting temporary access
    // For now, just return the current access
    const result = await FeatureAccess.getFeatureAccess(organizationId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Feature access checked',
      ...result.access
    })

  } catch (error) {
    console.error('Feature access update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
