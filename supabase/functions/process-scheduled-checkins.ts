import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (_req) => {
  const now = new Date();
  const nowISO = now.toISOString();
  const dayOfWeek = now.getDay();

  // 1. Find all pending check-ins due now (once or weekly)
  const { data: checkins, error } = await supabase
    .from('scheduled_checkins')
    .select('*')
    .or(`and(status.eq.pending,recurrence.eq.once,scheduled_at.lte.${nowISO}),and(status.eq.pending,recurrence.eq.weekly,day_of_week.eq.${dayOfWeek},scheduled_at.lte.${nowISO})`);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!checkins || checkins.length === 0) {
    return new Response(JSON.stringify({ message: 'No check-ins to process.' }), { status: 200 });
  }

  // 2. For each, (placeholder) log and mark as sent
  for (const checkin of checkins) {
    // TODO: Send WhatsApp or notification here
    console.log(`Would send check-in to org ${checkin.organization_id}, dept ${checkin.department}, scheduled at ${checkin.scheduled_at}`);
    // Mark as sent
    await supabase
      .from('scheduled_checkins')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', checkin.id);
  }

  return new Response(JSON.stringify({ processed: checkins.length }), { status: 200 });
}); 