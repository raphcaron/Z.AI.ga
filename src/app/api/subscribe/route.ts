import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { priceIds, getOrigin } from '@/lib/stripe-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, email, userId } = body;

    const validPriceIds = Object.values(priceIds).filter(Boolean);
    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const origin = getOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      customer_email: email,
      metadata: {
        userId: userId || '',
      },
      subscription_data: {
        trial_period_days: 7,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
