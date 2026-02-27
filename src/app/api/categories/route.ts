import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function GET() {
  console.log('🔍 Categories API called - using Supabase');
  try {
    const supabase = getServerClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Categories fetched:', categories?.length || 0);
    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
