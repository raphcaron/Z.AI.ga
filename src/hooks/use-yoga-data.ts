'use client';

import { useState, useEffect, useCallback } from 'react';

interface Session {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructor: string | null;
  category: { name: string } | null;
  theme: { name: string; color: string | null } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sessionCount?: number;
}

interface Theme {
  id: string;
  name: string;
  color: string | null;
  sessionCount?: number;
}

interface LiveSession {
  id: string;
  title: string;
  instructor: string | null;
  liveAt: string | null;
  thumbnail: string | null;
  isLive: boolean;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/themes');
      const data = await response.json();
      setThemes(data.themes || []);
      setError(null);
    } catch (err) {
      setError('Failed to load themes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return { themes, loading, error, refetch: fetchThemes };
}

export function useSessions(filters?: {
  categoryId?: string | null;
  themeId?: string | null;
  difficulty?: string | null;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchSessions = useCallback(async (newOffset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.categoryId) params.set('categoryId', filters.categoryId);
      if (filters?.themeId) params.set('themeId', filters.themeId);
      if (filters?.difficulty) params.set('difficulty', filters.difficulty);
      params.set('offset', String(newOffset));
      params.set('limit', '20');

      const response = await fetch(`/api/sessions?${params}`);
      const data = await response.json();
      
      if (newOffset === 0) {
        setSessions(data.sessions || []);
      } else {
        setSessions((prev) => [...prev, ...(data.sessions || [])]);
      }
      
      setHasMore(data.pagination?.hasMore || false);
      setOffset(newOffset);
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.categoryId, filters?.themeId, filters?.difficulty]);

  useEffect(() => {
    fetchSessions(0);
  }, [fetchSessions]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchSessions(offset + 20);
    }
  }, [loading, hasMore, offset, fetchSessions]);

  return { sessions, loading, error, hasMore, loadMore, refetch: fetchSessions };
}

export function useLiveSessions() {
  const [liveNow, setLiveNow] = useState<LiveSession[]>([]);
  const [upcoming, setUpcoming] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/live');
      const data = await response.json();
      setLiveNow(data.liveNow || []);
      setUpcoming(data.upcoming || []);
      setError(null);
    } catch (err) {
      setError('Failed to load live sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    // Poll for live session updates every 30 seconds
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  return { liveNow, upcoming, loading, error, refetch: fetchLive };
}
