// Role-based permissions system for STAFF_PULSE

export type UserRole = 'super_admin' | 'hr_admin' | 'employee'

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'execute'
  scope: 'global' | 'organization' | 'self'
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Super Admin - Platform management only, NO message sending
  super_admin: [
    // Platform management
    { resource: 'platform', action: 'read', scope: 'global' },
    { resource: 'platform_analytics', action: 'read', scope: 'global' },
    { resource: 'system_health', action: 'read', scope: 'global' },
    { resource: 'system_logs', action: 'read', scope: 'global' },
    
    // Organization management
    { resource: 'organizations', action: 'create', scope: 'global' },
    { resource: 'organizations', action: 'read', scope: 'global' },
    { resource: 'organizations', action: 'update', scope: 'global' },
    { resource: 'organizations', action: 'delete', scope: 'global' },
    
    // View all data for monitoring (read-only)
    { resource: 'employees', action: 'read', scope: 'global' },
    { resource: 'mood_checkins', action: 'read', scope: 'global' },
    { resource: 'ai_insights', action: 'read', scope: 'global' },
    { resource: 'whatsapp_logs', action: 'read', scope: 'global' },
    
    // System alerts and monitoring
    { resource: 'system_alerts', action: 'create', scope: 'global' },
    { resource: 'system_alerts', action: 'read', scope: 'global' },
    { resource: 'system_alerts', action: 'update', scope: 'global' },
    
    // NO WhatsApp message sending permissions
    // NO schedule management permissions
    // NO employee management permissions (except read)
  ],

  // HR Admin - Organization-specific management and messaging
  hr_admin: [
    // Employee management within their organization
    { resource: 'employees', action: 'create', scope: 'organization' },
    { resource: 'employees', action: 'read', scope: 'organization' },
    { resource: 'employees', action: 'update', scope: 'organization' },
    { resource: 'employees', action: 'delete', scope: 'organization' },
    
    // WhatsApp messaging within their organization
    { resource: 'whatsapp_messages', action: 'create', scope: 'organization' },
    { resource: 'whatsapp_messages', action: 'read', scope: 'organization' },
    { resource: 'whatsapp_logs', action: 'read', scope: 'organization' },
    
    // Schedule management within their organization
    { resource: 'schedules', action: 'create', scope: 'organization' },
    { resource: 'schedules', action: 'read', scope: 'organization' },
    { resource: 'schedules', action: 'update', scope: 'organization' },
    { resource: 'schedules', action: 'delete', scope: 'organization' },
    
    // Mood data and insights for their organization
    { resource: 'mood_checkins', action: 'read', scope: 'organization' },
    { resource: 'ai_insights', action: 'read', scope: 'organization' },
    { resource: 'ai_insights', action: 'create', scope: 'organization' },
    
    // Organization settings (limited)
    { resource: 'organization_settings', action: 'read', scope: 'organization' },
    { resource: 'organization_settings', action: 'update', scope: 'organization' },
    
    // Dashboard and analytics for their organization
    { resource: 'organization_analytics', action: 'read', scope: 'organization' },
  ],

  // Employee - Very limited, mostly self-service
  employee: [
    // Self-management only
    { resource: 'profile', action: 'read', scope: 'self' },
    { resource: 'profile', action: 'update', scope: 'self' },
    { resource: 'mood_checkins', action: 'create', scope: 'self' },
    { resource: 'mood_checkins', action: 'read', scope: 'self' },
  ]
}

// Check if user has permission for a specific action
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: Permission['action'],
  scope: Permission['scope'] = 'organization'
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  
  return permissions.some(permission => 
    permission.resource === resource &&
    permission.action === action &&
    (permission.scope === scope || permission.scope === 'global')
  )
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Check if user can access super admin features
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin'
}

// Check if user can manage employees
export function canManageEmployees(role: UserRole): boolean {
  return hasPermission(role, 'employees', 'create') || hasPermission(role, 'employees', 'update')
}

// Check if user can send WhatsApp messages
export function canSendWhatsAppMessages(role: UserRole): boolean {
  return hasPermission(role, 'whatsapp_messages', 'create')
}

// Check if user can manage schedules
export function canManageSchedules(role: UserRole): boolean {
  return hasPermission(role, 'schedules', 'create') || hasPermission(role, 'schedules', 'update')
}

