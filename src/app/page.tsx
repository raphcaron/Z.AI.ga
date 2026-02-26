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

// Mock live sessions (for demo)
const mockLiveSessions = [
  {
    id: 'live_1',
    title: 'Morning Vinyasa Flow',
    instructor: 'Sarah Johnson',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    thumbnail: null,
    isLive: true,
    viewerCount: 127,
  },
  {
    id: 'live_2',
    title: 'Sunset Yin Practice',
    instructor: 'Emma Chen',
    scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    thumbnail: null,
    isLive: false,
  },
  {
    id: 'live_3',
    title: 'Power Yoga Challenge',
    instructor: 'Michael Torres',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: null,
    isLive: false,
  },
];

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch recent sessions from Supabase
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
              <Button variant="outline" className="gap-2 rounded-full">
                <Calendar className="w-4 h-4" />
                View Schedule
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockLiveSessions.map((session) => (
                <LiveSessionCard key={session.id} session={session} />
              ))}
            </div>
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
                <Button variant="outline" className="gap-2 rounded-full">
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
