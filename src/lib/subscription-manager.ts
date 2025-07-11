import { supabaseAdmin } from './supabase-server'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  employees: number
  features: string[]
  period: string
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'KES',
    employees: 10,
    features: ['Basic mood tracking', 'Weekly reports', 'Email support'],
    period: 'monthly'
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2500,
    currency: 'KES',
    employees: 50,
    features: ['Advanced analytics', 'WhatsApp integration', 'Monthly reports', 'Priority support'],
    period: 'monthly'
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 5000,
    currency: 'KES',
    employees: 150,
    features: ['Department insights', 'Custom surveys', 'API access', 'Dedicated support'],
    period: 'monthly'
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 10000,
    currency: 'KES',
    employees: 500,
    features: ['AI insights', 'Custom integrations', 'Advanced reporting', 'Account manager'],
    period: 'monthly'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 25000,
    currency: 'KES',
    employees: 999999,
    features: ['Unlimited employees', 'Custom features', 'On-premise option', 'SLA guarantee'],
    period: 'monthly'
  }
}

export class SubscriptionManager {
  // Create payment intent with IntaSend
  static async createPaymentIntent(organizationId: string, planId: string) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId]
      if (!plan) {
        throw new Error('Invalid subscription plan')
      }

      // Get organization details
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('id, name, email, phone, billing_email')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        throw new Error('Organization not found')
      }

      // Create payment intent data
      const paymentData = {
        amount: plan.price,
        currency: plan.currency,
        email: org.billing_email || org.email,
        phone: org.phone,
        first_name: org.name,
        api_ref: `sub_${organizationId}_${planId}_${Date.now()}`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?payment=success`,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/intasend/webhook`
      }

      return { success: true, data: paymentData }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update subscription after successful payment
  static async updateSubscription(organizationId: string, planId: string, paymentData?: any) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId]
      if (!plan) {
        throw new Error('Invalid subscription plan')
      }

      const now = new Date()
      const nextBilling = new Date(now)
      nextBilling.setMonth(nextBilling.getMonth() + 1)

      // Update organization subscription
      const { error: updateError } = await supabaseAdmin
        .from('organizations')
        .update({
          subscription_plan: planId,
          subscription_status: 'active',
          monthly_price: plan.price,
          last_payment_date: now.toISOString(),
          next_billing_date: nextBilling.toISOString(),
          payment_failures: 0,
          grace_period_end: null
        })
        .eq('id', organizationId)

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`)
      }

      // Log subscription event
      await this.logSubscriptionEvent(organizationId, 'plan_changed', {
        new_plan: planId,
        amount: plan.price,
        currency: plan.currency,
        payment_method: paymentData?.method || 'intasend',
        intasend_ref: paymentData?.api_ref
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Handle failed payment
  static async handleFailedPayment(organizationId: string, reason?: string) {
    try {
      // Get current organization data
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('payment_failures, subscription_status')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        throw new Error('Organization not found')
      }

      const failures = (org.payment_failures || 0) + 1
      const gracePeriod = new Date()
      gracePeriod.setDate(gracePeriod.getDate() + 7) // 7 days grace period

      let newStatus = org.subscription_status
      if (failures >= 3) {
        newStatus = 'past_due'
      }

      // Update organization
      await supabaseAdmin
        .from('organizations')
        .update({
          payment_failures: failures,
          subscription_status: newStatus,
          grace_period_end: gracePeriod.toISOString()
        })
        .eq('id', organizationId)

      // Log event
      await this.logSubscriptionEvent(organizationId, 'payment_failed', {
        failure_count: failures,
        reason,
        grace_period_end: gracePeriod.toISOString()
      })

      return { success: true, failures, status: newStatus }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Check subscription status and enforce limits
  static async checkSubscriptionLimits(organizationId: string) {
    try {
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('subscription_plan, subscription_status, employee_count, grace_period_end')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        throw new Error('Organization not found')
      }

      const plan = SUBSCRIPTION_PLANS[org.subscription_plan || 'free']
      const now = new Date()
      const gracePeriodEnd = org.grace_period_end ? new Date(org.grace_period_end) : null

      // Check if in grace period
      const inGracePeriod = gracePeriodEnd && now < gracePeriodEnd

      // Check employee limits
      const overEmployeeLimit = org.employee_count > plan.employees

      // Determine access level
      const hasAccess = org.subscription_status === 'active' || inGracePeriod
      const limitedAccess = org.subscription_status === 'past_due' && inGracePeriod

      return {
        success: true,
        data: {
          hasAccess,
          limitedAccess,
          overEmployeeLimit,
          plan,
          employeeCount: org.employee_count,
          employeeLimit: plan.employees,
          status: org.subscription_status,
          gracePeriodEnd: org.grace_period_end
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Log subscription events
  static async logSubscriptionEvent(
    organizationId: string, 
    eventType: string, 
    metadata: any = {}
  ) {
    try {
      await supabaseAdmin
        .from('subscription_events')
        .insert({
          organization_id: organizationId,
          event_type: eventType,
          old_plan: metadata.old_plan,
          new_plan: metadata.new_plan,
          amount: metadata.amount,
          currency: metadata.currency || 'KES',
          payment_method: metadata.payment_method,
          intasend_ref: metadata.intasend_ref,
          metadata
        })

      return { success: true }
    } catch (error: any) {
      console.error('Failed to log subscription event:', error)
      return { success: false, error: error.message }
    }
  }
}
