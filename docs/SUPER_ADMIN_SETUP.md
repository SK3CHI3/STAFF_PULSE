# 👑 Super Admin Account Setup

## 🔐 **Super Admin Credentials**

### **Email**: `admin@staffpulse.com`
### **Password**: `SuperAdmin2024!`

---

## 🚀 **Setup Instructions**

### **Option 1: Automatic Setup (Recommended)**

1. **Go to your deployed STAFF_PULSE application**
2. **Click "Sign Up" (not Sign In)**
3. **Use these exact credentials**:
   - Email: `admin@staffpulse.com`
   - Password: `SuperAdmin2024!`
   - First Name: `Super`
   - Last Name: `Admin`

4. **The system will automatically**:
   - Detect the super admin email
   - Set your role to `super_admin`
   - Grant platform-wide access
   - Redirect you to `/super-admin` dashboard

### **Option 2: Manual Database Setup**

If automatic setup doesn't work, run this SQL in Supabase:

```sql
-- After you sign up with admin@staffpulse.com, run this:
UPDATE profiles 
SET role = 'super_admin', organization_id = NULL 
WHERE email = 'admin@staffpulse.com';
```

---

## 🎯 **What You'll Have Access To**

### **Super Admin Dashboard** (`/super-admin`)
- **Platform Overview**: Total organizations, employees, revenue
- **Growth Analytics**: User growth, revenue trends, engagement metrics
- **Organization Management**: Create, suspend, activate organizations
- **System Health**: Monitor uptime, performance, errors
- **Cross-Organization Insights**: Platform-wide analytics

### **Navigation Menu**
- 🏠 **Platform Overview** - Main dashboard with key metrics
- 🏢 **Organizations** - Manage all organizations on the platform
- 📊 **Analytics** - Comprehensive business intelligence
- 🔧 **System Health** - Real-time monitoring and alerts

---

## ⚠️ **Important: Super Admin Limitations**

### **What Super Admins CANNOT Do**
- ❌ **Send WhatsApp messages** to employees
- ❌ **Create check-in schedules** for organizations
- ❌ **Manage individual employees** (except view for monitoring)
- ❌ **Access organization-specific HR features**

### **What Super Admins CAN Do**
- ✅ **Monitor platform performance** and health
- ✅ **Manage organizations** (create, suspend, activate)
- ✅ **View all data** for monitoring purposes
- ✅ **Access system logs** and error tracking
- ✅ **Generate platform-wide analytics**

---

## 🔄 **Role Separation**

### **Super Admin** (You)
- **Purpose**: Platform management and monitoring
- **Scope**: Global platform access
- **Dashboard**: `/super-admin`

### **HR Admin** (Organization Users)
- **Purpose**: Employee wellness management
- **Scope**: Single organization access
- **Dashboard**: `/dashboard`
- **Can**: Send messages, manage employees, create schedules

---

## 🛡️ **Security Features**

### **Automatic Role Detection**
- Database trigger automatically sets super admin role
- No manual intervention needed after signup
- Secure role assignment based on email

### **Data Isolation**
- Super admin can view all data but cannot interfere with operations
- HR admins can only access their organization's data
- Complete separation between platform management and HR operations

### **Access Control**
- API endpoints validate role permissions
- Frontend components render based on role
- Database RLS policies enforce data access rules

---

## 🧪 **Testing Your Access**

### **After Login, Verify You Can**:
1. ✅ Access `/super-admin` dashboard
2. ✅ View platform statistics and metrics
3. ✅ See all organizations in the system
4. ✅ Access system health monitoring
5. ✅ View cross-organization analytics

### **Verify You CANNOT**:
1. ❌ Access `/dashboard/employees` (HR admin feature)
2. ❌ Send WhatsApp messages
3. ❌ Create check-in schedules
4. ❌ Manage individual employee data

---

## 🔧 **Troubleshooting**

### **If Super Admin Role Isn't Set**
```sql
-- Run this in Supabase SQL Editor
UPDATE profiles 
SET role = 'super_admin', organization_id = NULL 
WHERE email = 'admin@staffpulse.com';
```

### **If You Can't Access Super Admin Dashboard**
1. Check your profile role in Supabase
2. Ensure you're logged in with `admin@staffpulse.com`
3. Clear browser cache and cookies
4. Try logging out and back in

### **If You See HR Admin Features**
- This means your role wasn't set correctly
- Run the SQL command above
- Refresh the page

---

## 📊 **Sample Data Available**

Your super admin dashboard will show:
- **Organizations**: Any test organizations created
- **Employees**: Aggregated employee counts
- **Responses**: Mock mood check-in data
- **System Health**: Real-time metrics
- **Analytics**: Platform growth trends

---

## 🚀 **Next Steps After Login**

1. **Explore the Super Admin Dashboard**
   - Review platform metrics
   - Check system health
   - Explore analytics

2. **Create Test Organizations**
   - Add sample organizations
   - Test organization management features
   - Verify data isolation

3. **Monitor System Health**
   - Check error logs
   - Review performance metrics
   - Set up alerts if needed

4. **Test Role Separation**
   - Create HR admin accounts
   - Verify they can't access super admin features
   - Confirm data isolation works

---

## 🔐 **Security Reminder**

- **Change the password** after first login
- **Use strong authentication** in production
- **Monitor access logs** regularly
- **Keep credentials secure**

Your super admin account is now ready! 🎉
