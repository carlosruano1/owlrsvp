import { PLANS } from './stripe'

/**
 * Builds the payload for downgrading a user to free tier
 * Exported for testing to ensure downgrade payload stays in sync with business rules
 */
export function buildFreeTierUpdate(periodEndSeconds: number) {
  return {
    subscription_tier: PLANS.FREE,
    subscription_status: 'canceled',
    subscription_period_end: new Date(periodEndSeconds * 1000).toISOString(),
    stripe_subscription_id: null,
  }
}

