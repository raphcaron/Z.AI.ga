'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isSubscribed: boolean;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;
        
        console.log('Session loaded:', session ? 'User found' : 'No user');
        setUser(session?.user ?? null);
        
        // Check subscription if user exists
        if (session?.user) {
          try {
            const { data } = await supabase
              .from('subscriptions')
              .select('status')
              .eq('user_id', session.user.id)
              .eq('status', 'active')
              .single();
            if (mounted) setIsSubscribed(!!data);
          } catch {
            if (mounted) setIsSubscribed(false);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', _event, session ? 'User present' : 'No user');
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();
          if (mounted) setIsSubscribed(!!data);
        } catch {
          if (mounted) setIsSubscribed(false);
        }
      } else {
        if (mounted) setIsSubscribed(false);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in...');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) console.error('Sign in error:', error);
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('Signing up...');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    if (error) console.error('Sign up error:', error);
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setIsSubscribed(false);
  };

  const refreshSubscription = async () => {
    if (!user) {
      setIsSubscribed(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      setIsSubscribed(!!data);
    } catch {
      setIsSubscribed(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isSubscribed, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
