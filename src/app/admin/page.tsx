'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  Video,
  RadioTower,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  User,
  Save,
  X,
  Shield,
  AlertCircle,
  Search,
  ArrowUp,
  ArrowDown,
  Circle,
  Upload,
  Image as ImageIcon,
  Tag,
  Palette,
  Users,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  videoUrl: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
  isLive: boolean;
  liveAt: string | null;
  isPublished: boolean;
  streamingNow: boolean;
  categoryId: string | null;
  themeId: string | null;
  category: { name: string } | null;
  theme: { name: string } | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
}

const difficultyOptions = ['beginner', 'intermediate', 'advanced'];

const videoSortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Search state
  const [videoSearch, setVideoSearch] = useState('');
  const [liveSearch, setLiveSearch] = useState('');
  const [videoSort, setVideoSort] = useState('newest');
  
  // Edit/Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isLiveSession, setIsLiveSession] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: '',
    duration: 45,
    difficulty: 'beginner',
    instructor: '',
    categoryId: '',
    themeId: '',
    isPublished: true,
    liveAt: '',
  });
  
  // Upload state
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [seeding, setSeeding] = useState(false);
  
  // Category/Theme editing state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '' });
  const [themeForm, setThemeForm] = useState({ name: '', slug: '', description: '', color: '#6366F1' });
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  // Check if user is admin (strict check - must have is_admin: true in user_metadata)
  const isAdmin = user?.user_metadata?.is_admin === true;

  useEffect(() => {
    console.log('🔐 Admin auth check - authLoading:', authLoading, 'user:', !!user);
    if (!authLoading && !user) {
      console.log('🔐 No user, redirecting to home');
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    console.log('📊 Admin fetchData called');
    setLoading(true);
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No session token available');
        setLoading(false);
        return;
      }
      
      // Fetch all admin data from API
      const response = await fetch('/api/admin/sessions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to fetch admin data:', error);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('📊 Admin data fetched - sessions:', data.sessions?.length || 0);
      
      setSessions((data.sessions || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        description: s.description,
        thumbnail: s.thumbnail,
        videoUrl: s.video_url,
        duration: s.duration,
        difficulty: s.difficulty,
        instructor: s.instructor,
        isLive: s.is_live,
        liveAt: s.live_at,
        isPublished: s.is_published,
        streamingNow: s.streaming_now || false,
        categoryId: s.category_id,
        themeId: s.theme_id,
        category: s.category,
        theme: s.theme,
        createdAt: s.created_at,
      })));
      setCategories(data.categories || []);
      setThemes(data.themes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUsers(result.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const toggleUserAdmin = async (userId: string, currentIsAdmin: boolean) => {
    console.log('=== toggleUserAdmin called ===', { userId, currentIsAdmin });
    try {
      // Get fresh session - need to await properly
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      
      console.log('Session:', session ? 'exists' : 'null');
      console.log('Access token:', session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'MISSING');
      
      if (!session?.access_token) {
        setMessage({ type: 'error', text: 'Session expired. Please log out and log back in.' });
        return;
      }
      
      console.log('Sending POST request with token...');
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          isAdmin: !currentIsAdmin,
        }),
      });
      
      const result = await response.json();
      console.log('POST response:', response.status, result);
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'User admin status updated!' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: 'Failed to update user' });
    }
  };

  // Claim admin status (only works if no admin exists)
  const claimAdmin = async () => {
    try {
      setClaimingAdmin(true);
      
      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setMessage({ type: 'error', text: 'Session error. Please try logging out and back in.' });
        return;
      }
      
      console.log('Claim admin - session:', !!session, 'user from hook:', !!user);
      
      if (!session?.access_token) {
        setMessage({ type: 'error', text: 'Please log out and log back in, then try again.' });
        return;
      }
      
      const response = await fetch('/api/users/claim-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const result = await response.json();
      console.log('Claim admin result:', result);
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message || 'Admin claimed! Refreshing...' });
        // Refresh the page to get updated user metadata
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to claim admin' });
      }
    } catch (error) {
      console.error('Error claiming admin:', error);
      setMessage({ type: 'error', text: 'Failed to claim admin' });
    } finally {
      setClaimingAdmin(false);
    }
  };

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let result = sessions.filter(s => !s.liveAt);
    
    // Filter by search
    if (videoSearch.trim()) {
      const query = videoSearch.toLowerCase().trim();
      result = result.filter((session) => 
        session.title.toLowerCase().includes(query) ||
        (session.description && session.description.toLowerCase().includes(query)) ||
        (session.instructor && session.instructor.toLowerCase().includes(query))
      );
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      switch (videoSort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
    
    return result;
  }, [sessions, videoSearch, videoSort]);

  // Filter and sort live sessions - Upcoming (including currently streaming)
  const upcomingLiveSessions = useMemo(() => {
    const now = new Date().getTime();
    let result = sessions.filter(s => s.liveAt && (new Date(s.liveAt).getTime() >= now || s.streamingNow));
    
    // Filter by search
    if (liveSearch.trim()) {
      const query = liveSearch.toLowerCase().trim();
      result = result.filter((session) => 
        session.title.toLowerCase().includes(query) ||
        (session.description && session.description.toLowerCase().includes(query)) ||
        (session.instructor && session.instructor.toLowerCase().includes(query))
      );
    }
    
    // Sort - streaming now first, then by date
    result = [...result].sort((a, b) => {
      // Streaming now sessions first
      if (a.streamingNow && !b.streamingNow) return -1;
      if (!a.streamingNow && b.streamingNow) return 1;
      
      // Then by live_at date
      const aTime = new Date(a.liveAt!).getTime();
      const bTime = new Date(b.liveAt!).getTime();
      return aTime - bTime;
    });
    
    return result;
  }, [sessions, liveSearch]);

  // Filter and sort live sessions - Past
  const pastLiveSessions = useMemo(() => {
    const now = new Date().getTime();
    let result = sessions.filter(s => s.liveAt && new Date(s.liveAt).getTime() < now && !s.streamingNow);
    
    // Filter by search
    if (liveSearch.trim()) {
      const query = liveSearch.toLowerCase().trim();
      result = result.filter((session) => 
        session.title.toLowerCase().includes(query) ||
        (session.description && session.description.toLowerCase().includes(query)) ||
        (session.instructor && session.instructor.toLowerCase().includes(query))
      );
    }
    
    // Sort by live_at date descending (most recent past first)
    result = [...result].sort((a, b) => {
      return new Date(b.liveAt!).getTime() - new Date(a.liveAt!).getTime();
    });
    
    return result;
  }, [sessions, liveSearch]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      videoUrl: '',
      duration: 45,
      difficulty: 'beginner',
      instructor: '',
      categoryId: '',
      themeId: '',
      isPublished: true,
      liveAt: '',
    });
    setIsLiveSession(false);
    setEditingSession(null);
  };

  const openCreateDialog = (live: boolean = false) => {
    resetForm();
    setIsLiveSession(live);
    setDialogOpen(true);
  };

  const openEditDialog = (session: Session) => {
    setEditingSession(session);
    setIsLiveSession(!!session.liveAt);
    setFormData({
      title: session.title,
      description: session.description || '',
      thumbnail: session.thumbnail || '',
      videoUrl: session.videoUrl || '',
      duration: session.duration,
      difficulty: session.difficulty,
      instructor: session.instructor || '',
      categoryId: session.categoryId || '',
      themeId: session.themeId || '',
      isPublished: session.isPublished,
      liveAt: session.liveAt ? format(new Date(session.liveAt), "yyyy-MM-dd'T'HH:mm") : '',
    });
    setDialogOpen(true);
  };

  // Helper function with timeout
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs);
      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  };

  const handleSave = async () => {
    if (!formData.title) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const sessionData = {
        title: formData.title,
        slug: editingSession ? editingSession.slug : `${slug}-${Date.now()}`,
        description: formData.description || null,
        thumbnail: formData.thumbnail || null,
        video_url: formData.videoUrl || null,
        duration: formData.duration,
        difficulty: formData.difficulty,
        instructor: formData.instructor || null,
        is_live: isLiveSession,
        live_at: isLiveSession && formData.liveAt ? new Date(formData.liveAt).toISOString() : null,
        is_published: formData.isPublished,
        category_id: formData.categoryId || null,
        theme_id: formData.themeId || null,
      };

      console.log('Saving session:', sessionData);

      if (editingSession) {
        // Update existing session
        const result = await withTimeout(
          supabase
            .from('sessions')
            .update(sessionData)
            .eq('id', editingSession.id)
        );

        if (result.error) {
          console.error('Supabase update error:', result.error);
          throw new Error(result.error.message || 'Failed to update session');
        }
        setMessage({ type: 'success', text: 'Session updated successfully!' });
      } else {
        // Create new session
        const result = await withTimeout(
          supabase
            .from('sessions')
            .insert(sessionData)
        );

        if (result.error) {
          console.error('Supabase insert error:', result.error);
          throw new Error(result.error.message || 'Failed to create session');
        }
        setMessage({ type: 'success', text: 'Session created successfully!' });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving session:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to save session' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (session: Session) => {
    if (!confirm(`Are you sure you want to delete "${session.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Session deleted successfully!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
      setMessage({ type: 'error', text: 'Failed to delete session' });
    }
  };

  const togglePublished = async (session: Session) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ is_published: !session.isPublished })
        .eq('id', session.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling published:', error);
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Use the session ID if editing, otherwise generate a temp ID
    const sessionId = editingSession?.id || `temp-${Date.now()}`;
    
    setUploadingThumbnail(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('sessionId', sessionId);
      
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({ ...formData, thumbnail: data.url });
        setMessage({ type: 'success', text: 'Thumbnail uploaded!' });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      setMessage({ type: 'error', text: 'Failed to upload thumbnail' });
    } finally {
      setUploadingThumbnail(false);
    }
  };
  
  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Use the session ID if editing, otherwise generate a temp ID
    const sessionId = editingSession?.id || `temp-${Date.now()}`;
    
    setUploadingVideo(true);
    setUploadProgress(0);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('sessionId', sessionId);
      
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({ ...formData, videoUrl: data.url });
        setMessage({ type: 'success', text: 'Video uploaded!' });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage({ type: 'error', text: 'Failed to upload video' });
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const toggleStreamingNow = async (session: Session) => {
    try {
      // If turning on streaming, first turn off all other sessions
      if (!session.streamingNow) {
        await supabase
          .from('sessions')
          .update({ streaming_now: false })
          .eq('streaming_now', true);
      }
      
      // Then toggle this session
      const { error } = await supabase
        .from('sessions')
        .update({ streaming_now: !session.streamingNow })
        .eq('id', session.id);

      if (error) throw error;
      setMessage({ 
        type: 'success', 
        text: !session.streamingNow 
          ? `${session.title} is now live!` 
          : 'Stream ended' 
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling streaming:', error);
      setMessage({ type: 'error', text: 'Failed to update streaming status' });
    }
  };

  // Seed data with auth token
  const handleSeedData = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      // Get the current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/seed-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to seed data');
      }
      
      setMessage({ type: 'success', text: result.message || 'Data seeded successfully!' });
      fetchData();
    } catch (error: any) {
      console.error('Error seeding data:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to seed data' });
    } finally {
      setSeeding(false);
    }
  };

  // Category handlers
  const openCategoryDialog = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '', description: '' });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) {
      setMessage({ type: 'error', text: 'Name and slug are required' });
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name,
            slug: categoryForm.slug,
            description: categoryForm.description || null,
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Category updated!' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: categoryForm.name,
            slug: categoryForm.slug,
            description: categoryForm.description || null,
          });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Category created!' });
      }
      setCategoryDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to save category' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Category deleted!' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to delete category' });
    }
  };

  // Theme handlers
  const openThemeDialog = (theme: Theme | null = null) => {
    if (theme) {
      setEditingTheme(theme);
      setThemeForm({
        name: theme.name,
        slug: theme.slug,
        description: theme.description || '',
        color: theme.color || '#6366F1',
      });
    } else {
      setEditingTheme(null);
      setThemeForm({ name: '', slug: '', description: '', color: '#6366F1' });
    }
    setThemeDialogOpen(true);
  };

  const handleSaveTheme = async () => {
    if (!themeForm.name || !themeForm.slug) {
      setMessage({ type: 'error', text: 'Name and slug are required' });
      return;
    }

    setSaving(true);
    try {
      if (editingTheme) {
        const { error } = await supabase
          .from('themes')
          .update({
            name: themeForm.name,
            slug: themeForm.slug,
            description: themeForm.description || null,
            color: themeForm.color,
          })
          .eq('id', editingTheme.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Theme updated!' });
      } else {
        const { error } = await supabase
          .from('themes')
          .insert({
            name: themeForm.name,
            slug: themeForm.slug,
            description: themeForm.description || null,
            color: themeForm.color,
          });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Theme created!' });
      }
      setThemeDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving theme:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to save theme' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheme = async (theme: Theme) => {
    if (!confirm(`Delete theme "${theme.name}"?`)) return;
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', theme.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Theme deleted!' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting theme:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to delete theme' });
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-8 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                  Manage videos, live sessions, categories, and themes
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!isAdmin && (
                  <Button 
                    onClick={claimAdmin} 
                    disabled={claimingAdmin}
                    className="gap-2 rounded-xl bg-amber-500 hover:bg-amber-600"
                  >
                    {claimingAdmin ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    Claim Admin
                  </Button>
                )}
                <Button 
                  onClick={handleSeedData} 
                  disabled={seeding}
                  variant="outline"
                  className="gap-2 rounded-xl"
                >
                  {seeding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Seed Demo Data
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {message.type === 'success' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setMessage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full mb-8 h-auto p-1.5 bg-muted">
                <TabsTrigger value="videos" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Video className="w-5 h-5" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="live" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <RadioTower className="w-5 h-5" />
                  Live Sessions
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={loadUsers}>
                  <Users className="w-5 h-5" />
                  Users
                </TabsTrigger>
              </TabsList>

              {/* Videos Tab */}
              <TabsContent value="videos">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle>Video Library</CardTitle>
                        <CardDescription>Manage your on-demand video content</CardDescription>
                      </div>
                      <Button onClick={() => openCreateDialog(false)} className="gap-2 rounded-xl">
                        <Plus className="w-4 h-4" />
                        Add Video
                      </Button>
                    </div>
                    {/* Search and Sort */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search videos..."
                          value={videoSearch}
                          onChange={(e) => setVideoSearch(e.target.value)}
                          className="pl-10 pr-10 rounded-xl"
                        />
                        {videoSearch && (
                          <button
                            onClick={() => setVideoSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sort:</span>
                        <div className="flex gap-1">
                          {videoSortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setVideoSort(option.value)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                videoSort === option.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-3 pr-4">
                          {filteredAndSortedVideos.map((session) => (
                            <div
                              key={session.id}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                            >
                              {/* Thumbnail */}
                              <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                {session.thumbnail ? (
                                  <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="w-6 h-6 text-primary/30" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                                  <Badge variant={session.isPublished ? "default" : "secondary"} className="text-xs">
                                    {session.isPublished ? 'Published' : 'Draft'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{session.duration} min</span>
                                  <span className="capitalize">{session.difficulty}</span>
                                  {session.instructor && <span>by {session.instructor}</span>}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="rounded-lg"
                                >
                                  <a href={`/session/${session.slug || session.id}`} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-4 h-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePublished(session)}
                                  className="rounded-lg"
                                >
                                  {session.isPublished ? 'Unpublish' : 'Publish'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(session)}
                                  className="rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(session)}
                                  className="rounded-lg text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {filteredAndSortedVideos.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              {videoSearch ? 'No videos match your search.' : 'No videos yet. Click "Add Video" to create your first video.'}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Live Sessions Tab */}
              <TabsContent value="live">
                <div className="space-y-6">
                  {/* Upcoming Live Sessions */}
                  <Card className="rounded-3xl">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <RadioTower className="w-5 h-5" />
                            Upcoming & Live
                          </CardTitle>
                          <CardDescription>Scheduled live streams and sessions currently streaming</CardDescription>
                        </div>
                        <Button onClick={() => openCreateDialog(true)} className="gap-2 rounded-xl">
                          <Plus className="w-4 h-4" />
                          Schedule Live
                        </Button>
                      </div>
                      {/* Search */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search live sessions..."
                            value={liveSearch}
                            onChange={(e) => setLiveSearch(e.target.value)}
                            className="pl-10 pr-10 rounded-xl"
                          />
                          {liveSearch && (
                            <button
                              onClick={() => setLiveSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcomingLiveSessions.map((session) => {
                            const liveDate = new Date(session.liveAt!);
                            
                            return (
                              <div
                                key={session.id}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                              >
                                {/* Thumbnail */}
                                <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                  {session.thumbnail ? (
                                    <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <RadioTower className="w-6 h-6 text-primary/30" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                                    {session.streamingNow ? (
                                      <Badge className="bg-red-500 text-white text-xs animate-pulse flex items-center gap-1">
                                        <Circle className="w-2 h-2 fill-current" />
                                        LIVE NOW
                                      </Badge>
                                    ) : (
                                      <Badge variant="default" className="text-xs">
                                        Upcoming
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(liveDate, 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(liveDate, 'h:mm a')}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  {/* View Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="rounded-lg"
                                  >
                                    <a href={`/session/${session.slug || session.id}`} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-4 h-4" />
                                    </a>
                                  </Button>
                                  {/* Go Live Toggle */}
                                  <Button
                                    variant={session.streamingNow ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => toggleStreamingNow(session)}
                                    className="rounded-lg gap-1"
                                  >
                                    <Circle className={`w-2 h-2 ${session.streamingNow ? 'fill-current animate-pulse' : 'fill-current'}`} />
                                    {session.streamingNow ? 'End Stream' : 'Go Live'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(session)}
                                    className="rounded-lg"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(session)}
                                    className="rounded-lg text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          {upcomingLiveSessions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              {liveSearch ? 'No upcoming sessions match your search.' : 'No upcoming live sessions. Click "Schedule Live" to create one.'}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Past Live Sessions */}
                  <Card className="rounded-3xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Past Sessions
                      </CardTitle>
                      <CardDescription>Completed live streams</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : pastLiveSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {liveSearch ? 'No past sessions match your search.' : 'No past live sessions yet.'}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pastLiveSessions.map((session) => {
                            const liveDate = new Date(session.liveAt!);
                            
                            return (
                              <div
                                key={session.id}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors opacity-75"
                              >
                                {/* Thumbnail */}
                                <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                  {session.thumbnail ? (
                                    <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover grayscale-[30%]" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <RadioTower className="w-6 h-6 text-primary/30" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                      Completed
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(liveDate, 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(liveDate, 'h:mm a')}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="rounded-lg"
                                  >
                                    <a href={`/session/${session.slug || session.id}`} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-4 h-4" />
                                    </a>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(session)}
                                    className="rounded-lg"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(session)}
                                    className="rounded-lg text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Users
                    </CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No users found. Click the tab to load users.</p>
                        <Button onClick={loadUsers} variant="outline" className="mt-4 rounded-xl">
                          Load Users
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {users.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{u.email}</div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Joined {format(new Date(u.created_at), 'MMM d, yyyy')}</span>
                                {u.last_sign_in_at && (
                                  <span>Last login {format(new Date(u.last_sign_in_at), 'MMM d, yyyy')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={u.is_admin ? "default" : "secondary"}
                                className="rounded-full"
                              >
                                {u.is_admin ? 'Admin' : 'User'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserAdmin(u.id, u.is_admin)}
                                className="rounded-lg"
                              >
                                {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit' : 'Create'} {isLiveSession ? 'Live Session' : 'Video'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingSession ? 'update' : 'create'} a {isLiveSession ? 'live session' : 'video'}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter video title"
                className="rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter video description"
                className="rounded-xl min-h-[100px]"
              />
            </div>

            {/* Thumbnail Upload */}
            <div className="grid gap-2">
              <Label>Thumbnail</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg or upload"
                    className="rounded-xl"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingThumbnail}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    className="rounded-xl gap-2"
                    disabled={uploadingThumbnail}
                  >
                    {uploadingThumbnail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    Upload
                  </Button>
                </div>
              </div>
              {formData.thumbnail && (
                <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden bg-muted">
                  <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Video Upload */}
            {!isLiveSession && (
              <div className="grid gap-2">
                <Label>Video</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://example.com/video.mp4 or upload"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingVideo}
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      className="rounded-xl gap-2"
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
                {uploadingVideo && (
                  <div className="mt-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                {formData.videoUrl && !uploadingVideo && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Video uploaded
                  </p>
                )}
              </div>
            )}

            {/* Live Date & Time */}
            {isLiveSession && (
              <div className="grid gap-2">
                <Label htmlFor="liveAt">Schedule Date & Time *</Label>
                <Input
                  id="liveAt"
                  type="datetime-local"
                  value={formData.liveAt}
                  onChange={(e) => setFormData({ ...formData, liveAt: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>

              {/* Difficulty */}
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((option) => (
                      <SelectItem key={option} value={option} className="capitalize">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Instructor */}
            <div className="grid gap-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="Instructor name"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Category</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openCategoryDialog(null)}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.categoryId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const cat = categories.find(c => c.id === formData.categoryId);
                        if (cat) openCategoryDialog(cat);
                      }}
                      className="rounded-xl flex-shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Theme */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme">Theme</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openThemeDialog(null)}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={formData.themeId}
                    onValueChange={(value) => setFormData({ ...formData, themeId: value })}
                  >
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.themeId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const th = themes.find(t => t.id === formData.themeId);
                        if (th) openThemeDialog(th);
                      }}
                      className="rounded-xl flex-shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Published */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the category details.' : 'Create a new category for your classes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryName">Name *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCategoryForm({ 
                    ...categoryForm, 
                    name,
                    slug: editingCategory ? categoryForm.slug : generateSlug(name)
                  });
                }}
                placeholder="e.g., Vinyasa"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categorySlug">Slug *</Label>
              <Input
                id="categorySlug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="e.g., vinyasa"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Brief description of this category"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theme Dialog */}
      <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingTheme ? 'Edit' : 'Add'} Theme</DialogTitle>
            <DialogDescription>
              {editingTheme ? 'Update the theme details.' : 'Create a new theme for your classes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="themeName">Name *</Label>
              <Input
                id="themeName"
                value={themeForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setThemeForm({ 
                    ...themeForm, 
                    name,
                    slug: editingTheme ? themeForm.slug : generateSlug(name)
                  });
                }}
                placeholder="e.g., Morning Energy"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="themeSlug">Slug *</Label>
              <Input
                id="themeSlug"
                value={themeForm.slug}
                onChange={(e) => setThemeForm({ ...themeForm, slug: e.target.value })}
                placeholder="e.g., morning-energy"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="themeDescription">Description</Label>
              <Textarea
                id="themeDescription"
                value={themeForm.description}
                onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                placeholder="Brief description of this theme"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="themeColor">Color</Label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  id="themeColor"
                  value={themeForm.color}
                  onChange={(e) => setThemeForm({ ...themeForm, color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={themeForm.color}
                  onChange={(e) => setThemeForm({ ...themeForm, color: e.target.value })}
                  placeholder="#6366F1"
                  className="rounded-xl flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setThemeDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveTheme} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingTheme ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
