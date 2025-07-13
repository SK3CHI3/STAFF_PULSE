import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('📝 [Signup API] Received data:', { ...data, password: '[HIDDEN]' });

    const { firstName, lastName, email, password, companyName, teamSize, userId } = data;

    // Check if this is the super admin email
    const isSuperAdmin = email === 'admin@staffpulse.com';
    console.log('📝 [Signup API] Is super admin:', isSuperAdmin);

    // Check required fields (super admin has different requirements)
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!userId) missingFields.push('userId');

    // Only require company info for non-super admin users
    if (!isSuperAdmin) {
      if (!companyName) missingFields.push('companyName');
      if (!teamSize) missingFields.push('teamSize');
    }

    if (missingFields.length > 0) {
      console.error('📝 [Signup API] Missing fields:', missingFields);
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // 1. Create user in Supabase Auth (public API)
    // This must be done via the client, so the client should create the user and then call this API route with the user id
    // For this route, we expect the user to already exist in auth.users
    // Optionally, you can use the Supabase Management API to create the user here if needed
    // For now, just proceed to org/profile creation

    const supabaseAdmin = createSupabaseAdmin();

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }

    // For non-super admin users, check organization email conflicts and create organization
    let orgData = null;
    if (!isSuperAdmin) {
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (existingOrg) {
        return NextResponse.json({ error: 'An organization with this email already exists.' }, { status: 400 });
      }

      // 2. Create organization
      console.log('📝 [Signup API] Creating organization:', companyName);
      const { data: createdOrg, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: companyName,
          email,
          employee_count: parseInt(teamSize.split('-')[0]) || 1,
          subscription_plan: 'free'
        })
        .select()
        .single();

      if (orgError) {
        console.error('📝 [Signup API] Organization creation error:', orgError);
        return NextResponse.json({ error: 'Failed to create organization: ' + orgError.message }, { status: 500 });
      }

      if (!createdOrg) {
        console.error('📝 [Signup API] No organization data returned');
        return NextResponse.json({ error: 'Failed to create organization: No data returned' }, { status: 500 });
      }

      orgData = createdOrg;
      console.log('📝 [Signup API] Organization created:', orgData.id);
    } else {
      console.log('📝 [Signup API] Skipping organization creation for super admin');
    }

    // 3. Create profile
    console.log('📝 [Signup API] Creating profile for user:', userId);
    const profileUpsertData = {
      id: userId,
      organization_id: isSuperAdmin ? null : orgData.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role: isSuperAdmin ? 'super_admin' : 'hr_admin'
    };

    console.log('📝 [Signup API] Profile data:', profileUpsertData);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([profileUpsertData], { onConflict: 'id' });

    if (profileError) {
      console.error('📝 [Signup API] Profile creation error:', profileError);
      return NextResponse.json({ error: 'Failed to create user profile: ' + profileError.message }, { status: 500 });
    }

    console.log('📝 [Signup API] Profile created successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('📝 [Signup API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 