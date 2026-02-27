export interface Session {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  videoUrl: string | null;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructor: string | null;
  isLive: boolean;
  liveAt: string | null;
  isPublished: boolean;
  categoryId: string | null;
  category: Category | null;
  themeId: string | null;
  theme: Theme | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  sessions: Session[];
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sessions: Session[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isSubscribed: boolean;
  subscriptionTier: 'monthly' | 'yearly' | null;
}

export interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  scheduledAt: string;
  thumbnail: string | null;
  isLive: boolean;
  viewerCount?: number;
}

export type ViewMode = 'all' | 'category' | 'live' | 'favorites';
