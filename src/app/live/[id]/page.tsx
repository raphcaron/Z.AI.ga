'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { AuthModal } from '@/components/yoga/auth-modal';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  Play, 
  Pause,
  Volume2, 
  VolumeX,
  Maximize,
  Radio,
  Users,
  Share2,
  Loader2,
  MessageCircle,
  Send,
  Eye,
  Clock,
  Lock,
  Crown,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
  liveAt: string;
  streamingNow: boolean;
  category: { name: string } | null;
  theme: { name: string; color: string | null } | null;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
}

export default function LiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isSubscribed } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Live state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(142);
  const [liveDuration, setLiveDuration] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Sarah', message: 'Love this flow! 🧘‍♀️', timestamp: new Date() },
    { id: '2', user: 'Mike', message: 'So relaxing', timestamp: new Date() },
    { id: '3', user: 'Emma', message: 'First time here, this is amazing!', timestamp: new Date() },
    { id: '4', user: 'David', message: 'Great energy today!', timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sessionId = params.id as string;

  // Fetch session from database
  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            id,
            title,
            slug,
            description,
            thumbnail,
            duration,
            difficulty,
            instructor,
            live_at,
            streaming_now,
            category:categories ( name ),
            theme:themes ( name, color )
          `)
          .eq('id', sessionId)
          .not('live_at', 'is', null)
          .single();

        if (error) {
          console.error('Error fetching live session:', error);
          setSession(null);
        } else if (data) {
          setSession({
            id: data.id,
            title: data.title,
            slug: data.slug,
            description: data.description,
            thumbnail: data.thumbnail,
            duration: data.duration,
            difficulty: data.difficulty,
            instructor: data.instructor,
            liveAt: data.live_at,
            streamingNow: data.streaming_now || false,
            category: data.category,
            theme: data.theme,
          });
        }
      } catch (error) {
        console.error('Error fetching live session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Simulate live viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 10) - 3;
        return Math.max(50, prev + change);
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Update live duration
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setLiveDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: user.user_metadata?.name || 'You',
      message: newMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatLiveDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <div className="text-center">
            <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Live session not found</h2>
            <p className="text-muted-foreground mb-4">This live session may have ended or doesn't exist.</p>
          </div>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const liveDate = new Date(session.liveAt);
  const isLive = session.streamingNow;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {/* Video Player Section */}
          <div className="flex-1 flex flex-col">
            {/* Video Container */}
            <div className="relative flex-1 bg-black min-h-[300px] lg:min-h-[500px]">
              {/* Back Button */}
              <Link 
                href="/"
                className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/40 px-3 py-1.5 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </Link>

              {/* Live Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                {isLive ? (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1.5 px-3 py-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    LIVE NOW
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <Calendar className="w-3 h-3" />
                    {format(liveDate, 'MMM d • h:mm a')}
                  </Badge>
                )}
              </div>

              {/* Viewer Count */}
              {isLive && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-white text-sm">
                    <Eye className="w-4 h-4" />
                    <span>{viewerCount.toLocaleString()} watching</span>
                  </div>
                </div>
              )}

              {/* Thumbnail Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800">
                {session.thumbnail ? (
                  <img 
                    src={session.thumbnail} 
                    alt={session.title}
                    className="w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio className="w-24 h-24 text-white/20" />
                  </div>
                )}

                {/* Not Live Yet Overlay */}
                {!isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center px-6 py-8">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">
                        Starting Soon
                      </h2>
                      <p className="text-white/70 mb-2">
                        Scheduled for
                      </p>
                      <p className="text-white font-medium mb-6">
                        {format(liveDate, 'EEEE, MMMM d • h:mm a')}
                      </p>
                      <Button variant="outline" className="rounded-xl bg-white/10 text-white border-white/30 hover:bg-white/20">
                        <Clock className="w-4 h-4 mr-2" />
                        Set Reminder
                      </Button>
                    </div>
                  </div>
                )}

                {user && isSubscribed && isLive ? (
                  <>
                    {/* Play Button Overlay */}
                    {!isPlaying && (
                      <button
                        onClick={handlePlayPause}
                        className="absolute inset-0 flex items-center justify-center group"
                      >
                        <div className="w-20 h-20 rounded-full bg-red-500/90 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
                          <Play className="w-10 h-10 text-white ml-1" />
                        </div>
                      </button>
                    )}

                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button onClick={handlePlayPause} className="text-white hover:text-red-400 transition-colors">
                            {isPlaying ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6" />
                            )}
                          </button>
                          
                          <button onClick={handleMute} className="text-white hover:text-red-400 transition-colors">
                            {isMuted ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>

                          <button className="text-white hover:text-red-400 transition-colors">
                            <Maximize className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-white text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{formatLiveDuration(liveDuration)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : isLive && (
                  /* Paywall for non-subscribers */
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center px-6 py-8 max-w-md">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">
                        Subscribe to Watch Live
                      </h2>
                      <p className="text-white/70 mb-6">
                        Join live sessions and interact with instructors in real-time. Get unlimited access with a subscription.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/pricing">
                          <Button size="lg" className="rounded-xl w-full sm:w-auto bg-red-500 hover:bg-red-600">
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
            </div>

            {/* Session Info */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground mb-1">
                    {session.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {session.category && <span>{session.category.name}</span>}
                    {session.category && session.theme && <span>•</span>}
                    {session.theme && <span>{session.theme.name}</span>}
                    <span>•</span>
                    <span>{session.duration} min</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 rounded-full">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.instructor?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{session.instructor || 'Instructor'}</p>
                    <p className="text-xs text-muted-foreground">Instructor</p>
                  </div>
                </div>
                <Button 
                  variant={isFollowing ? "secondary" : "default"}
                  size="sm"
                  className="rounded-full"
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>

              {/* Description */}
              {session.description && (
                <p className="text-sm text-muted-foreground mt-4">
                  {session.description}
                </p>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Live Chat</span>
              </div>
              {isLive && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{viewerCount} watching</span>
                </div>
              )}
            </div>

            {isLive ? (
              <>
                <ScrollArea className="flex-1 p-3 h-[200px] lg:h-[400px]">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {msg.user.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium text-primary">{msg.user}</span>
                            <span className="ml-2 text-muted-foreground">{msg.message}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <div className="p-3 border-t border-border">
                  {user ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Say something..."
                        className="flex-1 rounded-full"
                      />
                      <Button type="submit" size="icon" className="rounded-full">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Sign in to join the chat
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => setAuthModalOpen(true)}
                      >
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Chat will be available when the session goes live
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
