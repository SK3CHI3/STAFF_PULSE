-- Add IntaSend specific fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS intasend_invoice_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS intasend_api_ref TEXT,
ADD COLUMN IF NOT EXISTS failed_reason TEXT,
ADD COLUMN IF NOT EXISTS failed_code TEXT;

-- Create index for IntaSend invoice ID lookups
CREATE INDEX IF NOT EXISTS idx_invoices_intasend_invoice_id ON invoices(intasend_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_intasend_api_ref ON invoices(intasend_api_ref);

-- Add subscription management fields to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_failures INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE;

-- Create subscription events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('payment_success', 'payment_failed', 'plan_changed', 'subscription_cancelled', 'subscription_reactivated')),
    old_plan TEXT,
    new_plan TEXT,
    amount NUMERIC(10,2),
    currency TEXT DEFAULT 'KES',
    payment_method TEXT,
    intasend_ref TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscription events
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_date ON subscription_events(created_at);

-- Enable RLS for subscription events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for subscription events
CREATE POLICY "Org members can view their subscription events" ON subscription_events
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "System can manage subscription events" ON subscription_events
    FOR ALL USING (true);
