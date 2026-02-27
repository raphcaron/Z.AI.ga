'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { AuthModal } from '@/components/yoga/auth-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  Play, 
  Pause,
  Volume2, 
  VolumeX,
  Maximize,
  Heart,
  Clock,
  Calendar,
  Users,
  Share2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Crown,
  Pencil,
  Save,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Video,
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
  category_id: string | null;
  theme_id: string | null;
  created_at: string;
  category: { name: string } | null;
  theme: { name: string; color: string | null } | null;
}

interface RelatedSession {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
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

const difficultyOptions = ['beginner', 'intermediate', 'advanced'];

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isSubscribed } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [session, setSession] = useState<Session | null>(null);
  const [relatedSessions, setRelatedSessions] = useState<RelatedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
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
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
  const sessionId = params.id as string;
  const isFavorited = session ? isFavorite(session.id) : false;
  
  // Check admin status from database when user changes
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      // First check JWT metadata (fast)
      if (user.user_metadata?.is_admin === true) {
        setIsAdmin(true);
        return;
      }
      
      // Fallback: check via API (for users who were made admin after logging in)
      try {
        const sessionResult = await supabase.auth.getSession();
        const token = sessionResult.data.session?.access_token;
        
        if (token) {
          const response = await fetch('/api/users/check-admin', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin === true);
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // Track watch history when session loads
  useEffect(() => {
    if (session && user) {
      trackWatchHistory(0);
    }
  }, [session, user]);

  // Update watch history progress periodically
  useEffect(() => {
    if (!session || !user || !isPlaying) return;

    const interval = setInterval(() => {
      const newProgress = Math.min(progress + (100 / (session.duration * 60)) * 5, 100);
      setProgress(newProgress);
      setCurrentTime((newProgress / 100) * session.duration * 60);
      trackWatchHistory(Math.round(newProgress));
    }, 5000);

    return () => clearInterval(interval);
  }, [session, user, isPlaying, progress]);

  const trackWatchHistory = async (progressValue: number) => {
    if (!session || !user) return;

    try {
      const { data: existing } = await supabase
        .from('watch_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_id', session.id)
        .single();

      if (existing?.id) {
        await supabase
          .from('watch_history')
          .update({ 
            progress: progressValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('watch_history')
          .insert({
            user_id: user.id,
            session_id: session.id,
            progress: progressValue,
          });
      }
    } catch (error) {
      console.error('Error tracking watch history:', error);
    }
  };

  const loadSession = async () => {
    setLoading(true);
    try {
      // Try to find by ID first, then by slug
      let query = supabase
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
          theme:themes ( name, color )
        `);
      
      // Check if sessionId looks like a UUID (ID) or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
      
      if (isUUID) {
        query = query.eq('id', sessionId);
      } else {
        query = query.eq('slug', sessionId);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Error loading session:', error);
        router.push('/');
        return;
      }

      setSession(data);

      // Load related sessions - use the actual session ID from data, not the URL param
      if (data) {
        const { data: related } = await supabase
          .from('sessions')
          .select('id, title, slug, thumbnail, duration, difficulty, instructor')
          .eq('is_published', true)
          .neq('id', data.id)
          .limit(4);

        setRelatedSessions(related || []);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndThemes = async () => {
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');
    
    const { data: themesData } = await supabase
      .from('themes')
      .select('id, name, slug, color')
      .order('name');
    
    setCategories(categoriesData || []);
    setThemes(themesData || []);
  };

  const openEditDialog = async () => {
    if (!session) return;
    
    await loadCategoriesAndThemes();
    
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
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!session || !formData.title) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          title: formData.title,
          description: formData.description || null,
          thumbnail: formData.thumbnail || null,
          video_url: formData.videoUrl || null,
          duration: formData.duration,
          difficulty: formData.difficulty,
          instructor: formData.instructor || null,
          is_published: formData.isPublished,
          category_id: formData.categoryId || null,
          theme_id: formData.themeId || null,
        })
        .eq('id', session.id);

      if (error) throw error;
      
      setEditDialogOpen(false);
      loadSession();
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    
    setUploadingThumbnail(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('sessionId', session.id);
      
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({ ...formData, thumbnail: data.url });
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (session) {
      await toggleFavorite(session.id);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setProgress(percentage);
    if (session) {
      setCurrentTime((percentage / 100) * session.duration * 60);
      trackWatchHistory(Math.round(percentage));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) {
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

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Session not found</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const totalSeconds = session.duration * 60;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Video Player Section */}
        <div className="relative w-full bg-black aspect-video max-h-[70vh]">
          {/* Back Button */}
          <Link 
            href="/"
            className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          {user && isSubscribed ? (
            <>
              <div 
                className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => showControls && setShowControls(true)}
              >
                {session.thumbnail ? (
                  <img 
                    src={session.thumbnail} 
                    alt={session.title}
                    className={`w-full h-full object-cover transition-opacity ${isPlaying ? 'opacity-30' : 'opacity-50'}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-24 h-24 text-white/20" />
                  </div>
                )}

                {!isPlaying && (
                  <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Play className="w-10 h-10 text-primary-foreground ml-1" />
                    </div>
                  </button>
                )}

                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <div 
                    className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={handlePlayPause} className="text-white hover:text-primary transition-colors">
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </button>
                      
                      <button onClick={handleMute} className="text-white hover:text-primary transition-colors">
                        {isMuted ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>

                      <span className="text-white text-sm">
                        {formatTime(currentTime)} / {formatTime(totalSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button className="text-white hover:text-primary transition-colors">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <div className="text-center px-6 py-8 max-w-md">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Subscribe to Watch
                </h2>
                <p className="text-white/70 mb-6">
                  Get unlimited access to all yoga classes, live sessions, and meditation practices with a subscription.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/pricing">
                    <Button size="lg" className="rounded-xl w-full sm:w-auto">
                      <Crown className="w-4 h-4 mr-2" />
                      View Plans
                    </Button>
                  </Link>
                  {!user && (
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="rounded-xl w-full sm:w-auto bg-white/10 text-white border border-white/30 hover:bg-white/20"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Actions */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {session.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    {session.category && (
                      <Badge variant="secondary" className="rounded-full">
                        {session.category.name}
                      </Badge>
                    )}
                    <Badge 
                      variant="secondary" 
                      className={`rounded-full ${difficultyColors[session.difficulty] || ''}`}
                    >
                      {session.difficulty}
                    </Badge>
                    {session.theme && (
                      <Badge 
                        variant="outline" 
                        className="rounded-full"
                        style={{ borderColor: session.theme.color || undefined }}
                      >
                        {session.theme.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={openEditDialog}
                      className="rounded-full"
                      title="Edit video"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full ${isFavorited ? 'text-red-500 border-red-500' : ''}`}
                    onClick={handleFavoriteClick}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Session Meta */}
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{session.duration} minutes</span>
                </div>
                {session.instructor && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>with {session.instructor}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(session.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Instructor Card */}
              {session.instructor && (
                <Card className="rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {session.instructor.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.instructor}</p>
                      <p className="text-sm text-muted-foreground">Instructor</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {session.description && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">About this class</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {session.description}
                  </p>
                </div>
              )}

              {/* Subscription CTA for non-subscribers */}
              {!isSubscribed && (
                <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/20 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">Want unlimited access?</h3>
                    <p className="text-muted-foreground mb-4">
                      Subscribe to get full access to all classes and live sessions
                    </p>
                    <Button className="rounded-xl bg-primary hover:bg-primary/90">
                      Subscribe Now - $19/month
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Related Sessions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">More Classes</h2>
              <div className="space-y-3">
                {relatedSessions.map((related) => (
                  <Link 
                    key={related.id} 
                    href={`/session/${related.slug || related.id}`}
                    className="block"
                  >
                    <Card className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex gap-3 p-2">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                          {related.thumbnail ? (
                            <img 
                              src={related.thumbnail} 
                              alt={related.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h3 className="font-medium text-sm line-clamp-2">{related.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs rounded-full ${difficultyColors[related.difficulty] || ''}`}
                            >
                              {related.difficulty}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {related.duration} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update the details of this video session.
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

            {/* Video URL */}
            <div className="grid gap-2">
              <Label>Video URL</Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
                className="rounded-xl"
              />
              {formData.videoUrl && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Video URL set
                </p>
              )}
            </div>

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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">
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
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
