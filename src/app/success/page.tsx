'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';

function SuccessContent() {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!user || confirmed) return;

    const poll = async () => {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (sub) {
        setConfirmed(true);
      }
    };

    poll();
    const interval = setInterval(() => {
      setPolls(p => {
        if (p >= 30) return p;
        poll();
        return p + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [user, confirmed]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {!confirmed ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Confirming your subscription...</h1>
              <p className="text-muted-foreground">
                Hang tight! We're setting everything up for you.
              </p>
              {polls > 5 && (
                <Button variant="link" className="mt-4" onClick={() => window.location.reload()}>
                  Refresh page
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Welcome to Boho Yoga Pro!</h1>
              <p className="text-muted-foreground mb-8">
                Your subscription is active. Enjoy unlimited access to all classes, live sessions, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/">
                  <Button size="lg" className="rounded-xl gap-2">
                    Browse Classes
                  </Button>
                </Link>
                <Link href="/settings?tab=subscription">
                  <Button size="lg" variant="outline" className="rounded-xl">
                    Manage Subscription
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
