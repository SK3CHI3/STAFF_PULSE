import { supabaseAdmin } from '@/lib/supabase-server'

// Define feature access levels for each plan
export const PLAN_FEATURES = {
  free: {
    employees: 4,
    checkins_per_month: 2,
    ai_insights: false,
    advanced_analytics: false,
    custom_integrations: false,
    priority_support: false,
    whatsapp_checkins: true,
    basic_dashboard: true,
    email_support: true,
    data_export: false,
    team_management: false,
    department_analytics: false,
    burnout_detection: false,
    sentiment_analysis: false,
    custom_schedules: false
  },
  team: {
    employees: 15,
    checkins_per_month: -1, // unlimited
    ai_insights: true,
    advanced_analytics: true,
    custom_integrations: false,
    priority_support: true,
    whatsapp_checkins: true,
    basic_dashboard: true,
    email_support: true,
    data_export: true,
    team_management: true,
    department_analytics: true,
    burnout_detection: true,
    sentiment_analysis: true,
    custom_schedules: true
  },
  enterprise: {
    employees: 50,
    checkins_per_month: -1, // unlimited
    ai_insights: true,
    advanced_analytics: true,
    custom_integrations: true,
    priority_support: true,
    whatsapp_checkins: true,
    basic_dashboard: true,
    email_support: true,
    data_export: true,
    team_management: true,
    department_analytics: true,
    burnout_detection: true,
    sentiment_analysis: true,
    custom_schedules: true,
    dedicated_support: true,
    advanced_security: true,
    api_access: true,
    white_labeling: true
  }
} as const

export type PlanId = keyof typeof PLAN_FEATURES
export type FeatureName = keyof typeof PLAN_FEATURES.free

export class FeatureAccess {
  // Check if organization has access to a specific feature
  static async hasFeatureAccess(
    organizationId: string, 
    feature: FeatureName
  ): Promise<{ hasAccess: boolean; reason?: string; plan?: string }> {
    try {
      // Get organization subscription details
      const { data: org, error } = await supabaseAdmin
        .from('organizations')
        .select('subscription_plan, subscription_status, employee_count, grace_period_end')
        .eq('id', organizationId)
        .single()

      if (error || !org) {
        return { hasAccess: false, reason: 'Organization not found' }
      }

      const plan = org.subscription_plan as PlanId || 'free'
      const planFeatures = PLAN_FEATURES[plan]

      // Check if subscription is active
      if (org.subscription_status !== 'active') {
        // Check if in grace period
        const now = new Date()
        const gracePeriodEnd = org.grace_period_end ? new Date(org.grace_period_end) : null
        
        if (!gracePeriodEnd || now > gracePeriodEnd) {
          // Only allow basic features for inactive subscriptions
          if (!PLAN_FEATURES.free[feature]) {
            return { 
              hasAccess: false, 
              reason: 'Subscription inactive - upgrade required',
              plan 
            }
          }
        }
      }

      // Check if plan includes the feature
      const hasFeature = planFeatures[feature]
      
      if (typeof hasFeature === 'boolean') {
        return { 
          hasAccess: hasFeature, 
          reason: hasFeature ? undefined : `Feature not available in ${plan} plan`,
          plan 
        }
      }

      // For numeric features (like employee limits), check if within limits
      if (feature === 'employees') {
        const limit = planFeatures.employees
        const hasAccess = org.employee_count <= limit
        return { 
          hasAccess, 
          reason: hasAccess ? undefined : `Employee limit exceeded (${org.employee_count}/${limit})`,
          plan 
        }
      }

      return { hasAccess: true, plan }

    } catch (error) {
      console.error('Error checking feature access:', error)
      return { hasAccess: false, reason: 'Error checking access' }
    }
  }

  // Get all feature access for an organization
  static async getFeatureAccess(organizationId: string) {
    try {
      const { data: org, error } = await supabaseAdmin
        .from('organizations')
        .select('subscription_plan, subscription_status, employee_count, grace_period_end')
        .eq('id', organizationId)
        .single()

      if (error || !org) {
        return { success: false, error: 'Organization not found' }
      }

      const plan = org.subscription_plan as PlanId || 'free'
      const planFeatures = PLAN_FEATURES[plan]
      
      // Check subscription status
      const isActive = org.subscription_status === 'active'
      const now = new Date()
      const gracePeriodEnd = org.grace_period_end ? new Date(org.grace_period_end) : null
      const inGracePeriod = gracePeriodEnd && now <= gracePeriodEnd

      const access: Record<string, any> = {
        plan,
        isActive,
        inGracePeriod,
        employeeCount: org.employee_count,
        employeeLimit: planFeatures.employees,
        overEmployeeLimit: org.employee_count > planFeatures.employees,
        features: {}
      }

      // Check each feature
      for (const [featureName, featureValue] of Object.entries(planFeatures)) {
        if (typeof featureValue === 'boolean') {
          access.features[featureName] = {
            enabled: featureValue && (isActive || inGracePeriod || PLAN_FEATURES.free[featureName as FeatureName]),
            reason: featureValue ? undefined : `Not available in ${plan} plan`
          }
        } else if (typeof featureValue === 'number') {
          access.features[featureName] = {
            enabled: true,
            limit: featureValue,
            current: featureName === 'employees' ? org.employee_count : 0
          }
        }
      }

      return { success: true, access }

    } catch (error) {
      console.error('Error getting feature access:', error)
      return { success: false, error: 'Error checking access' }
    }
  }

  // Check if organization can perform an action (like adding employees)
  static async canPerformAction(
    organizationId: string, 
    action: 'add_employee' | 'schedule_checkin' | 'export_data' | 'view_insights'
  ) {
    try {
      const featureMap = {
        add_employee: 'employees' as FeatureName,
        schedule_checkin: 'whatsapp_checkins' as FeatureName,
        export_data: 'data_export' as FeatureName,
        view_insights: 'ai_insights' as FeatureName
      }

      const feature = featureMap[action]
      if (!feature) {
        return { canPerform: false, reason: 'Unknown action' }
      }

      const result = await this.hasFeatureAccess(organizationId, feature)
      
      // Special handling for employee addition
      if (action === 'add_employee' && result.hasAccess) {
        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('employee_count, subscription_plan')
          .eq('id', organizationId)
          .single()

        if (org) {
          const plan = org.subscription_plan as PlanId || 'free'
          const limit = PLAN_FEATURES[plan].employees
          
          if (org.employee_count >= limit) {
            return { 
              canPerform: false, 
              reason: `Employee limit reached (${org.employee_count}/${limit}). Upgrade your plan to add more employees.`,
              currentCount: org.employee_count,
              limit
            }
          }
        }
      }

      return { 
        canPerform: result.hasAccess, 
        reason: result.reason,
        plan: result.plan
      }

    } catch (error) {
      console.error('Error checking action permission:', error)
      return { canPerform: false, reason: 'Error checking permission' }
    }
  }
}
