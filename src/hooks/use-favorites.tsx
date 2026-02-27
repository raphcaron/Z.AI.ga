'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';

interface FavoritesContextType {
  favorites: Set<string>;
  loading: boolean;
  toggleFavorite: (sessionId: string) => Promise<boolean>;
  isFavorite: (sessionId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Use a ref to track favorites to avoid stale closure issues
  const favoritesRef = useRef<Set<string>>(new Set());

  // Load favorites from Supabase when user changes
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      favoritesRef.current = new Set();
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('session_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading favorites:', error);
        setFavorites(new Set());
        favoritesRef.current = new Set();
      } else {
        const favoriteIds = new Set(data?.map((f: { session_id: string }) => f.session_id) || []);
        setFavorites(favoriteIds);
        favoritesRef.current = favoriteIds;
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites(new Set());
      favoritesRef.current = new Set();
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    // Use ref to get current state (avoids stale closure)
    const isCurrentlyFavorite = favoritesRef.current.has(sessionId);

    try {
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('session_id', sessionId);

        if (error) {
          console.error('Error removing favorite:', error);
          return true;
        }

        // Update local state
        const newSet = new Set(favoritesRef.current);
        newSet.delete(sessionId);
        setFavorites(newSet);
        favoritesRef.current = newSet;

        return false;
      } else {
        // Add to favorites (just user_id and session_id)
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            session_id: sessionId,
          });

        if (error) {
          // Duplicate key = already favorited
          if (error.code === '23505') {
            const newSet = new Set(favoritesRef.current);
            newSet.add(sessionId);
            setFavorites(newSet);
            favoritesRef.current = newSet;
            return true;
          }
          console.error('Error adding favorite:', error);
          return false;
        }

        // Update local state
        const newSet = new Set(favoritesRef.current);
        newSet.add(sessionId);
        setFavorites(newSet);
        favoritesRef.current = newSet;

        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return isCurrentlyFavorite;
    }
  }, [user]);

  const isFavorite = useCallback((sessionId: string) => {
    return favoritesRef.current.has(sessionId);
  }, []);

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      loading, 
      toggleFavorite, 
      isFavorite,
      refreshFavorites: loadFavorites 
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
