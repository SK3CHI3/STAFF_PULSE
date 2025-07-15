-- Migration to standardize subscription plans to 3-tier system
-- This migration updates existing organizations to use the standardized plan names

-- Update existing organizations with old plan names to new standardized plans
UPDATE organizations 
SET subscription_plan = CASE 
    WHEN subscription_plan = 'starter' THEN 'free'
    WHEN subscription_plan = 'growth' THEN 'enterprise'
    ELSE subscription_plan
END
WHERE subscription_plan IN ('starter', 'growth');

-- Update the constraint to only allow the 3 standardized plans
ALTER TABLE organizations 
DROP CONSTRAINT IF EXISTS organizations_subscription_plan_check;

ALTER TABLE organizations 
ADD CONSTRAINT organizations_subscription_plan_check 
CHECK (subscription_plan IN ('free', 'team', 'enterprise'));

-- Log the migration only if the subscription_events table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_events') THEN
        INSERT INTO subscription_events (organization_id, event_type, old_plan, new_plan, metadata)
        SELECT
            id,
            'plan_changed',
            CASE
                WHEN subscription_plan = 'free' AND monthly_price = 0 THEN 'starter'
                WHEN subscription_plan = 'enterprise' AND monthly_price > 5000 THEN 'growth'
                ELSE subscription_plan
            END,
            subscription_plan,
            jsonb_build_object('migration', 'standardize_plans', 'date', NOW())
        FROM organizations
        WHERE subscription_plan IN ('free', 'team', 'enterprise')
        AND created_at < NOW() - INTERVAL '1 minute'; -- Only log for existing orgs, not new ones
    END IF;
END
$$;