// Check if user can view platform analytics
export function canViewPlatformAnalytics(role: UserRole): boolean {
  return hasPermission(role, 'platform_analytics', 'read', 'global')
}

// Check if user can manage organizations
export function canManageOrganizations(role: UserRole): boolean {
  return hasPermission(role, 'organizations', 'create', 'global')
}

// Get dashboard route based on role
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin'
    case 'hr_admin':
      return '/dashboard'
    case 'employee':
      return '/employee-portal' // If we add employee portal later
    default:
      return '/dashboard'
  }
}

// Get navigation items based on role
export function getNavigationItems(role: UserRole) {
  const baseItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' }
  ]

  if (role === 'super_admin') {
    return [
      { name: 'Platform Overview', href: '/super-admin', icon: 'dashboard' },
      { name: 'Organizations', href: '/super-admin/organizations', icon: 'building' },
      { name: 'Analytics', href: '/super-admin/analytics', icon: 'chart' },
      { name: 'System Health', href: '/super-admin/system', icon: 'health' }
    ]
  }

  if (role === 'hr_admin') {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
      { name: 'Employees', href: '/dashboard/employees', icon: 'users' },
      { name: 'Check-ins', href: '/dashboard/checkins', icon: 'message' },
      { name: 'Insights', href: '/dashboard/insights', icon: 'brain' },
      { name: 'Schedules', href: '/dashboard/schedules', icon: 'calendar' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: 'chart' },
      { name: 'Settings', href: '/dashboard/settings', icon: 'settings' }
    ]
  }

  return baseItems
}

// Validate API access based on role and resource
export function validateAPIAccess(
  userRole: UserRole,
  endpoint: string,
  method: string
): { allowed: boolean; reason?: string } {
  // Super admin restrictions
  if (userRole === 'super_admin') {
    // Block super admin from sending WhatsApp messages
    if (endpoint.includes('/whatsapp/send') || endpoint.includes('/schedules')) {
      return {
        allowed: false,
        reason: 'Super admins cannot send WhatsApp messages or manage schedules. This is for HR admins only.'
      }
    }
    
    // Block super admin from employee management (except read)
    if (endpoint.includes('/employees') && ['POST', 'PUT', 'DELETE'].includes(method)) {
      return {
        allowed: false,
        reason: 'Super admins can only view employee data, not manage employees. This is for HR admins only.'
      }
    }
  }

  // HR admin restrictions
  if (userRole === 'hr_admin') {
    // Block HR admin from super admin endpoints
    if (endpoint.includes('/super-admin')) {
      return {
        allowed: false,
        reason: 'HR admins cannot access super admin features.'
      }
    }
  }

  return { allowed: true }
}

// Role descriptions for UI
export const ROLE_DESCRIPTIONS = {
  super_admin: {
    title: 'Super Administrator',
    description: 'Platform owner with full system access for monitoring and organization management',
    capabilities: [
      'View all platform analytics and metrics',
      'Manage organizations (create, suspend, activate)',
      'Monitor system health and performance',
      'View cross-organization insights',
      'Manage platform-wide settings'
    ],
    restrictions: [
      'Cannot send WhatsApp messages to employees',
      'Cannot manage individual employees',
      'Cannot create check-in schedules',
      'Read-only access to organization data'
    ]
  },
  hr_admin: {
    title: 'HR Administrator',
    description: 'Organization-level admin with full employee management and messaging capabilities',
    capabilities: [
      'Manage employees in their organization',
      'Send WhatsApp check-in messages',
      'Create and manage check-in schedules',
      'View mood data and AI insights',
      'Access organization analytics',
      'Configure organization settings'
    ],
    restrictions: [
      'Cannot access other organizations data',
      'Cannot manage platform-wide settings',
      'Cannot view system health metrics',
      'Cannot create or suspend organizations'
    ]
  },
  employee: {
    title: 'Employee',
    description: 'Individual employee with self-service capabilities',
    capabilities: [
      'Respond to mood check-ins via WhatsApp',
      'View their own mood history',
      'Update their profile information',
      'Access wellness resources'
    ],
    restrictions: [
      'Cannot access other employees data',
      'Cannot send messages to other employees',
      'Cannot access admin features',
      'Cannot view organization analytics'
    ]
  }
}
