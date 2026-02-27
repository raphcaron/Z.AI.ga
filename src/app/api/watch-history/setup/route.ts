import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

// This endpoint provides SQL to set up the watch_history table properly
export async function GET() {
  const sql = `
-- Watch History Table Setup for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create the watch_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_updated_at ON watch_history(updated_at DESC);

-- 3. Enable RLS
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Allow users to view their own watch history
CREATE POLICY "Users can view own watch history" ON watch_history
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own watch history
CREATE POLICY "Users can insert own watch history" ON watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own watch history
CREATE POLICY "Users can update own watch history" ON watch_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own watch history
CREATE POLICY "Users can delete own watch history" ON watch_history
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_watch_history_updated_at
  BEFORE UPDATE ON watch_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

  return NextResponse.json({ 
    message: 'Run this SQL in your Supabase SQL Editor to set up the watch_history table',
    sql: sql.trim()
  });
}

// Seed some test watch history
export async function POST(request: Request) {
  console.log('📋 Seeding watch history');
  
  const supabase = getServerClient();
  
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    // Get some sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .is('live_at', null)
      .limit(5);
    
    if (sessionsError || !sessions?.length) {
      return NextResponse.json({ error: 'No sessions found to create watch history' }, { status: 400 });
    }
    
    // Create watch history entries
    const entries = sessions.map((session, index) => ({
      user_id: userId,
      session_id: session.id,
      progress: Math.floor(Math.random() * 100),
      updated_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString() // Spread over past days
    }));
    
    const { data, error } = await supabase
      .from('watch_history')
      .upsert(entries, {
        onConflict: 'user_id,session_id'
      })
      .select();
    
    if (error) {
      console.error('Error seeding watch history:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        hint: 'Make sure the watch_history table exists with proper structure. Call GET /api/watch-history/setup for SQL.'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Created ${data?.length || 0} watch history entries`,
      data 
    });
  } catch (error) {
    console.error('Error seeding watch history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
