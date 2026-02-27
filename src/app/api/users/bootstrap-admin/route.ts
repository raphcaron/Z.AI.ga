import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Bootstrap Admin Endpoint (No Auth Required)
 * Creates the first admin user. Only works when NO admin exists.
 * Pass email in body to specify which user should become admin.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Use service role 
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
        { error: `An admin already exists (${existingAdmin.email}). This endpoint only works when no admin exists.` },
        { status: 403 }
      );
    }
    
    // Find the user by email
    const targetUser = allUsers?.find(u => u.email === email);
    
    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }
    
    // No admin exists - make this user admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
      user_metadata: {
        ...targetUser.user_metadata,
        is_admin: true,
      },
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to set admin: ' + updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${email} is now an admin! Please log out and log back in for changes to take effect.` 
    });
  } catch (error) {
    console.error('Error in bootstrap-admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
