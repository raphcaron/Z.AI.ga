import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Bootstrap Admin Endpoint
 * Allows a logged-in user to claim admin status if NO admin exists yet.
 * This is safe because it only works when there's no admin in the system.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided.' },
        { status: 401 }
      );
    }
    
    // Verify the user is logged in
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token. Please log in.' },
        { status: 401 }
      );
    }
    
    // Use service role to check for existing admins and update
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Check if any admin already exists
    const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to check existing admins' },
        { status: 500 }
      );
    }
    
    const existingAdmin = allUsers?.find(u => u.user_metadata?.is_admin === true);
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin already exists. Admin status can only be claimed when no admin exists.' },
        { status: 403 }
      );
    }
    
    // No admin exists - claim admin status
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        is_admin: true,
      },
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to claim admin status: ' + updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin status claimed successfully! Please refresh the page.' 
    });
  } catch (error) {
    console.error('Error in claim-admin:', error);
    return NextResponse.json(
      { error: 'Failed to claim admin status' },
      { status: 500 }
    );
  }
}
