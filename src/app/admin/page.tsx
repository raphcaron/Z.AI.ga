'use client';

import { useState, useEffect } from 'react';
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
  Calendar, Circle, AlertCircle,
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
  const [videoSearch, setVideoSearch] = useState('');
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
                <TabsList className="grid w-full grid-cols-2 rounded-full mb-8 h-auto p-1.5 bg-muted">
                  <TabsTrigger value="videos" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Video className="w-5 h-5" /> Videos
                  </TabsTrigger>
                  <TabsTrigger value="live" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <RadioTower className="w-5 h-5" /> Live Sessions
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
                <Label>Thumbnail URL</Label>
                <Input value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="https://example.com/image.jpg" className="rounded-xl" />
              </div>

              {!isLiveSession && (
                <div className="grid gap-2">
                  <Label>Video URL</Label>
                  <Input value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="https://example.com/video.mp4" className="rounded-xl" />
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
      </main>
      <Footer />
    </div>
  );
}
