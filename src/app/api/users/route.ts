import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to get admin client
function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Helper to check if user is admin (checks database directly)
async function checkIsAdmin(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
  return user?.user_metadata?.is_admin === true;
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No authorization token provided.' }, { status: 401 });
    }
    
    // Verify user is logged in
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }
    
    // Check admin status directly in database
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }
    
    const isAdmin = await checkIsAdmin(supabaseAdmin, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }
    
    // List users
    const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json({ error: 'Failed to fetch users: ' + listError.message }, { status: 500 });
    }
    
    const users = (authUsers || []).map(u => ({
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      is_admin: u.user_metadata?.is_admin === true,
    }));
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Update user admin status (using POST instead of PATCH due to gateway restrictions)
export async function POST(request: NextRequest) {
  console.log('=== POST /api/users (update admin) ===');
  try {
    const body = await request.json();
    const { userId, isAdmin: newIsAdmin } = body;
    
    console.log('Request body:', { userId, newIsAdmin });
    
    if (!userId || typeof newIsAdmin !== 'boolean') {
      return NextResponse.json({ error: 'userId and isAdmin are required' }, { status: 400 });
    }
    
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('Token present:', !!token, 'Token length:', token?.length || 0);
    
    if (!token) {
      return NextResponse.json({ error: 'No authorization token provided.' }, { status: 401 });
    }
    
    // Verify user is logged in
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    console.log('Auth result - user:', user?.email || 'null', 'error:', userError?.message || 'none');
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }
    
    // Check admin status directly in database (not JWT!)
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }
    
    const isAdmin = await checkIsAdmin(supabaseAdmin, user.id);
    console.log('Admin check for', user.email, ':', isAdmin);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }
    
    // Get target user and update
    const { data: { user: targetUser }, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...targetUser.user_metadata,
        is_admin: newIsAdmin,
      },
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user: ' + updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: `${targetUser.email} admin status updated to ${newIsAdmin}` });
  } catch (error) {
    console.error('Error in users PATCH:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
