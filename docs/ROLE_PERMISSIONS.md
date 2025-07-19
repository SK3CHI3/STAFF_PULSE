# 🔐 STAFF_PULSE Role-Based Access Control

Clear definition of roles and permissions in the STAFF_PULSE platform.

## 👑 **Super Admin (Platform Owner)**

**Purpose**: Platform management and monitoring - **NOT for sending messages**

### ✅ **What Super Admins CAN Do**

#### **Platform Management**
- View platform-wide analytics and metrics
- Monitor system health and performance
- View error logs and system alerts
- Track platform growth and revenue

#### **Organization Management**
- Create new organizations
- View all organizations
- Suspend/activate organizations
- Update organization details
- View organization statistics

#### **Monitoring & Analytics**
- Cross-organization insights
- Platform performance metrics
- Revenue and subscription analytics
- Geographic distribution data
- Industry breakdown analysis

#### **System Administration**
- View system health metrics
- Monitor API performance
- Track error rates and uptime
- Manage system alerts

### ❌ **What Super Admins CANNOT Do**

#### **Employee Management**
- ❌ Cannot create/edit/delete employees
- ❌ Cannot manage individual employee data
- ✅ Can only VIEW employee data for monitoring

#### **WhatsApp Messaging**
- ❌ Cannot send WhatsApp messages to employees
- ❌ Cannot create check-in schedules
- ❌ Cannot manage messaging campaigns
- ✅ Can only VIEW message logs for monitoring

#### **Organization Operations**
- ❌ Cannot perform day-to-day HR operations
- ❌ Cannot access organization-specific features
- ❌ Cannot manage employee mood data

---

## 👥 **HR Admin (Organization Level)**

**Purpose**: Complete employee management and wellness monitoring for their organization

### ✅ **What HR Admins CAN Do**

#### **Employee Management**
- Create, edit, and deactivate employees
- Import employees via CSV
- Manage employee departments and positions
- Update employee contact information

#### **WhatsApp Messaging**
- Send check-in messages to employees
- Create and manage automated schedules
- View message delivery status
- Handle employee responses

#### **Mood Data & Insights**
- View all mood check-in responses
- Access AI-generated insights
- Generate custom reports
- Track employee wellbeing trends

#### **Organization Analytics**
- Department-level analytics
- Response rate tracking
- Mood trend analysis
- Employee engagement metrics

#### **Schedule Management**
- Create daily/weekly/monthly check-ins
- Target specific departments or employees
- Customize message templates
- Manage automated campaigns

### ❌ **What HR Admins CANNOT Do**

#### **Platform Management**
- ❌ Cannot access super admin dashboard
- ❌ Cannot view other organizations' data
- ❌ Cannot manage platform settings
- ❌ Cannot create/suspend organizations

#### **Cross-Organization Access**
- ❌ Cannot see employees from other organizations
- ❌ Cannot send messages to other organizations
- ❌ Cannot access platform-wide analytics

---

## 👤 **Employee (Individual Level)**

**Purpose**: Self-service and mood check-in responses

### ✅ **What Employees CAN Do**

#### **Self-Service**
- Respond to mood check-ins via WhatsApp
- View their own mood history
- Update their profile information
- Access wellness resources

#### **Communication**
- Receive check-in messages
- Provide mood scores and comments
- Opt-out of messaging if needed

### ❌ **What Employees CANNOT Do**

#### **Data Access**
- ❌ Cannot view other employees' data
- ❌ Cannot access organization analytics
- ❌ Cannot see department-level insights

#### **Administrative Functions**
- ❌ Cannot send messages to other employees
- ❌ Cannot access admin dashboards
- ❌ Cannot manage schedules or campaigns

---

## 🔄 **Role Assignment Process**

### **Super Admin Assignment**
- **Manual Assignment**: Only you (platform owner) have super admin access
- **Cannot be changed**: Super admin role is permanent for platform owner
- **Single User**: Only one super admin per platform

### **HR Admin Assignment**
- **Organization Creation**: When creating an organization, you assign the first HR admin
- **Additional HR Admins**: Existing HR admins can invite more HR admins to their organization
- **Role Scope**: HR admin role is scoped to specific organization only

### **Employee Assignment**
- **HR Admin Creates**: HR admins create employee accounts
- **Automatic Role**: All created employees automatically get 'employee' role
- **Organization Scoped**: Employees belong to specific organization

---

## 🛡️ **Security Implementation**

### **Database Level (RLS Policies)**
```sql
-- Super admins can view all data
CREATE POLICY "Super admins can view all" ON table_name
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- HR admins can only access their organization
CREATE POLICY "HR admins organization access" ON table_name
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role = 'hr_admin'
        )
    );
```

### **API Level Validation**
```typescript
// Check permissions before API access
export function validateAPIAccess(userRole: UserRole, endpoint: string) {
  if (userRole === 'super_admin' && endpoint.includes('/whatsapp/send')) {
    return { allowed: false, reason: 'Super admins cannot send messages' }
  }
  return { allowed: true }
}
```

### **Frontend Level Protection**
```typescript
// Hide features based on role
{profile?.role === 'hr_admin' && (
  <WhatsAppMessagingComponent />
)}

{profile?.role === 'super_admin' && (
  <PlatformAnalyticsComponent />
)}
```

---

## 📊 **Dashboard Access**

### **Super Admin Dashboard** (`/super-admin`)
- Platform overview and metrics
- Organization management
- System health monitoring
- Cross-organization analytics

### **HR Admin Dashboard** (`/dashboard`)
- Employee management
- WhatsApp messaging
- Mood data and insights
- Organization analytics
- Schedule management

### **Employee Portal** (`/employee-portal`)
- Personal mood history
- Profile management
- Wellness resources
- (Future feature)

---

## 🚨 **Important Restrictions**

### **Super Admin Limitations**
> **Super admins are for PLATFORM MANAGEMENT only**
> 
> - They monitor the platform but don't interact with employees
> - They manage organizations but don't manage individual employees
> - They view data for insights but don't send messages
> - They ensure system health but don't perform HR functions

### **Data Isolation**
> **Organizations are completely isolated**
> 
> - HR admins cannot see other organizations' data
> - Employees cannot access other organizations
> - All data is scoped to organization level
> - Cross-organization access requires super admin role

### **Message Sending Restrictions**
> **Only HR admins can send WhatsApp messages**
> 
> - Super admins cannot send messages to employees
> - Employees cannot send messages to each other
> - All messaging is controlled by HR admins
> - Message logs are available for monitoring

---

## 🔧 **Implementation Status**

- ✅ **Role-based permissions system implemented**
- ✅ **Database RLS policies configured**
- ✅ **API endpoint validation active**
- ✅ **Frontend role-based rendering**
- ✅ **Super admin dashboard (monitoring only)**
- ✅ **HR admin dashboard (full functionality)**
- ✅ **WhatsApp integration (HR admin only)**
- ✅ **Organization isolation enforced**

This role system ensures that:
1. **You (Super Admin)** can monitor and manage the platform
2. **HR Admins** can fully manage their organization's employee wellness
3. **Employees** have a simple, focused experience
4. **Data security** is maintained at all levels
5. **Clear boundaries** exist between platform management and HR operations
