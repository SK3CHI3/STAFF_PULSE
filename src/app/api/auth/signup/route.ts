import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('📝 [Signup API] Received data:', { ...data, password: '[HIDDEN]' });

    const { firstName, lastName, email, password, companyName, teamSize, userId } = data;

    // Check required fields
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!companyName) missingFields.push('companyName');
    if (!teamSize) missingFields.push('teamSize');
    if (!userId) missingFields.push('userId');

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

    // Check if email already exists in profiles or organizations
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }
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
    const { data: orgData, error: orgError } = await supabaseAdmin
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

    if (!orgData) {
      console.error('📝 [Signup API] No organization data returned');
      return NextResponse.json({ error: 'Failed to create organization: No data returned' }, { status: 500 });
    }

    console.log('📝 [Signup API] Organization created:', orgData.id);

    // 3. Create profile
    console.log('📝 [Signup API] Creating profile for user:', userId);
    const profileUpsertData = {
      id: userId,
      organization_id: orgData.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role: 'hr_admin'
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