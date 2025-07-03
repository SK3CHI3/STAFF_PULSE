-- Row Level Security (RLS) Policies for STAFF_PULSE
-- These policies ensure users can only access data from their own organization

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_teams ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin'
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "Users can update their own organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id()
    );

CREATE POLICY "Super admins can view all organizations" ON organizations
    FOR ALL USING (is_super_admin());

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization" ON profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

CREATE POLICY "HR Admins can manage profiles in their organization" ON profiles
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

CREATE POLICY "New users can insert their profile" ON profiles
    FOR INSERT WITH CHECK (
        id = auth.uid()
    );

-- Employees policies
CREATE POLICY "Users can view employees in their organization" ON employees
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage employees in their organization" ON employees
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- Mood check-ins policies
CREATE POLICY "Users can view mood check-ins in their organization" ON mood_checkins
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "System can insert mood check-ins" ON mood_checkins
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage mood check-ins in their organization" ON mood_checkins
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- Check-in schedules policies
CREATE POLICY "Users can view schedules in their organization" ON checkin_schedules
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage schedules in their organization" ON checkin_schedules
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- Analytics policies
CREATE POLICY "Users can view analytics for their organization" ON analytics_daily
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "System can manage analytics" ON analytics_daily
    FOR ALL USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

-- Alerts policies
CREATE POLICY "Users can view alerts in their organization" ON alerts
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage alerts in their organization" ON alerts
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- WhatsApp logs policies
CREATE POLICY "Users can view WhatsApp logs in their organization" ON whatsapp_logs
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "System can insert WhatsApp logs" ON whatsapp_logs
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage WhatsApp logs in their organization" ON whatsapp_logs
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- AI Insights policies
CREATE POLICY "Users can view AI insights in their organization" ON ai_insights
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "System can insert AI insights" ON ai_insights
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage AI insights in their organization" ON ai_insights
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- Teams policies (optional tables)
CREATE POLICY "Users can view teams in their organization" ON teams
    FOR SELECT USING (
        organization_id = get_user_organization_id() OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage teams in their organization" ON teams
    FOR ALL USING (
        organization_id = get_user_organization_id() AND (
            SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid()
        ) OR is_super_admin()
    );

-- Employee teams policies
CREATE POLICY "Users can view employee teams in their organization" ON employee_teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = employee_teams.employee_id
            AND e.organization_id = get_user_organization_id()
        ) OR is_super_admin()
    );

CREATE POLICY "HR Admins can manage employee teams in their organization" ON employee_teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = employee_teams.employee_id
            AND e.organization_id = get_user_organization_id()
            AND (SELECT role = 'hr_admin' FROM profiles WHERE id = auth.uid())
        ) OR is_super_admin()
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate daily analytics
CREATE OR REPLACE FUNCTION calculate_daily_analytics(org_id UUID, target_date DATE)
RETURNS VOID AS $$
DECLARE
    total_emp INTEGER;
    total_resp INTEGER;
    avg_mood DECIMAL(3,2);
    pos_resp INTEGER;
    neu_resp INTEGER;
    neg_resp INTEGER;
    resp_rate DECIMAL(5,2);
BEGIN
    -- Get total employees for the organization
    SELECT COUNT(*) INTO total_emp
    FROM employees
    WHERE organization_id = org_id AND is_active = true;

    -- Get mood check-in stats for the date
    SELECT 
        COUNT(*),
        AVG(mood_score),
        COUNT(*) FILTER (WHERE mood_score >= 4),
        COUNT(*) FILTER (WHERE mood_score = 3),
        COUNT(*) FILTER (WHERE mood_score <= 2)
    INTO total_resp, avg_mood, pos_resp, neu_resp, neg_resp
    FROM mood_checkins
    WHERE organization_id = org_id 
    AND DATE(created_at) = target_date;

    -- Calculate response rate
    resp_rate := CASE 
        WHEN total_emp > 0 THEN (total_resp::DECIMAL / total_emp) * 100
        ELSE 0
    END;

    -- Insert or update analytics
    INSERT INTO analytics_daily (
        organization_id, date, total_employees, total_responses,
        response_rate, average_mood, positive_responses,
        neutral_responses, negative_responses
    ) VALUES (
        org_id, target_date, total_emp, total_resp,
        resp_rate, avg_mood, pos_resp, neu_resp, neg_resp
    )
    ON CONFLICT (organization_id, date)
    DO UPDATE SET
        total_employees = EXCLUDED.total_employees,
        total_responses = EXCLUDED.total_responses,
        response_rate = EXCLUDED.response_rate,
        average_mood = EXCLUDED.average_mood,
        positive_responses = EXCLUDED.positive_responses,
        neutral_responses = EXCLUDED.neutral_responses,
        negative_responses = EXCLUDED.negative_responses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
