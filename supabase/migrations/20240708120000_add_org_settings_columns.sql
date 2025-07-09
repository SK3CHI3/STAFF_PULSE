-- Add organization settings columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS check_in_frequency VARCHAR(20) DEFAULT 'weekly';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS working_hours VARCHAR(20) DEFAULT '09:00-17:00';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Nairobi';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS anonymous_allowed BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(3,2) DEFAULT 2.5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255); 