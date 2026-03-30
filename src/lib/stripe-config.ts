export const priceIds = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1TGUP1FO4mZ4odVn9f6x6McS',
  yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_1TGUK5FO4mZ4odVnrxPQpJzE',
};

export function getOrigin() {
  return process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
}
