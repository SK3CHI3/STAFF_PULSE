import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionManager } from '@/lib/subscription-manager'

// Get subscription status and limits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const result = await SubscriptionManager.checkSubscriptionLimits(organizationId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...result.data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create payment intent for subscription
export async function POST(request: NextRequest) {
  try {
    const { organizationId, planId, action } = await request.json()

    if (!organizationId || !planId) {
      return NextResponse.json({ 
        error: 'Organization ID and plan ID are required' 
      }, { status: 400 })
    }

    switch (action) {
      case 'create_payment_intent':
        const paymentResult = await SubscriptionManager.createPaymentIntent(organizationId, planId)
        if (!paymentResult.success) {
          return NextResponse.json({ error: paymentResult.error }, { status: 400 })
        }
        return NextResponse.json({ success: true, payment_data: paymentResult.data })

      case 'update_subscription':
        const updateResult = await SubscriptionManager.updateSubscription(organizationId, planId)
        if (!updateResult.success) {
          return NextResponse.json({ error: updateResult.error }, { status: 400 })
        }
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Update subscription to cancelled
    const result = await SubscriptionManager.updateSubscription(organizationId, 'free')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Log cancellation event
    await SubscriptionManager.logSubscriptionEvent(organizationId, 'subscription_cancelled', {
      cancelled_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
