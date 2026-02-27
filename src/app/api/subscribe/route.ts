import { NextResponse } from 'next/server';
import { priceIds } from '@/lib/stripe';

interface SubscribeRequest {
  priceId: string;
  email: string;
  userId?: string;
}

export async function POST(request: Request) {
  try {
    const body: SubscribeRequest = await request.json();
    const { priceId, email, userId } = body;

    // Validate price ID
    const validPriceIds = [priceIds.monthly, priceIds.yearly];
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Create a Stripe customer if not exists
    // 2. Create a Stripe checkout session
    // 3. Return the checkout URL

    // Mock response for demo
    const checkoutUrl = `https://checkout.stripe.com/mock/${priceId}`;

    return NextResponse.json({
      checkoutUrl,
      message: 'Redirect to Stripe checkout',
    });

    /* Production implementation:
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      customer_email: email,
      metadata: {
        userId: userId || '',
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
    */
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
