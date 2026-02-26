'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { AuthModal } from '@/components/yoga/auth-modal';
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
  Crown
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
  created_at: string;
  category: { name: string } | null;
  theme: { name: string; color: string | null } | null;
}

interface RelatedSession {
  id: string;
  title: string;
  thumbnail: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isSubscribed } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [session, setSession] = useState<Session | null>(null);
  const [relatedSessions, setRelatedSessions] = useState<RelatedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const sessionId = params.id as string;
  const isFavorited = session ? isFavorite(session.id) : false;

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
          created_at,
          category:categories ( name ),
          theme:themes ( name, color )
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error loading session:', error);
        router.push('/');
        return;
      }

      setSession(data);

      // Load related sessions
      if (data) {
        const { data: related } = await supabase
          .from('sessions')
          .select('id, title, thumbnail, duration, difficulty, instructor')
          .eq('is_published', true)
          .neq('id', sessionId)
          .limit(4);

        setRelatedSessions(related || []);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
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
              {/* Video Placeholder / Thumbnail - Only rendered for logged-in users */}
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

                {/* Play Button Overlay */}
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

                {/* Video Controls */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Progress Bar */}
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
            /* Paywall for non-subscribers - NO video content rendered */
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
                    href={`/session/${related.id}`}
                    className="block"
                  >
                    <Card className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex gap-3 p-3">
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
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
                        <div className="flex-1 min-w-0">
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
    </div>
  );
}
