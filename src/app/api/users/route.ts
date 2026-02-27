import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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
    
    // Create client with the user's token
    const supabase = createClient(
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
    
    // Verify the user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }
    
    const isAdmin = user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }
    
    // Fetch from profiles table
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, created_at, last_sign_in_at, is_admin')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      // If profiles table doesn't exist, return empty array with hint
      if (error.code === '42P01') {
        return NextResponse.json({
          users: [],
          hint: 'Create a profiles table that mirrors auth.users data'
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isAdmin: newIsAdmin } = body;
    
    if (!userId || typeof newIsAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'userId and isAdmin are required' },
        { status: 400 }
      );
    }
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided.' },
        { status: 401 }
      );
    }
    
    // Create client with the user's token
    const supabase = createClient(
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
    
    // Verify the user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }
    
    const isAdmin = user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }
    
    // Update the user's admin status in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newIsAdmin })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in users PATCH:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
