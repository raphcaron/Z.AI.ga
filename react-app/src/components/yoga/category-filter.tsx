'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Heart, 
  Leaf, 
  Moon, 
  Sun, 
  Wind,
  Sparkles,
  Timer,
  Dumbbell
} from 'lucide-react';

interface CategoryFilterProps {
  categories: { id: string; name: string; slug: string; icon: string | null }[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  flame: <Flame className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  leaf: <Leaf className="w-4 h-4" />,
  moon: <Moon className="w-4 h-4" />,
  sun: <Sun className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
  timer: <Timer className="w-4 h-4" />,
  dumbbell: <Dumbbell className="w-4 h-4" />,
};

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={`rounded-full gap-2 ${selectedCategory === null ? 'bg-primary hover:bg-primary/90' : ''}`}
      >
        <Sparkles className="w-4 h-4" />
        All Classes
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className={`rounded-full gap-2 ${selectedCategory === category.id ? 'bg-primary hover:bg-primary/90' : ''}`}
        >
          {category.icon && iconMap[category.icon]}
          {category.name}
        </Button>
      ))}
    </div>
  );
}

interface ThemeFilterProps {
  themes: { id: string; name: string; color: string | null }[];
  selectedTheme: string | null;
  onSelectTheme: (themeId: string | null) => void;
}

export function ThemeFilter({ themes, selectedTheme, onSelectTheme }: ThemeFilterProps) {
  if (themes.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((theme) => (
        <Badge
          key={theme.id}
          variant={selectedTheme === theme.id ? 'default' : 'outline'}
          className={`cursor-pointer transition-all rounded-full px-4 py-1.5 ${
            selectedTheme === theme.id 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
          style={{ 
            borderColor: theme.color || undefined,
          }}
          onClick={() => onSelectTheme(selectedTheme === theme.id ? null : theme.id)}
        >
          {theme.name}
        </Badge>
      ))}
    </div>
  );
}
