import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Check if the current user is an admin
 * Checks database directly, not JWT
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ isAdmin: false });
    }
    
    // Verify user is logged in
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ isAdmin: false });
    }
    
    // Check JWT metadata first (fast)
    if (user.user_metadata?.is_admin === true) {
      return NextResponse.json({ isAdmin: true });
    }
    
    // Fallback: check database directly using service role
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return NextResponse.json({ isAdmin: false });
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: { user: dbUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    const isAdmin = dbUser?.user_metadata?.is_admin === true;
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
