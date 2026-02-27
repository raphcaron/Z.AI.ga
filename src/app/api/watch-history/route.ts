import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function GET() {
  console.log('📋 Watch History API called');
  
  const supabase = getServerClient();
  
  try {
    // Try to fetch watch history
    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Watch history error:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: 'The watch_history table may not exist or RLS policies are not configured. Please run the SQL below in Supabase SQL Editor.'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      data: data 
    });
  } catch (error) {
    console.error('Error in watch history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('📋 Watch History POST API called');
  
  const supabase = getServerClient();
  
  try {
    const body = await request.json();
    const { userId, sessionId, progress } = body;
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId are required' }, { status: 400 });
    }
    
    // Upsert watch history
    const { data, error } = await supabase
      .from('watch_history')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        progress: progress || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,session_id'
      })
      .select();
    
    if (error) {
      console.error('Error upserting watch history:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in watch history POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
