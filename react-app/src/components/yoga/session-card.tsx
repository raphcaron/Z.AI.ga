'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Heart, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/hooks/use-favorites';
import { useAuth } from '@/hooks/use-auth';

interface SessionCardProps {
  session: {
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
  };
  onAuthRequired?: () => void;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function SessionCard({ session, onAuthRequired }: SessionCardProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isFavorited = isFavorite(session.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    setIsLoading(true);
    try {
      const newState = await toggleFavorite(session.id);
      setToastMessage(newState ? 'Added to favorites' : 'Removed from favorites');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/session/${session.slug || session.id}`}>
      <Card className="group overflow-hidden border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-card cursor-pointer p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-2xl">
          {/* Thumbnail */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20">
            {session.thumbnail ? (
              <img 
                src={session.thumbnail} 
                alt={session.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent to-secondary">
                <Play className="w-12 h-12 text-primary/30" />
              </div>
            )}
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-3 right-3 z-10">
            <Badge variant="secondary" className="bg-black/70 text-white hover:bg-black/70 gap-1 px-2 py-1 text-xs">
              <Clock className="w-3 h-3" />
              {session.duration} min
            </Badge>
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
              isFavorited 
                ? 'bg-red-500/20 hover:bg-red-500/30' 
                : 'bg-black/40 hover:bg-black/60'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Heart 
                className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} 
              />
            )}
          </button>

          {/* Toast notification */}
          {showToast && (
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/80 text-white text-xs rounded-full animate-fade-in z-10">
              {toastMessage}
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground line-clamp-1 flex-1">
              {session.title}
            </h3>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge 
              variant="secondary" 
              className={`text-xs rounded-full ${difficultyColors[session.difficulty]}`}
            >
              {session.difficulty}
            </Badge>
            {session.category && (
              <Badge variant="outline" className="text-xs rounded-full">
                {session.category.name}
              </Badge>
            )}
            {session.theme && (
              <Badge 
                variant="outline" 
                className="text-xs rounded-full"
                style={{ borderColor: session.theme.color || undefined }}
              >
                {session.theme.name}
              </Badge>
            )}
          </div>

          {session.instructor && (
            <p className="text-sm text-muted-foreground">
              with <span className="text-foreground font-medium">{session.instructor}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
