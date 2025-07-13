-- Fix Super Admin Setup
-- This script ensures the super admin account is properly configured

-- First, check if the super admin profile exists
DO $$
DECLARE
    admin_user_id UUID;
    admin_profile_exists BOOLEAN;
BEGIN
    -- Get the user ID from auth.users for admin@staffpulse.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@staffpulse.com' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Check if profile exists
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE id = admin_user_id
        ) INTO admin_profile_exists;
        
        IF admin_profile_exists THEN
            -- Update existing profile to be super admin with no organization
            UPDATE profiles 
            SET 
                role = 'super_admin',
                organization_id = NULL,
                first_name = COALESCE(first_name, 'Super'),
                last_name = COALESCE(last_name, 'Admin'),
                email = 'admin@staffpulse.com',
                updated_at = NOW()
            WHERE id = admin_user_id;
            
            RAISE NOTICE 'Updated existing super admin profile for user ID: %', admin_user_id;
        ELSE
            -- Create new profile for super admin
            INSERT INTO profiles (
                id,
                organization_id,
                first_name,
                last_name,
                email,
                role,
                created_at,
                updated_at
            ) VALUES (
                admin_user_id,
                NULL,
                'Super',
                'Admin',
                'admin@staffpulse.com',
                'super_admin',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Created new super admin profile for user ID: %', admin_user_id;
        END IF;
        
        -- Remove any organization that might have been created for the super admin
        DELETE FROM organizations WHERE email = 'admin@staffpulse.com';
        
        RAISE NOTICE 'Super admin setup completed successfully';
    ELSE
        RAISE NOTICE 'Super admin user not found in auth.users. Please sign up with admin@staffpulse.com first.';
    END IF;
END $$;

-- Verify the setup
SELECT 
    p.id,
    p.email,
    p.role,
    p.organization_id,
    p.first_name,
    p.last_name,
    CASE 
        WHEN p.organization_id IS NULL AND p.role = 'super_admin' THEN 'CORRECT'
        ELSE 'NEEDS_FIX'
    END as status
FROM profiles p 
WHERE p.email = 'admin@staffpulse.com';
