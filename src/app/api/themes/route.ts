import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  console.log('🔍 Themes API called - using Supabase');
  try {
    const { data: themes, error } = await supabase
      .from('themes')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching themes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch themes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ themes: themes || [] });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}
