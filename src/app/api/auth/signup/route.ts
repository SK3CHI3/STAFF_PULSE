import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { firstName, lastName, email, password, companyName, teamSize } = data;
    if (!firstName || !lastName || !email || !password || !companyName || !teamSize) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
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

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Failed to create organization.' }, { status: 500 });
    }

    // 3. Upsert profile (must be called with userId from client)
    const { userId } = data;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }
    const profileUpsertData = {
      id: userId,
      organization_id: orgData.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role: 'hr_admin'
    };
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([profileUpsertData], { onConflict: 'id' });
    if (profileError) {
      return NextResponse.json({ error: 'Failed to create user profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 