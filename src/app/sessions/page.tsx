'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/yoga/navigation';
import { SessionCard } from '@/components/yoga/session-card';
import { CategoryFilter, ThemeFilter } from '@/components/yoga/category-filter';
import { Footer } from '@/components/yoga/footer';
import { AuthModal } from '@/components/yoga/auth-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Search, X, Loader2, Filter, ArrowLeft } from 'lucide-react';

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

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Build query params
        const params = new URLSearchParams();
        if (selectedCategory) params.append('categoryId', selectedCategory);
        if (selectedTheme) params.append('themeId', selectedTheme);
        if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
        params.append('limit', '20');
        
        // Fetch sessions with filters
        const sessionsRes = await fetch(`/api/sessions?${params.toString()}`);
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }
        
        // Fetch categories and themes only once
        if (categories.length === 0) {
          const categoriesRes = await fetch('/api/categories');
          if (categoriesRes.ok) {
            const data = await categoriesRes.json();
            setCategories(data.categories || []);
          }
          
          const themesRes = await fetch('/api/themes');
          if (themesRes.ok) {
            const data = await themesRes.json();
            setThemes(data.themes || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [selectedCategory, selectedTheme, selectedDifficulty]);

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedTheme(null);
    setSelectedDifficulty(null);
  };

  const hasActiveFilters = selectedCategory || selectedTheme || selectedDifficulty;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-12 md:py-16 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
            
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="px-3 py-1 rounded-full gap-1.5">
                <Video className="w-3.5 h-3.5" />
                {sessions.length} Classes
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Class Library</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Explore our complete collection of yoga classes. Filter by category, theme, or difficulty to find the perfect practice for you.
            </p>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-6 border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4">
              {/* Category Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Categories</span>
                <CategoryFilter 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
              
              {/* Theme Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Themes</span>
                <ThemeFilter 
                  themes={themes}
                  selectedTheme={selectedTheme}
                  onSelectTheme={setSelectedTheme}
                />
              </div>
              
              {/* Difficulty Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Difficulty</span>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedDifficulty(
                        selectedDifficulty === option.value ? null : option.value
                      )}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedDifficulty === option.value
                          ? option.color + ' ring-2 ring-primary/50'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-muted-foreground"
                    onClick={clearAllFilters}
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sessions Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No classes found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters to find more classes
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
