-- Fix RLS policy for profiles table to allow users to view their own profile
-- This fixes the circular dependency issue where users can't fetch their profile
-- because the RLS policy requires organization_id but the profile fetch is needed to get organization_id

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create policy to allow users to view their own profile regardless of organization status
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (
        id = auth.uid()
    );

-- This policy should be evaluated before the organization-based policy
-- Supabase evaluates policies with OR logic, so if any policy allows access, the query succeeds
