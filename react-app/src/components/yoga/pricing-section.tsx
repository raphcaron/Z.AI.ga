'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Star } from 'lucide-react';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19,
    period: 'month',
    description: 'Perfect for trying out our platform',
    features: [
      'Unlimited access to all classes',
      'Live session participation',
      'New classes added weekly',
      'Progress tracking',
      'Cancel anytime',
    ],
    highlighted: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 149,
    period: 'year',
    description: 'Best value - save 35%',
    originalPrice: 228,
    features: [
      'Everything in Monthly',
      'Priority access to live sessions',
      'Exclusive workshops',
      'Personalized yoga plans',
      'Download classes for offline',
      'Early access to new features',
    ],
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-accent/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5 mr-1.5" />
            Simple Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Journey
          </h2>
          <p className="text-muted-foreground text-lg">
            Start your yoga journey today with flexible plans designed for every practitioner.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
                plan.highlighted 
                  ? 'border-primary shadow-xl scale-105' 
                  : 'border-border hover:border-primary/30 hover:shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-bl-lg rounded-tr-xl bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-6">
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                  {plan.originalPrice && (
                    <span className="ml-2 text-muted-foreground line-through text-sm">
                      ${plan.originalPrice}
                    </span>
                  )}
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.highlighted ? 'bg-primary/10' : 'bg-accent'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlighted ? 'text-primary' : 'text-primary'}`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full rounded-xl ${
                    plan.highlighted 
                      ? 'bg-primary hover:bg-primary/90' 
                      : ''
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.highlighted ? 'Get Started' : 'Choose Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            7-day free trial
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Secure payment
          </div>
        </div>
      </div>
    </section>
  );
}
