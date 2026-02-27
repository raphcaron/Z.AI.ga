import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client with the user's auth token from headers
export async function createAuthenticatedClient(authToken?: string): Promise<{ 
  client: SupabaseClient; 
  userId: string | null; 
  error: string | null 
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If auth token is provided directly, use it
  if (authToken) {
    const client = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });
    
    const { data: { user }, error: userError } = await client.auth.getUser(authToken);
    
    if (userError || !user) {
      return { client, userId: null, error: 'Invalid token. Please log in again.' };
    }
    
    return { client, userId: user.id, error: null };
  }
  
  // Otherwise, try to get session from cookies
  try {
    const cookieStore = await cookies();
    
    // Get the session token from cookies (Supabase stores it as 'sb-<project-ref>-auth-token')
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
    const supabaseCookieName = `sb-${projectRef}-auth-token`;
    const sessionCookie = cookieStore.get(supabaseCookieName);
    
    if (!sessionCookie?.value) {
      return { 
        client: createClient(supabaseUrl || '', supabaseAnonKey || ''), 
        userId: null, 
        error: 'No session found. Please log in.' 
      };
    }
    
    // Parse the session from cookie
    let accessToken = '';
    try {
      const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      accessToken = decoded?.access_token || decoded?.[0] || '';
    } catch {
      accessToken = sessionCookie.value;
    }
    
    if (!accessToken) {
      return { 
        client: createClient(supabaseUrl || '', supabaseAnonKey || ''), 
        userId: null, 
        error: 'Could not parse session token.' 
      };
    }
    
    // Create client with auth token
    const client = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });
    
    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    
    if (userError || !user) {
      return { client, userId: null, error: 'Invalid session. Please log in again.' };
    }
    
    return { client, userId: user.id, error: null };
  } catch (error) {
    console.error('Error creating authenticated client:', error);
    return { 
      client: createClient(supabaseUrl || '', supabaseAnonKey || ''), 
      userId: null, 
      error: 'Failed to authenticate. Please try again.' 
    };
  }
}
