import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const { data: users, error } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, is_admin');

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, status, current_period_end');

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
  const subMap = new Map<string, { status: string; current_period_end: string | null }>();
  subscriptions?.forEach(s => subMap.set(s.user_id, { status: s.status, current_period_end: s.current_period_end }));

  const enrichedUsers = (users?.users || []).map(u => {
    const meta = u.user_metadata || {};
    const profile = profileMap.get(u.id);
    const providers = u.app_metadata?.providers || [];
    const lastProvider = providers[providers.length - 1] || 'email';
    const sub = subMap.get(u.id);

    return {
      id: u.id,
      email: u.email,
      displayName: meta.full_name || meta.name || u.email?.split('@')[0] || '',
      avatarUrl: meta.avatar_url || meta.picture || null,
      phone: u.phone || null,
      provider: lastProvider,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
      isAdmin: profile?.is_admin === true,
      subscriptionStatus: sub?.status || null,
      subscriptionEnd: sub?.current_period_end || null,
    };
  });

  enrichedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(enrichedUsers);
}

export async function PATCH(request: Request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const body = await request.json();
  const { userId, isAdmin, email } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  if (typeof isAdmin === 'boolean') {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email: email || null, is_admin: isAdmin }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const body = await request.json();
  const { userId, action, periodEnd } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
  }

  if (action === 'grant') {
    const endDate = periodEnd ? new Date(periodEnd).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', current_period_end: endDate })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_price_id: 'admin_grant',
          stripe_sub_id: `admin_${userId}`,
          status: 'active',
          current_period_end: endDate,
        }));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === 'revoke') {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action. Use "grant" or "revoke"', }, { status: 400 });
}
