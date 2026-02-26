'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { AuthModal } from '@/components/yoga/auth-modal';
import { useAuth } from '@/hooks/use-auth';
import { 
  Check, 
  X, 
  Sparkles,
  Heart,
  Play,
  Users,
  Calendar,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

const plans = [
  {
    name: 'Monthly',
    price: 19,
    period: 'month',
    description: 'Perfect for trying out',
    features: [
      { text: 'Unlimited access to all classes', included: true },
      { text: 'Live sessions access', included: true },
      { text: 'New content weekly', included: true },
      { text: 'Cancel anytime', included: true },
      { text: 'HD video quality', included: true },
    ],
    popular: false,
  },
  {
    name: 'Yearly',
    price: 149,
    period: 'year',
    description: 'Best value - save 35%',
    features: [
      { text: 'Unlimited access to all classes', included: true },
      { text: 'Live sessions access', included: true },
      { text: 'New content weekly', included: true },
      { text: 'Cancel anytime', included: true },
      { text: 'HD video quality', included: true },
      { text: 'Offline downloads', included: true },
    ],
    popular: true,
    savings: 'Save $79',
  },
];

const benefits = [
  {
    icon: Play,
    title: '500+ Classes',
    description: 'Yoga, Pilates, meditation and more',
  },
  {
    icon: Users,
    title: 'Live Sessions',
    description: 'Join live classes with real instructors',
  },
  {
    icon: Calendar,
    title: 'New Content',
    description: 'Fresh classes added every week',
  },
  {
    icon: Zap,
    title: 'Any Device',
    description: 'Watch on TV, tablet, phone or web',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    setLoading(planName);
    // Simulate subscription process
    setTimeout(() => {
      setLoading(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Start your journey
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get unlimited access to all yoga classes, live sessions, and meditation practices. 
              Start your wellness journey today.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 px-4 border-b border-border">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.name}
                  className={`relative rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
                    plan.popular ? 'border-primary shadow-lg scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-sm font-medium py-1">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className={`text-center ${plan.popular ? 'pt-8' : ''}`}>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    
                    {plan.savings && (
                      <Badge variant="secondary" className="mx-auto mt-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {plan.savings}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                    
                    <Button 
                      className={`w-full mt-6 rounded-xl ${plan.popular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                      variant={plan.popular ? 'default' : 'secondary'}
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={loading !== null}
                    >
                      {loading === plan.name ? 'Processing...' : user ? 'Subscribe' : 'Get Started'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantee */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">30-Day Money Back Guarantee</h2>
            </div>
            <p className="text-muted-foreground">
              Not satisfied? Get a full refund within 30 days. No questions asked.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and Apple Pay.',
                },
                {
                  q: 'Can I switch plans?',
                  a: 'Absolutely! You can upgrade or downgrade your plan at any time from your account settings.',
                },
                {
                  q: 'Do you offer a free trial?',
                  a: 'We offer a 7-day free trial for new members. No credit card required to start.',
                },
              ].map((faq, index) => (
                <Card key={index} className="rounded-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-t from-primary/5 to-background">
          <div className="container mx-auto max-w-2xl text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Ready to start your journey?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of people who have transformed their lives through yoga and mindfulness.
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-xl">
                Browse Classes
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
