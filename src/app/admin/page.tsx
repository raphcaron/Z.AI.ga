'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Loader2, Video, RadioTower, Plus, Pencil, Trash2, Shield,
  Clock, User, Save, X, Search, Globe, Eye, Upload, Image as ImageIcon,
  Calendar, Circle, AlertCircle, Users, ShieldCheck, Crown, Mail, Phone,
} from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  video_url: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
  is_live: boolean;
  live_at: string | null;
  is_published: boolean;
  streaming_now: boolean;
  category_id: string | null;
  theme_id: string | null;
  category: { name: string } | null;
  theme: { name: string } | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Theme {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoSearch, setVideoSearch] = useState('');
  const thumbnailXhrRef = useRef<XMLHttpRequest | null>(null);
  const videoXhrRef = useRef<XMLHttpRequest | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', thumbnail: '', videoUrl: '',
    duration: 45, difficulty: 'beginner', instructor: '',
    categoryId: '', themeId: '', isPublished: true, liveAt: '',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, catsRes, themesRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*, category:categories(name), theme:themes(name, color)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('themes').select('*').order('name'),
      ]);
      if (sessionsRes.data) setSessions(sessionsRes.data as Session[]);
      if (catsRes.data) setCategories(catsRes.data);
      if (themesRes.data) setThemes(themesRes.data);

      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) setAdminUsers(usersData);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-open edit dialog from URL param
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && sessions.length > 0 && !dialogOpen) {
      const session = sessions.find(s => s.id === editId);
      if (session) {
        openEditDialog(session);
        router.replace('/admin', { scroll: false });
      }
    }
  }, [searchParams, sessions]);

  const resetForm = () => {
    setFormData({
      title: '', description: '', thumbnail: '', videoUrl: '',
      duration: 45, difficulty: 'beginner', instructor: '',
      categoryId: '', themeId: '', isPublished: true, liveAt: '',
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
    setIsLiveSession(!!session.live_at);
    setFormData({
      title: session.title,
      description: session.description || '',
      thumbnail: session.thumbnail || '',
      videoUrl: session.video_url || '',
      duration: session.duration,
      difficulty: session.difficulty,
      instructor: session.instructor || '',
      categoryId: session.category_id || '',
      themeId: session.theme_id || '',
      isPublished: session.is_published,
      liveAt: session.live_at ? format(new Date(session.live_at), "yyyy-MM-dd'T'HH:mm") : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }
    setSaving(true);
    const slug = editingSession ? editingSession.slug : generateSlug(formData.title);

    const data = {
      title: formData.title,
      slug,
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

    try {
      if (editingSession) {
        const { error } = await supabase.from('sessions').update(data).eq('id', editingSession.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Session updated!' });
      } else {
        const { error } = await supabase.from('sessions').insert(data);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Session created!' });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving session:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (session: Session) => {
    if (!confirm(`Delete "${session.title}"?`)) return;
    try {
      await supabase.from('sessions').delete().eq('id', session.id);
      setSessions(prev => prev.filter(s => s.id !== session.id));
      setMessage({ type: 'success', text: 'Session deleted!' });
    } catch (err) {
      console.error('Error deleting:', err);
      setMessage({ type: 'error', text: 'Failed to delete session' });
    }
  };

  const togglePublished = async (session: Session) => {
    try {
      await supabase.from('sessions').update({ is_published: !session.is_published }).eq('id', session.id);
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, is_published: !s.is_published } : s));
    } catch (err) {
      console.error('Error toggling:', err);
    }
  };

  const toggleStreaming = async (session: Session) => {
    const newState = !session.streaming_now;
    try {
      if (newState) {
        await supabase.from('sessions').update({ streaming_now: false }).eq('streaming_now', true);
      }
      await supabase.from('sessions').update({ streaming_now: newState }).eq('id', session.id);
      loadData();
      setMessage({ type: 'success', text: newState ? `${session.title} is now live!` : 'Stream ended' });
    } catch (err) {
      console.error('Error toggling streaming:', err);
      setMessage({ type: 'error', text: 'Failed to update streaming status' });
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG, JPEG, and WebP files are allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File must be under 5MB' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const slug = generateSlug(formData.title) || 'untitled';
    const body = new FormData();
    body.append('file', file);
    body.append('slug', slug);
    body.append('type', 'thumbnail');

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      thumbnailXhrRef.current = xhr;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setFormData(prev => ({ ...prev, thumbnail: data.url }));
            setMessage({ type: 'success', text: 'Thumbnail uploaded!' });
          } else {
            setMessage({ type: 'error', text: data.error || 'Upload failed' });
          }
        } catch {
          setMessage({ type: 'error', text: 'Upload failed' });
        }
        setUploading(false);
        setUploadProgress(0);
        thumbnailXhrRef.current = null;
        resolve();
      });

      xhr.addEventListener('error', () => {
        setMessage({ type: 'error', text: 'Upload failed' });
        setUploading(false);
        setUploadProgress(0);
        thumbnailXhrRef.current = null;
        resolve();
      });

      xhr.addEventListener('abort', () => {
        setUploading(false);
        setUploadProgress(0);
        thumbnailXhrRef.current = null;
        resolve();
      });

      xhr.open('POST', '/api/upload');
      xhr.send(body);
    });
  };

  const handleVideoUpload = async (file: File) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only MP4, WebM, and MOV files are allowed' });
      return;
    }

    if (file.size > 3 * 1024 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Video must be under 3GB' });
      return;
    }

    setUploadingVideo(true);
    setVideoUploadProgress(0);

    const slug = generateSlug(formData.title) || 'untitled';
    const body = new FormData();
    body.append('file', file);
    body.append('slug', slug);
    body.append('type', 'video');

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      videoXhrRef.current = xhr;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setVideoUploadProgress(pct);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setFormData(prev => ({ ...prev, videoUrl: data.url }));
            setMessage({ type: 'success', text: 'Video uploaded!' });
          } else {
            setMessage({ type: 'error', text: data.error || 'Upload failed' });
          }
        } catch {
          setMessage({ type: 'error', text: 'Upload failed' });
        }
        setUploadingVideo(false);
        setVideoUploadProgress(0);
        videoXhrRef.current = null;
        resolve();
      });

      xhr.addEventListener('error', () => {
        setMessage({ type: 'error', text: 'Video upload failed' });
        setUploadingVideo(false);
        setVideoUploadProgress(0);
        videoXhrRef.current = null;
        resolve();
      });

      xhr.addEventListener('abort', () => {
        setUploadingVideo(false);
        setVideoUploadProgress(0);
        videoXhrRef.current = null;
        resolve();
      });

      xhr.open('POST', '/api/upload');
      xhr.send(body);
    });
  };

  const grantSubscription = async (userId: string, periodEnd: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'grant', periodEnd }),
      });
      if (res.ok) {
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: 'active', subscriptionEnd: new Date(periodEnd).toISOString() } : u));
        setMessage({ type: 'success', text: 'Subscription granted!' });
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, subscriptionStatus: 'active', subscriptionEnd: new Date(periodEnd).toISOString() } : null);
        }
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to grant subscription' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to grant subscription' });
    }
  };

  const revokeSubscription = async (userId: string) => {
    if (!confirm('Revoke this user\'s subscription?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'revoke' }),
      });
      if (res.ok) {
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: 'canceled', subscriptionEnd: null } : u));
        setMessage({ type: 'success', text: 'Subscription revoked' });
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, subscriptionStatus: 'canceled', subscriptionEnd: null } : null);
        }
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to revoke subscription' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke subscription' });
    }
  };

  const openUserDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  const filteredVideos = sessions.filter(s => !s.live_at).filter(s =>
    !videoSearch || s.title.toLowerCase().includes(videoSearch.toLowerCase())
  );

  const upcomingLive = sessions.filter(s => s.live_at && (new Date(s.live_at) >= new Date() || s.streaming_now))
    .sort((a, b) => a.streaming_now ? -1 : b.streaming_now ? 1 : new Date(a.live_at!).getTime() - new Date(b.live_at!).getTime());

  const pastLive = sessions.filter(s => s.live_at && new Date(s.live_at) < new Date() && !s.streaming_now)
    .sort((a, b) => new Date(b.live_at!).getTime() - new Date(a.live_at!).getTime());

  if (authLoading || (!isAdmin && user)) {
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

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <section className="py-8 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage videos, live sessions, categories, and themes</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            {message && !dialogOpen && (
              <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {message.type === 'success' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setMessage(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="videos" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-full mb-8 h-auto p-1.5 bg-muted">
                  <TabsTrigger value="videos" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Video className="w-5 h-5" /> Videos
                  </TabsTrigger>
                  <TabsTrigger value="live" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <RadioTower className="w-5 h-5" /> Live
                  </TabsTrigger>
                  <TabsTrigger value="users" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Users className="w-5 h-5" /> Users
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
                          <Plus className="w-4 h-4" /> Add Video
                        </Button>
                      </div>
                      <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search videos..."
                          value={videoSearch}
                          onChange={(e) => setVideoSearch(e.target.value)}
                          className="pl-10 pr-10 rounded-xl"
                        />
                        {videoSearch && (
                          <button onClick={() => setVideoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-3 pr-4">
                          {filteredVideos.map((session) => (
                            <div key={session.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                              <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                {session.thumbnail ? (
                                  <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="w-6 h-6 text-primary/30" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                                  <Badge variant={session.is_published ? "default" : "secondary"} className="text-xs">
                                    {session.is_published ? 'Published' : 'Draft'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{session.duration} min</span>
                                  <span className="capitalize">{session.difficulty}</span>
                                  {session.instructor && <span>by {session.instructor}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.slug && (
                                  <Link href={`/session/${session.slug}`}>
                                    <Button variant="outline" size="sm" className="rounded-lg">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                )}
                                <Button variant="outline" size="sm" onClick={() => togglePublished(session)} className="rounded-lg">
                                  {session.is_published ? 'Unpublish' : 'Publish'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(session)} className="rounded-lg">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(session)} className="rounded-lg text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {filteredVideos.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              {videoSearch ? 'No videos match your search.' : 'No videos yet. Click "Add Video" to create one.'}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Live Tab */}
                <TabsContent value="live">
                  <div className="space-y-6">
                    <Card className="rounded-3xl">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <RadioTower className="w-5 h-5" /> Upcoming & Live
                            </CardTitle>
                            <CardDescription>Scheduled live streams</CardDescription>
                          </div>
                          <Button onClick={() => openCreateDialog(true)} className="gap-2 rounded-xl">
                            <Plus className="w-4 h-4" /> Schedule Live
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {upcomingLive.map((session) => (
                            <div key={session.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                              <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                {session.thumbnail ? (
                                  <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <RadioTower className="w-6 h-6 text-primary/30" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                                  {session.streaming_now ? (
                                    <Badge className="bg-red-500 text-white text-xs animate-pulse flex items-center gap-1">
                                      <Circle className="w-2 h-2 fill-current" /> LIVE NOW
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="text-xs">Upcoming</Badge>
                                  )}
                                </div>
                                {session.live_at && (
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(session.live_at), 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(session.live_at), 'h:mm a')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={session.streaming_now ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() => toggleStreaming(session)}
                                  className="rounded-lg gap-1"
                                >
                                  <Circle className={`w-2 h-2 fill-current ${session.streaming_now ? 'animate-pulse' : ''}`} />
                                  {session.streaming_now ? 'End Stream' : 'Go Live'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(session)} className="rounded-lg">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(session)} className="rounded-lg text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {upcomingLive.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              No upcoming live sessions. Click "Schedule Live" to create one.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {pastLive.length > 0 && (
                      <Card className="rounded-3xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" /> Past Sessions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {pastLive.map((session) => (
                              <div key={session.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 opacity-75">
                                <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                  {session.thumbnail ? (
                                    <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover grayscale-[30%]" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <RadioTower className="w-6 h-6 text-primary/30" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold line-clamp-1">{session.title}</h3>
                                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                                  </div>
                                  {session.live_at && (
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span>{format(new Date(session.live_at), 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditDialog(session)} className="rounded-lg">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDelete(session)} className="rounded-lg text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users">
                  <Card className="rounded-3xl">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" /> Users
                          </CardTitle>
                          <CardDescription>{adminUsers.length} registered users</CardDescription>
                        </div>
                      </div>
                      <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-10 pr-10 rounded-xl"
                        />
                        {userSearch && (
                          <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-2 pr-4">
                          {adminUsers
                            .filter(u => !userSearch || u.displayName.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                            .map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                              onClick={() => openUserDetail(user)}
                            >
                              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/30">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-sm">
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="font-semibold line-clamp-1">{user.displayName}</h3>
                                  {user.isAdmin && (
                                    <Badge className="text-xs gap-1"><ShieldCheck className="w-3 h-3" />Admin</Badge>
                                  )}
                                  {user.subscriptionStatus === 'active' && (
                                    <Badge className="text-xs gap-1 bg-yellow-500 text-white"><Crown className="w-3 h-3" />Pro</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="truncate">{user.email}</span>
                                  <span className="flex-shrink-0">·</span>
                                  <span className="flex-shrink-0 capitalize">{user.provider}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {adminUsers.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              No users found.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>

        {/* Edit/Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setMessage(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Edit' : 'Create'} {isLiveSession ? 'Live Session' : 'Video'}</DialogTitle>
              <DialogDescription>Fill in the details below.</DialogDescription>
            </DialogHeader>

            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {message.type === 'success' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter title" className="rounded-xl" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" className="rounded-xl min-h-[100px]" />
              </div>

              <div className="grid gap-2">
                <Label>Thumbnail</Label>
                <div className="flex gap-3">
                  <Input
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg or upload"
                    className="rounded-xl flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleThumbnailUpload(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    <Button type="button" variant="outline" className="rounded-xl gap-2" disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </Button>
                  </div>
                </div>
                {uploading && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Uploading thumbnail... {uploadProgress}%</p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full flex-shrink-0"
                      onClick={() => thumbnailXhrRef.current?.abort()}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {formData.thumbnail && !uploading && (
                  <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden bg-muted">
                    <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {!isLiveSession && (
                <div className="grid gap-2">
                  <Label>Video</Label>
                  <div className="flex gap-3">
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://example.com/video.mp4 or upload"
                      className="rounded-xl flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVideoUpload(file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadingVideo}
                      />
                      <Button type="button" variant="outline" className="rounded-xl gap-2" disabled={uploadingVideo}>
                        {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload
                      </Button>
                    </div>
                  </div>
                  {uploadingVideo && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${videoUploadProgress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Uploading video... {videoUploadProgress}%</p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full flex-shrink-0"
                        onClick={() => videoXhrRef.current?.abort()}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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

              {isLiveSession && (
                <div className="grid gap-2">
                  <Label htmlFor="liveAt">Schedule Date & Time *</Label>
                  <Input id="liveAt" type="datetime-local" value={formData.liveAt} onChange={(e) => setFormData({ ...formData, liveAt: e.target.value })} className="rounded-xl" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Instructor</Label>
                <Input value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} placeholder="Instructor name" className="rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Theme</Label>
                  <Select value={formData.themeId} onValueChange={(v) => setFormData({ ...formData, themeId: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select theme" /></SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <Label className="font-medium cursor-pointer">{formData.isPublished ? 'Published' : 'Draft'}</Label>
                  <p className="text-xs text-muted-foreground">{formData.isPublished ? 'Visible to everyone' : 'Only visible to admins'}</p>
                </div>
                <Switch checked={formData.isPublished} onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Detail Dialog */}
        <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>Detailed user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/30">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xl">
                        {selectedUser.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUser.displayName}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedUser.isAdmin && (
                        <Badge className="gap-1"><ShieldCheck className="w-3 h-3" />Admin</Badge>
                      )}
                      {selectedUser.subscriptionStatus === 'active' && (
                        <Badge className="gap-1 bg-yellow-500 text-white"><Crown className="w-3 h-3" />Pro</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{selectedUser.provider}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {selectedUser.lastSignInAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Last sign in {format(new Date(selectedUser.lastSignInAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>Subscription: <Badge variant={selectedUser.subscriptionStatus === 'active' ? 'default' : 'secondary'} className="text-xs">{selectedUser.subscriptionStatus || 'None'}</Badge></span>
                  </div>
                  {selectedUser.subscriptionStatus === 'active' && selectedUser.subscriptionEnd && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Expires {format(new Date(selectedUser.subscriptionEnd), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedUser.subscriptionStatus === 'active' ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2 text-destructive hover:bg-destructive/10"
                      onClick={() => { revokeSubscription(selectedUser.id); setUserDetailOpen(false); }}
                    >
                      <Crown className="w-4 h-4" />
                      Revoke Subscription
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Grant Subscription</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          className="rounded-xl flex-1"
                          defaultValue={format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                          id="sub-end-date"
                        />
                        <Button
                          className="rounded-xl gap-2"
                          onClick={() => {
                            const input = document.getElementById('sub-end-date') as HTMLInputElement;
                            if (input?.value) {
                              grantSubscription(selectedUser.id, input.value);
                              setUserDetailOpen(false);
                            }
                          }}
                        >
                          <Crown className="w-4 h-4" />
                          Grant
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Defaults to 30 days from now</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setUserDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
