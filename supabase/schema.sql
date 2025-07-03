-- STAFF_PULSE Database Schema
-- This file contains all the database tables and relationships needed for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table (companies using StaffPulse)
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    industry VARCHAR(100),
    employee_count INTEGER DEFAULT 0,
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'team', 'growth', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'hr_admin' CHECK (role IN ('super_admin', 'hr_admin')),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (team members being monitored)
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL, -- WhatsApp number
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES employees(id),
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    anonymity_preference BOOLEAN DEFAULT false, -- Whether they prefer anonymous responses
    language_preference VARCHAR(10) DEFAULT 'en', -- For multilingual support
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood check-ins table (WhatsApp responses)
CREATE TABLE mood_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    check_in_type VARCHAR(50) DEFAULT 'scheduled' CHECK (check_in_type IN ('scheduled', 'manual', 'triggered')),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    mood_emoji VARCHAR(10), -- Store emoji representation
    response_text TEXT, -- Optional text response
    sentiment_score DECIMAL(3,2), -- AI-calculated sentiment (-1 to 1)
    sentiment_label VARCHAR(20), -- positive, neutral, negative
    keywords JSONB, -- Extracted keywords from AI analysis
    is_anonymous BOOLEAN DEFAULT false,
    response_time INTERVAL, -- How long it took to respond
    whatsapp_message_id VARCHAR(255), -- Twilio message ID for tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in schedules table (when to send WhatsApp messages)
CREATE TABLE checkin_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    day_of_week INTEGER, -- 0-6 for weekly schedules
    time_of_day TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    message_template TEXT,
    target_departments JSONB, -- Array of departments to include
    target_employees JSONB, -- Array of specific employee IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics aggregations table (for dashboard performance)
CREATE TABLE analytics_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_employees INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    average_mood DECIMAL(3,2) DEFAULT 0.00,
    positive_responses INTEGER DEFAULT 0,
    neutral_responses INTEGER DEFAULT 0,
    negative_responses INTEGER DEFAULT 0,
    burnout_alerts INTEGER DEFAULT 0,
    department_breakdown JSONB, -- Mood by department
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- Alerts table (for burnout detection and notifications)
CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('burnout_risk', 'low_mood', 'no_response', 'positive_trend')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Additional alert data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp message logs table (for tracking and debugging)
CREATE TABLE whatsapp_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('checkin_request', 'response', 'reminder', 'alert')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    message_content TEXT,
    twilio_message_id VARCHAR(255),
    status VARCHAR(50), -- sent, delivered, read, failed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights and recommendations table
CREATE TABLE ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('trend_analysis', 'risk_detection', 'recommendation', 'department_insight', 'employee_insight')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    department VARCHAR(100), -- Specific department if applicable
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE, -- Specific employee if applicable
    data_points JSONB, -- Supporting data for the insight
    action_items JSONB, -- Suggested actions for HR
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional teams table (for organizations that need team structure)
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    description TEXT,
    team_lead_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee teams junction table (optional - only if teams are used)
CREATE TABLE employee_teams (
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'lead')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (employee_id, team_id)
);

-- Create indexes for better performance
CREATE INDEX idx_organizations_email ON organizations(email);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_employees_organization_id ON employees(organization_id);
CREATE INDEX idx_employees_phone ON employees(phone);
CREATE INDEX idx_employees_department ON employees(organization_id, department);
CREATE INDEX idx_mood_checkins_organization_id ON mood_checkins(organization_id);
CREATE INDEX idx_mood_checkins_employee_id ON mood_checkins(employee_id);
CREATE INDEX idx_mood_checkins_created_at ON mood_checkins(created_at);
CREATE INDEX idx_analytics_daily_organization_date ON analytics_daily(organization_id, date);
CREATE INDEX idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX idx_alerts_unread ON alerts(organization_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ai_insights_organization_id ON ai_insights(organization_id);
CREATE INDEX idx_ai_insights_unread ON ai_insights(organization_id, is_read) WHERE is_read = false;
CREATE INDEX idx_teams_organization_id ON teams(organization_id);
CREATE INDEX idx_employee_teams_employee_id ON employee_teams(employee_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checkin_schedules_updated_at BEFORE UPDATE ON checkin_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
