'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  User, 
  Mail, 
  Crown, 
  Calendar,
  CreditCard,
  Check,
  X,
  AlertCircle,
  Heart,
  Clock,
  Play,
  ArrowLeft,
  Settings,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionData {
  id: string;
  status: string;
  stripe_price_id: string;
  current_period_end: string;
  created_at: string;
}

interface FavoriteSession {
  id: string;
  session_id: string;
  sessions: {
    id: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    difficulty: string;
    instructor: string | null;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSubscribed, loading: authLoading } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile form state
  const [name, setName] = useState('');
  
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Favorites state
  const [favoriteSessions, setFavoriteSessions] = useState<FavoriteSession[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Tab from URL
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam && ['profile', 'favorites', 'subscription'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Initialize form when user data is available
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
    }
  }, [user]);

  // Load data when user is available
  useEffect(() => {
    if (user) {
      loadSubscription();
      loadFavoriteSessions();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
      }
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadFavoriteSessions = async () => {
    if (!user) return;
    setLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          session_id,
          sessions (
            id,
            title,
            thumbnail,
            duration,
            difficulty,
            instructor
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading favorites:', error);
        setFavoriteSessions([]);
      } else {
        setFavoriteSessions(data || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoriteSessions([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (sessionId: string) => {
    try {
      await toggleFavorite(sessionId);
      setFavoriteSessions(prev => prev.filter(f => f.session_id !== sessionId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscription.id);

      if (error) throw error;
      
      setSubscription(null);
      setMessage({ type: 'success', text: 'Subscription canceled successfully' });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to cancel subscription' 
      });
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  if (authLoading || !user) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-8 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
            
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Account Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your profile, favorites, and subscription
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full mb-12 h-auto p-1.5 bg-muted">
                <TabsTrigger value="profile" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <User className="w-5 h-5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Heart className="w-5 h-5" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="subscription" className="rounded-full gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Crown className="w-5 h-5" />
                  Subscription
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {/* Avatar Display */}
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {getInitials(name || user.user_metadata?.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Name Field */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Email Field (readonly) */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={user.email || ''}
                            className="pl-10 rounded-xl bg-muted"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>

                      {/* Message */}
                      {message && activeTab === 'profile' && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl ${
                          message.type === 'success' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {message.type === 'success' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          {message.text}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="rounded-xl bg-primary hover:bg-primary/90"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Favorites Tab */}
              <TabsContent value="favorites">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Favorite Classes
                    </CardTitle>
                    <CardDescription>
                      Your saved yoga classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingFavorites ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : favoriteSessions.length === 0 ? (
                      <div className="text-center py-8 space-y-6">
                        <div className="inline-flex p-4 rounded-full bg-primary/10">
                          <Heart className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">No Favorites Yet</h3>
                          <p className="text-muted-foreground text-sm">
                            Save your favorite classes by clicking the heart icon on any session
                          </p>
                        </div>
                        <Link href="/sessions">
                          <Button variant="outline" className="rounded-xl">
                            Browse Classes
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          {favoriteSessions.length} saved {favoriteSessions.length === 1 ? 'class' : 'classes'}
                        </p>
                        <ScrollArea className="h-[400px] pr-2">
                          <div className="space-y-3">
                            {favoriteSessions.map((fav) => (
                              <Link 
                                key={fav.id}
                                href={`/session/${fav.sessions?.id}`}
                                className="flex gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                              >
                                {/* Thumbnail */}
                                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                  {fav.sessions?.thumbnail ? (
                                    <img 
                                      src={fav.sessions.thumbnail} 
                                      alt={fav.sessions.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Play className="w-6 h-6 text-primary/30" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm line-clamp-1">
                                    {fav.sessions?.title || 'Unknown Session'}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    {fav.sessions?.difficulty && (
                                      <Badge variant="secondary" className={`text-xs rounded-full ${difficultyColors[fav.sessions.difficulty] || ''}`}>
                                        {fav.sessions.difficulty}
                                      </Badge>
                                    )}
                                    {fav.sessions?.duration && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {fav.sessions.duration} min
                                      </span>
                                    )}
                                  </div>
                                  {fav.sessions?.instructor && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      with {fav.sessions.instructor}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Remove button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveFavorite(fav.session_id);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </Link>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Subscription
                    </CardTitle>
                    <CardDescription>
                      Manage your subscription plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSubscription ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : isSubscribed || subscription ? (
                      <div className="space-y-6">
                        {/* Current Plan */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/20 border border-primary/20">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-primary/20">
                              <Crown className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Pro Membership</h3>
                              <Badge className="bg-green-500 hover:bg-green-500 text-white mt-1">
                                Active
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard className="w-4 h-4" />
                              <span>
                                {subscription?.stripe_price_id?.includes('yearly') ? '$149/year' : '$19/month'}
                              </span>
                            </div>
                            {subscription?.current_period_end && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Renews on {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                                </span>
                              </div>
                            )}
                            {subscription?.created_at && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Check className="w-4 h-4" />
                                <span>
                                  Member since {format(new Date(subscription.created_at), 'MMMM d, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Your Benefits</h4>
                          <ul className="space-y-2">
                            {[
                              'Unlimited access to all classes',
                              'Live session participation',
                              'New classes added weekly',
                              'Progress tracking',
                              'Priority support',
                            ].map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        {/* Cancel Subscription */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-destructive">Cancel Subscription</h4>
                          <p className="text-sm text-muted-foreground">
                            You'll continue to have access until the end of your current billing period.
                          </p>
                          <Button
                            variant="outline"
                            className="w-full rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10"
                            onClick={handleCancelSubscription}
                            disabled={loading}
                          >
                            <X className="w-4 w-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-6">
                        <div className="inline-flex p-4 rounded-full bg-primary/10">
                          <Crown className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">No Active Subscription</h3>
                          <p className="text-muted-foreground text-sm">
                            Subscribe to get unlimited access to all classes and live sessions
                          </p>
                        </div>
                        <Link href="/pricing">
                          <Button className="rounded-xl bg-primary hover:bg-primary/90">
                            View Plans
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Message */}
                    {message && activeTab === 'subscription' && (
                      <div className={`flex items-center gap-2 p-3 rounded-xl mt-4 ${
                        message.type === 'success' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {message.type === 'success' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        {message.text}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
