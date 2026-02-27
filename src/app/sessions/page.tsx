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
import { Input } from '@/components/ui/input';
import { Video, Search, X, Loader2, Filter, ArrowLeft, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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
  createdAt: string;
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

const durationOptions = [
  { value: 'short', label: 'Short', sublabel: '< 30 min', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'medium', label: 'Medium', sublabel: '30-45 min', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'long', label: 'Long', sublabel: '45+ min', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: ArrowDown },
  { value: 'oldest', label: 'Oldest First', icon: ArrowUp },
  { value: 'duration-asc', label: 'Shortest First', icon: Clock },
  { value: 'duration-desc', label: 'Longest First', icon: Clock },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
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
        params.append('limit', '100');
        
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
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTheme(null);
    setSelectedDifficulty(null);
    setSelectedDuration(null);
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTheme || selectedDifficulty || selectedDuration;

  // Client-side filter for search and duration, then sort
  const filteredAndSortedSessions = useMemo(() => {
    let result = sessions;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((session) => 
        session.title.toLowerCase().includes(query) ||
        (session.description && session.description.toLowerCase().includes(query)) ||
        (session.instructor && session.instructor.toLowerCase().includes(query)) ||
        (session.category && session.category.name.toLowerCase().includes(query)) ||
        (session.theme && session.theme.name.toLowerCase().includes(query))
      );
    }
    
    // Filter by duration
    if (selectedDuration) {
      result = result.filter((session) => {
        const duration = session.duration;
        switch (selectedDuration) {
          case 'short':
            return duration < 30;
          case 'medium':
            return duration >= 30 && duration <= 45;
          case 'long':
            return duration > 45;
          default:
            return true;
        }
      });
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'duration-asc':
          return a.duration - b.duration;
        case 'duration-desc':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });
    
    return result;
  }, [sessions, searchQuery, selectedDuration, sortBy]);

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
                {filteredAndSortedSessions.length} Classes
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
              {/* Search and Sort Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by title, instructor, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">Sort:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                            sortBy === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{option.label}</span>
                          <span className="md:hidden">{option.value.includes('duration') ? 'Time' : 'Date'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
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
              
              {/* Duration Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Duration</span>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedDuration(
                        selectedDuration === option.value ? null : option.value
                      )}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedDuration === option.value
                          ? option.color + ' ring-2 ring-primary/50'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{option.label}</span>
                      <span className="text-xs opacity-70">({option.sublabel})</span>
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
            ) : filteredAndSortedSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No classes found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedSessions.map((session) => (
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
