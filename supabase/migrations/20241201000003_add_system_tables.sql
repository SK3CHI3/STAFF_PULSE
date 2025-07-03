-- Add missing tables for comprehensive backend functionality

-- WhatsApp logs table for message tracking
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message_body TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_sid TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    message_type TEXT DEFAULT 'checkin',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table for monitoring and debugging
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    source TEXT DEFAULT 'application',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in schedules table for automated messaging
CREATE TABLE IF NOT EXISTS checkin_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    time_of_day TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    message_template TEXT,
    target_departments JSONB DEFAULT '[]',
    target_employees JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts table for monitoring
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform analytics table for super admin insights
CREATE TABLE IF NOT EXISTS platform_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'percentage', 'average', 'sum')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    department TEXT,
    time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_employee_id ON whatsapp_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_organization_id ON whatsapp_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_direction ON whatsapp_logs(direction);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_organization_id ON system_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_checkin_schedules_organization_id ON checkin_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_is_active ON checkin_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_next_run_at ON checkin_schedules(next_run_at);

CREATE INDEX IF NOT EXISTS idx_system_alerts_organization_id ON system_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_resolved ON system_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_metric_name ON platform_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_organization_id ON platform_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_period_start ON platform_analytics(period_start);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_time_period ON platform_analytics(time_period);

-- Add RLS policies
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

-- WhatsApp logs policies
CREATE POLICY "Users can view their organization's WhatsApp logs" ON whatsapp_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can insert WhatsApp logs" ON whatsapp_logs
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

-- System logs policies (super admin only)
CREATE POLICY "Super admins can view all system logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "System can insert logs" ON system_logs
    FOR INSERT WITH CHECK (true); -- Allow system to insert logs

-- Check-in schedules policies
CREATE POLICY "Users can view their organization's schedules" ON checkin_schedules
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "HR admins can manage schedules" ON checkin_schedules
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        )
    );

-- System alerts policies
CREATE POLICY "Users can view their organization's alerts" ON system_alerts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        ) OR organization_id IS NULL
    );

CREATE POLICY "HR admins can manage alerts" ON system_alerts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
        ) OR (
            organization_id IS NULL AND EXISTS (
                SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
            )
        )
    );

-- Platform analytics policies (super admin only)
CREATE POLICY "Super admins can view all analytics" ON platform_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can manage analytics" ON platform_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_logs_updated_at BEFORE UPDATE ON whatsapp_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkin_schedules_updated_at BEFORE UPDATE ON checkin_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO checkin_schedules (organization_id, name, frequency, day_of_week, time_of_day, timezone, message_template, is_active)
SELECT 
    id,
    'Weekly Team Check-in',
    'weekly',
    1, -- Monday
    '09:00',
    'UTC',
    'Hi! How was your week? Please share your mood (1-5) and any comments.',
    true
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM checkin_schedules WHERE organization_id = organizations.id
)
LIMIT 1;

-- Add function to calculate next run time for schedules
CREATE OR REPLACE FUNCTION calculate_next_run_time(
    frequency TEXT,
    day_of_week INTEGER,
    time_of_day TIME,
    timezone TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_run TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE;
BEGIN
    current_time := NOW() AT TIME ZONE timezone;
    
    CASE frequency
        WHEN 'daily' THEN
            next_run := (current_time::DATE + INTERVAL '1 day' + time_of_day) AT TIME ZONE timezone;
        WHEN 'weekly' THEN
            next_run := (current_time::DATE + INTERVAL '1 week' - INTERVAL '1 day' * EXTRACT(DOW FROM current_time) + INTERVAL '1 day' * day_of_week + time_of_day) AT TIME ZONE timezone;
            IF next_run <= current_time THEN
                next_run := next_run + INTERVAL '1 week';
            END IF;
        WHEN 'bi-weekly' THEN
            next_run := (current_time::DATE + INTERVAL '2 weeks' - INTERVAL '1 day' * EXTRACT(DOW FROM current_time) + INTERVAL '1 day' * day_of_week + time_of_day) AT TIME ZONE timezone;
            IF next_run <= current_time THEN
                next_run := next_run + INTERVAL '2 weeks';
            END IF;
        WHEN 'monthly' THEN
            next_run := (DATE_TRUNC('month', current_time) + INTERVAL '1 month' + time_of_day) AT TIME ZONE timezone;
        ELSE
            next_run := current_time + INTERVAL '1 day';
    END CASE;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;
