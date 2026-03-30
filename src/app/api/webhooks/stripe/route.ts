import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

function getPeriodEnd(sub: any): string | null {
  return sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing stripe-signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const stripeSubId = session.subscription;
        const stripePriceId = session.line_items?.data?.[0]?.price?.id || '';

        if (!userId || !stripeSubId) {
          console.log('Skipping checkout: missing userId or stripeSubId', { userId, stripeSubId });
          break;
        }

        const sub = await stripe.subscriptions.retrieve(stripeSubId);
        const periodEnd = getPeriodEnd(sub);

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              stripe_sub_id: stripeSubId,
              stripe_price_id: stripePriceId,
              status: 'active',
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          if (error) console.error('Update subscription error:', error);
          console.log(`Subscription updated for user ${userId}`);
        } else {
          const { error } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_sub_id: stripeSubId,
              stripe_price_id: stripePriceId,
              status: 'active',
              current_period_end: periodEnd,
            });
          if (error) console.error('Insert subscription error:', error);
          console.log(`Subscription created for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const periodEnd = getPeriodEnd(sub);
        const status = ['active', 'trialing'].includes(sub.status) ? 'active' : sub.status;

        await supabase.from('subscriptions')
          .update({ status, current_period_end: periodEnd })
          .eq('stripe_sub_id', sub.id);

        console.log(`Subscription ${sub.id} updated to ${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;

        await supabase.from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_sub_id', sub.id);

        console.log(`Subscription ${sub.id} canceled`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const stripeSubId = invoice.subscription;

        if (stripeSubId) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_sub_id', stripeSubId);

          console.log(`Payment failed for subscription ${stripeSubId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
