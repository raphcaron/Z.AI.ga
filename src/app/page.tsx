'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/yoga/navigation';
import { HeroSection } from '@/components/yoga/hero-section';
import { LiveSessionCard } from '@/components/yoga/live-session-card';
import { SessionCard } from '@/components/yoga/session-card';
import { Footer } from '@/components/yoga/footer';
import { AuthModal } from '@/components/yoga/auth-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioTower, Video, Calendar, ArrowRight, Loader2 } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
  category: { name: string } | null;
  theme: { name: string; color: string | null } | null;
}

interface LiveSession {
  id: string;
  title: string;
  instructor: string | null;
  liveAt: string;
  thumbnail: string | null;
  isLive: boolean;
  duration: number;
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch sessions from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch recent sessions (limit to 4 for homepage overview)
        const sessionsRes = await fetch('/api/sessions?limit=4');
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }

        // Fetch live/upcoming sessions
        const liveRes = await fetch('/api/sessions/live');
        if (liveRes.ok) {
          const data = await liveRes.json();
          // Get only upcoming sessions (next 3)
          const upcoming = (data.sessions || [])
            .filter((s: LiveSession) => new Date(s.liveAt) >= new Date())
            .slice(0, 3);
          setLiveSessions(upcoming);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Live Sessions Section */}
        <section id="live" className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <Badge variant="secondary" className="mb-3 px-3 py-1 rounded-full gap-1.5">
                  <RadioTower className="w-3.5 h-3.5" />
                  Live Now
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">Live Sessions</h2>
                <p className="text-muted-foreground mt-2">
                  Join our instructors for real-time yoga sessions
                </p>
              </div>
              <Link href="/calendar">
                <Button variant="outline" className="gap-2 rounded-full cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  View Schedule
                </Button>
              </Link>
            </div>
            
            {liveSessions.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-2xl">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming live sessions</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon for new sessions!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.map((session) => (
                  <LiveSessionCard 
                    key={session.id} 
                    session={{
                      id: session.id,
                      title: session.title,
                      instructor: session.instructor || 'Instructor',
                      scheduledAt: session.liveAt,
                      thumbnail: session.thumbnail,
                      isLive: session.isLive,
                      viewerCount: session.isLive ? Math.floor(Math.random() * 200) + 50 : undefined,
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Classes Section */}
        <section id="classes" className="py-16 md:py-20 bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <Badge variant="secondary" className="mb-3 px-3 py-1 rounded-full gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Recent Classes
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">Class Library</h2>
                <p className="text-muted-foreground mt-2">
                  Explore our collection of yoga classes for every level
                </p>
              </div>
              <Link href="/sessions">
                <Button variant="outline" className="gap-2 rounded-full cursor-pointer">
                  View All Classes
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sessions.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session as {
                      id: string;
                      title: string;
                      slug: string;
                      description: string | null;
                      thumbnail: string | null;
                      duration: number;
                      difficulty: 'beginner' | 'intermediate' | 'advanced';
                      instructor: string | null;
                      category?: { name: string } | null;
                      theme?: { name: string; color: string | null } | null;
                    }}
                    onAuthRequired={() => setAuthModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
      
      <Footer />
      
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
