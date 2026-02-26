// Stripe configuration
// Replace these with your actual Stripe keys
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// Subscription price IDs (create these in your Stripe dashboard)
export const priceIds = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly',
};

// Note: For production, use the Stripe Node.js SDK
// import Stripe from 'stripe'
// export const stripe = new Stripe(stripeConfig.secretKey)
