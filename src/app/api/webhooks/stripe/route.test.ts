import { describe, expect, it } from 'vitest'
import { buildFreeTierUpdate } from '@/lib/stripeWebhookUtils'
import { PLANS } from '@/lib/stripe'

describe('buildFreeTierUpdate', () => {
  it('returns a free-tier downgrade payload with ISO period end', () => {
    const periodEndSeconds = 1_700_000_000

    const payload = buildFreeTierUpdate(periodEndSeconds)

    expect(payload.subscription_tier).toBe(PLANS.FREE)
    expect(payload.subscription_status).toBe('canceled')
    expect(payload.stripe_subscription_id).toBeNull()
    expect(payload.subscription_period_end).toBe(new Date(periodEndSeconds * 1000).toISOString())
  })
})


