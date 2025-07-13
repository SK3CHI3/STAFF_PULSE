-- Simplified RLS Policies for STAFF_PULSE
-- Eliminates circular dependencies and simplifies policy logic

-- First, drop the problematic helper functions
DROP FUNCTION IF EXISTS get_user_organization_id();
DROP FUNCTION IF EXISTS is_super_admin();

-- Enable RLS on profiles table (critical fix)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES (Foundation for all other policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "New users can insert their profile" ON profiles;

-- Create new simplified policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "New users can insert their profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- HR admins can view profiles in their organization
CREATE POLICY "HR admins can view org profiles" ON profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles p2 
            WHERE p2.id = auth.uid() AND p2.role IN ('hr_admin', 'super_admin')
        )
    );

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() AND p2.role = 'super_admin'
        )
    );

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view any organization" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
DROP POLICY IF EXISTS "New organizations can be created" ON organizations;

-- Create new simplified policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "New organizations can be created" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can view all organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- EMPLOYEES TABLE POLICIES (Fix circular dependencies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "HR Admins can manage employees in their organization" ON employees;

-- Create new simplified policies
CREATE POLICY "Users can view employees in their organization" ON employees
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage employees" ON employees
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- MOOD_CHECKINS TABLE POLICIES (Missing policies)
-- ============================================================================

CREATE POLICY "Users can view mood checkins in their organization" ON mood_checkins
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage mood checkins" ON mood_checkins
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all mood checkins" ON mood_checkins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- ALERTS TABLE POLICIES (Missing policies)
-- ============================================================================

CREATE POLICY "Users can view alerts in their organization" ON alerts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage alerts" ON alerts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all alerts" ON alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- ANALYTICS_DAILY TABLE POLICIES (Missing policies)
-- ============================================================================

CREATE POLICY "Users can view analytics in their organization" ON analytics_daily
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage analytics" ON analytics_daily
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all analytics" ON analytics_daily
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- AI_INSIGHTS TABLE POLICIES (Fix circular dependencies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view AI insights in their organization" ON ai_insights;
DROP POLICY IF EXISTS "HR Admins can manage AI insights in their organization" ON ai_insights;
DROP POLICY IF EXISTS "System can insert AI insights" ON ai_insights;

-- Create new simplified policies
CREATE POLICY "Users can view AI insights in their organization" ON ai_insights
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage AI insights" ON ai_insights
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all AI insights" ON ai_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- TEAMS TABLE POLICIES (Fix circular dependencies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view teams in their organization" ON teams;
DROP POLICY IF EXISTS "HR Admins can manage teams in their organization" ON teams;

-- Create new simplified policies
CREATE POLICY "Users can view teams in their organization" ON teams
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage teams" ON teams
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage all teams" ON teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- EMPLOYEE_TEAMS TABLE POLICIES (Fix circular dependencies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view employee teams in their organization" ON employee_teams;
DROP POLICY IF EXISTS "HR Admins can manage employee teams in their organization" ON employee_teams;

-- Create new simplified policies
CREATE POLICY "Users can view employee teams in their organization" ON employee_teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.id = employee_teams.employee_id 
            AND e.organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "HR admins can manage employee teams" ON employee_teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.id = employee_teams.employee_id 
            AND e.organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
            )
        )
    );

CREATE POLICY "Super admins can manage all employee teams" ON employee_teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );
