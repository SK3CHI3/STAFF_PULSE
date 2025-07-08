import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const body = await req.json();
  const { organization_id, department, scheduled_at, created_by, message, recurrence, day_of_week } = body;

  if (!organization_id || !scheduled_at || !created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('scheduled_checkins')
    .insert([
      {
        organization_id,
        department: department || null,
        scheduled_at,
        created_by,
        message: message || null,
        status: 'pending',
        recurrence: recurrence || 'once',
        day_of_week: recurrence === 'weekly' ? day_of_week : null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, scheduled_checkin: data });
} 