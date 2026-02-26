'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/yoga/navigation';
import { HeroSection } from '@/components/yoga/hero-section';
import { LiveSessionCard } from '@/components/yoga/live-session-card';
import { SessionCard } from '@/components/yoga/session-card';
import { CategoryFilter, ThemeFilter } from '@/components/yoga/category-filter';
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

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface Theme {
  id: string;
  name: string;
  color: string | null;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch sessions
        const sessionsRes = await fetch('/api/sessions');
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }
        
        // Fetch categories
        const categoriesRes = await fetch('/api/categories');
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }
        
        // Fetch themes
        const themesRes = await fetch('/api/themes');
        if (themesRes.ok) {
          const data = await themesRes.json();
          setThemes(data.themes || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (selectedCategory) {
      const categoryName = categories.find(c => c.id === selectedCategory)?.name;
      filtered = filtered.filter(s => s.category?.name === categoryName);
    }
    
    if (selectedTheme) {
      const themeName = themes.find(t => t.id === selectedTheme)?.name;
      filtered = filtered.filter(s => s.theme?.name === themeName);
    }
    
    return filtered;
  }, [sessions, selectedCategory, selectedTheme, categories, themes]);

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

        {/* Session Library Section */}
        <section id="library" className="py-16 md:py-20 bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <Badge variant="secondary" className="mb-3 px-3 py-1 rounded-full gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  {sessions.length}+ Classes
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">Class Library</h2>
                <p className="text-muted-foreground mt-2">
                  Explore our collection of yoga classes for every level
                </p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-col gap-4 mb-8">
                  <CategoryFilter 
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                  <ThemeFilter 
                    themes={themes}
                    selectedTheme={selectedTheme}
                    onSelectTheme={setSelectedTheme}
                  />
                </div>
                
                {/* Session Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSessions.map((session) => (
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
                
                {filteredSessions.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">No classes found matching your filters.</p>
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedTheme(null);
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

      </main>
      
      <Footer />
      
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
