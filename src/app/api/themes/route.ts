import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function GET() {
  console.log('🔍 Themes API called - using Supabase');
  try {
    const supabase = getServerClient();
    
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
