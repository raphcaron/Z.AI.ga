'use client';

import { useState, useEffect } from 'react';
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
  categoryId: string | null;
  themeId: string | null;
  category: { name: string } | null;
  theme: { name: string } | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface Theme {
  id: string;
  name: string;
}

const difficultyOptions = ['beginner', 'intermediate', 'advanced'];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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

  // Check if user is admin (for demo, check user_metadata or allow all logged-in users)
  const isAdmin = user?.user_metadata?.is_admin || true; // For demo, all logged-in users are admins

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          slug,
          description,
          thumbnail,
          video_url,
          duration,
          difficulty,
          instructor,
          is_live,
          live_at,
          is_published,
          category_id,
          theme_id,
          created_at,
          category:categories ( name ),
          theme:themes ( name )
        `)
        .order('created_at', { ascending: false });

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      // Fetch themes
      const { data: themesData } = await supabase
        .from('themes')
        .select('id, name')
        .order('name');

      setSessions((sessionsData || []).map((s: any) => ({
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
        categoryId: s.category_id,
        themeId: s.theme_id,
        category: s.category,
        theme: s.theme,
        createdAt: s.created_at,
      })));
      setCategories(categoriesData || []);
      setThemes(themesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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

      if (editingSession) {
        // Update existing session
        const { error } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', editingSession.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Session updated successfully!' });
      } else {
        // Create new session
        const { error } = await supabase
          .from('sessions')
          .insert(sessionData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Session created successfully!' });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving session:', error);
      setMessage({ type: 'error', text: 'Failed to save session' });
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
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Manage videos, live sessions, categories, and themes
            </p>
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
              <TabsList className="grid w-full grid-cols-2 rounded-full mb-8 h-auto p-1.5 bg-muted">
                <TabsTrigger value="videos" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Video className="w-5 h-5" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="live" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <RadioTower className="w-5 h-5" />
                  Live Sessions
                </TabsTrigger>
              </TabsList>

              {/* Videos Tab */}
              <TabsContent value="videos">
                <Card className="rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Video Library</CardTitle>
                      <CardDescription>Manage your on-demand video content</CardDescription>
                    </div>
                    <Button onClick={() => openCreateDialog(false)} className="gap-2 rounded-xl">
                      <Plus className="w-4 h-4" />
                      Add Video
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-3 pr-4">
                          {sessions.filter(s => !s.liveAt).map((session) => (
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
                          {sessions.filter(s => !s.liveAt).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              No videos yet. Click "Add Video" to create your first video.
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
                <Card className="rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Live Sessions</CardTitle>
                      <CardDescription>Schedule and manage live streams</CardDescription>
                    </div>
                    <Button onClick={() => openCreateDialog(true)} className="gap-2 rounded-xl">
                      <Plus className="w-4 h-4" />
                      Schedule Live
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-3 pr-4">
                          {sessions.filter(s => s.liveAt).map((session) => {
                            const liveDate = new Date(session.liveAt!);
                            const isPast = liveDate < new Date();
                            
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
                                    <Badge variant={isPast ? "secondary" : "default"} className="text-xs">
                                      {isPast ? 'Past' : 'Upcoming'}
                                    </Badge>
                                    {session.isLive && (
                                      <Badge className="bg-red-500 text-white text-xs animate-pulse">LIVE</Badge>
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
                          {sessions.filter(s => s.liveAt).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              No live sessions scheduled. Click "Schedule Live" to create one.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
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

            {/* Thumbnail URL */}
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="rounded-xl"
              />
            </div>

            {/* Video URL */}
            {!isLiveSession && (
              <div className="grid gap-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  className="rounded-xl"
                />
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger className="rounded-xl">
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
              </div>

              {/* Theme */}
              <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.themeId}
                  onValueChange={(value) => setFormData({ ...formData, themeId: value })}
                >
                  <SelectTrigger className="rounded-xl">
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
    </div>
  );
}
