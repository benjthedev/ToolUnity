/**
 * Stripe pricing configuration
 * Uses environment variables for security
 */

export const STRIPE_PRICES = {
  BASIC: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_1SmI9kBt1LczyCVDZeEMqvMJ',
  STANDARD: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD || 'price_1Sk7XZBt1LczyCVDOPofihFZ',
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_1Sk7YbBt1LczyCVDef9jBhUV',
};

// For server-side use
export const getStripePrices = () => {
  return {
    BASIC: process.env.STRIPE_PRICE_BASIC || process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_1SmI9kBt1LczyCVDZeEMqvMJ',
    STANDARD: process.env.STRIPE_PRICE_STANDARD || process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD || 'price_1Sk7XZBt1LczyCVDOPofihFZ',
    PRO: process.env.STRIPE_PRICE_PRO || process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_1Sk7YbBt1LczyCVDef9jBhUV',
  };
};
