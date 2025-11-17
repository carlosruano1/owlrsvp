import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import { supabaseAdmin } from './supabase';

// Initialize Stripe with the secret key on the server side
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil', // Use the latest API version
    })
  : null;

// Initialize Stripe.js for client-side
export const getStripe = async () => {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  return stripePromise;
};

// Get or create a Stripe customer for a user
export const getOrCreateStripeCustomer = async (userId: string, email: string) => {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError);
      throw new Error('Error fetching user data');
    }
    
    let customerId = userData?.stripe_customer_id;
    
    // If no customer ID exists, create a new customer in Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });
      
      customerId = customer.id;
      
      // Save the customer ID to the user record
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
    
    return customerId;
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error);
    throw error;
  }
};

// Create a billing portal session for subscription management
export const createBillingPortalSession = async (customerId: string, returnUrl: string) => {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error;
  }
};

// Subscription plan IDs
export const PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
};

// Plan details
export const PLAN_DETAILS = {
  [PLANS.FREE]: {
    name: 'Free',
    price: 0,
    guestLimit: 25,
    features: [
      'Single event',
      'Up to 25 guests',
      'Export to CSV',
      'Basic RSVP page',
    ],
    stripePriceId: null, // No price ID for free plan
  },
  [PLANS.BASIC]: {
    name: 'Basic',
    price: 9,
    guestLimit: 200,
    features: [
      '5 events',
      'Custom branding (logo + colors)',
      'Up to 200 guests',
      'Basic analytics',
      'Export to CSV',
      'Email notifications',
      'No watermark',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SSRI2Bw9m7IQubA6tAJWcq4',
  },
  [PLANS.PRO]: {
    name: 'Pro',
    price: 29,
    guestLimit: 1000,
    features: [
      '25 events',
      'All Basic features',
      'Up to 1,000 guests',
      'Advanced analytics',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1SSRKABw9m7IQubAdsfUBPRT',
  },
  [PLANS.ENTERPRISE]: {
    name: 'Enterprise',
    price: 99,
    guestLimit: Infinity, // Unlimited
    features: [
      'Unlimited events',
      'All Pro features',
      'Unlimited guests',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_1SSRKqBw9m7IQubAK6MFOF1T',
  },
};

// Guest overflow pricing (per guest beyond plan limit)
export const OVERFLOW_PRICE_PER_GUEST = 0.05;

// Helper to format guest limit for display
export function formatGuestLimit(limit: number): string {
  if (limit === Infinity || limit >= 999999) {
    return 'Unlimited';
  }
  return limit.toLocaleString();
}

// Helper to create a checkout session
export const createCheckoutSession = async ({
  priceId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      customer_email: !customerId ? customerEmail : undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Helper to create a customer portal session
export const createCustomerPortalSession = async ({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) => {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

// Helper to create a usage record for overflow guests
export const createUsageRecord = async ({
  subscriptionItemId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
}: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
}) => {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp,
        action: 'increment',
      }
    );

    return usageRecord;
  } catch (error) {
    console.error('Error creating usage record:', error);
    throw error;
  }
};

// Helper to check if a user is over their guest limit
export const isOverGuestLimit = (plan: string, guestCount: number): boolean => {
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLANS];
  if (!planDetails) return true;
  return guestCount > planDetails.guestLimit;
};

// Helper to calculate overflow charges
export const calculateOverflowCharges = (plan: string, guestCount: number): number => {
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLANS];
  if (!planDetails) return 0;
  
  const overflowGuests = Math.max(0, guestCount - planDetails.guestLimit);
  return overflowGuests * OVERFLOW_PRICE_PER_GUEST;
};
