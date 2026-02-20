import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'
import { buildFreeTierUpdate } from '@/lib/stripeWebhookUtils'

// Safely convert Stripe Unix timestamp (seconds) to ISO string; Stripe can sometimes omit or send invalid values
function unixToIso(seconds: number | undefined | null): string | null {
  if (seconds == null || typeof seconds !== 'number' || !Number.isFinite(seconds)) return null
  const ms = seconds * 1000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

// Helper to determine subscription tier from price ID (env must match your Stripe Dashboard price IDs)
const getPlanFromPriceId = (priceId: string): string => {
  const raw = (priceId || '').trim()
  const basicPriceId = (process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SSRI2Bw9m7IQubA6tAJWcq4').trim()
  const proPriceId = (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1SSRKABw9m7IQubAdsfUBPRT').trim()
  const enterprisePriceId = (process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_1SSRKqBw9m7IQubAK6MFOF1T').trim()

  if (raw === basicPriceId) return PLANS.BASIC
  if (raw === proPriceId) return PLANS.PRO
  if (raw === enterprisePriceId) return PLANS.ENTERPRISE
  return PLANS.FREE
}

// Normalize Stripe customer ID (can be string or expanded object)
function normalizeCustomerId(customer: string | { id: string } | null | undefined): string | null {
  if (!customer) return null
  if (typeof customer === 'string') return customer
  return (customer as { id: string }).id || null
}

// Find admin_users row by stripe_customer_id, or fallback by Stripe customer email
async function findUserByStripeCustomer(customerId: string): Promise<{ id: string; email?: string } | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single()
  if (!error && data) return data
  // Fallback: fetch Stripe customer and look up by email (handles case where stripe_customer_id wasn't saved)
  if (!stripe) return null
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted || !('email' in customer) || !customer.email) return null
    const { data: byEmail, error: emailError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email')
      .eq('email', customer.email)
      .single()
    if (!emailError && byEmail) return byEmail
  } catch (e) {
    console.error('[webhook] Stripe customer retrieve fallback failed:', e)
  }
  return null
}

// Detect Stripe mode (test vs live) from secret key
function getStripeMode(): 'test' | 'live' | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null
  if (secretKey.startsWith('sk_live_')) return 'live'
  if (secretKey.startsWith('sk_test_')) return 'test'
  return null
}

// Get webhook secret for current mode
function getWebhookSecret(): string {
  const mode = getStripeMode()
  if (mode === 'test') {
    return process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET || ''
  }
  if (mode === 'live') {
    return process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET || ''
  }
  return process.env.STRIPE_WEBHOOK_SECRET || ''
}

// GET endpoint for webhook health check
export async function GET() {
  const mode = getStripeMode()
  const webhookSecret = getWebhookSecret()
  const hasSecret = !!webhookSecret
  
  const proPriceSet = !!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
  return NextResponse.json({
    status: 'ok',
    stripe_configured: !!stripe,
    stripe_mode: mode || 'unknown',
    webhook_secret_configured: hasSecret,
    webhook_secret_length: webhookSecret.length,
    webhook_secret_prefix: hasSecret ? webhookSecret.substring(0, 10) + '...' : 'not set',
    price_ids_configured: {
      pro: proPriceSet,
      basic: !!process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
      enterprise: !!process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    },
    endpoint: '/api/webhooks/stripe',
    note: mode === 'test'
      ? 'Using test mode. For local testing, run: stripe listen --forward-to localhost:3000/api/webhooks/stripe'
      : mode === 'live'
        ? 'Using live mode. Ensure webhook endpoint is configured in Stripe Dashboard → Developers → Webhooks'
        : 'Stripe mode could not be determined from STRIPE_SECRET_KEY',
    hint: !proPriceSet ? 'Set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID (and BASIC/ENTERPRISE) to your Stripe Dashboard price IDs or tier will stay free after payment.' : undefined,
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature') as string
  const mode = getStripeMode()
  const webhookSecret = getWebhookSecret()
  
  if (!stripe) {
    console.error('[webhook] Stripe not configured - missing STRIPE_SECRET_KEY')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  
  if (!webhookSecret) {
    console.error('[webhook] Webhook secret not configured. Mode:', mode, 'Set STRIPE_WEBHOOK_SECRET_TEST (test) or STRIPE_WEBHOOK_SECRET_LIVE (live)')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }
  
  let event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
    console.log(`[webhook] Received ${event.type} (mode: ${mode || 'unknown'})`)
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', {
      error: err.message,
      mode,
      secret_configured: !!webhookSecret,
      secret_length: webhookSecret.length,
      hint: mode === 'test' 
        ? 'For local testing, use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe'
        : 'Ensure webhook secret matches the one in Stripe Dashboard → Developers → Webhooks'
    })
    return NextResponse.json({ 
      error: 'Webhook signature verification failed',
      mode,
      hint: mode === 'test' 
        ? 'For local testing, use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe'
        : 'Check STRIPE_WEBHOOK_SECRET_LIVE matches Stripe Dashboard webhook signing secret'
    }, { status: 400 })
  }
  
  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        try {
          const session = event.data.object as any
          const customerId = normalizeCustomerId(session.customer)
          if (!customerId) {
            console.error('[webhook] checkout.session.completed: missing customer')
            return NextResponse.json({ error: 'Missing customer' }, { status: 400 })
          }
          if (!session.subscription) {
            console.error('[webhook] checkout.session.completed: missing subscription (expected for subscription mode)')
            return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
          }

          const userData = await findUserByStripeCustomer(customerId)
          if (!userData) {
            console.error('[webhook] User not found for Stripe customer:', customerId)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
          }

          let subscription: any
          try {
            subscription = await stripe.subscriptions.retrieve(session.subscription)
          } catch (subErr: any) {
            console.error('[webhook] Failed to retrieve subscription:', subErr.message, 'Subscription ID:', session.subscription)
            return NextResponse.json({ error: 'Failed to retrieve subscription' }, { status: 500 })
          }

          if (!subscription.items?.data?.[0]?.price?.id) {
            console.error('[webhook] Subscription missing price ID:', {
              subscriptionId: subscription.id,
              itemsCount: subscription.items?.data?.length || 0,
              firstItem: subscription.items?.data?.[0] || null,
            })
            return NextResponse.json({ error: 'Subscription missing price information' }, { status: 500 })
          }

          const priceId = subscription.items.data[0].price.id
          const planTier = getPlanFromPriceId(priceId)

          console.log('[webhook] checkout.session.completed:', {
            customerId,
            userId: userData.id,
            priceIdFromStripe: priceId,
            planTier,
            envProPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? `${process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID.slice(0, 15)}...` : 'not set',
          })
          if (planTier === PLANS.FREE) {
            console.warn('[webhook] Tier resolved to FREE — price ID did not match. Set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID (and BASIC/ENTERPRISE) in .env.local to your Stripe Dashboard price IDs (test mode). Restart dev server after changing .env.local.')
          }

          const periodStart = unixToIso(subscription.current_period_start)
          const periodEnd = unixToIso(subscription.current_period_end)
          const updatePayload: Record<string, unknown> = {
            subscription_tier: planTier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
          }
          if (periodStart != null) updatePayload.subscription_period_start = periodStart
          if (periodEnd != null) updatePayload.subscription_period_end = periodEnd

          const { error: updateError } = await supabaseAdmin
            .from('admin_users')
            .update(updatePayload)
            .eq('id', userData.id)

          if (updateError) {
            console.error('[webhook] Failed to update admin_users after checkout:', updateError)
            return NextResponse.json({ error: 'Database update failed', details: updateError.message }, { status: 500 })
          }
          console.log(`[webhook] ✅ Updated user ${userData.id} to tier ${planTier} (mode: ${mode})`)
        } catch (err: any) {
          console.error('[webhook] checkout.session.completed error:', {
            error: err.message,
            stack: err.stack,
            sessionId: (event.data.object as any)?.id,
          })
          return NextResponse.json({ error: 'Webhook processing failed', details: err.message }, { status: 500 })
        }
        break
      }
      
      case 'invoice.payment_succeeded':
      case 'invoice.paid':
      case 'invoice_payment.paid': {
        const invoice = event.data.object as any
        if (!invoice.subscription) break
        const customerId = normalizeCustomerId(invoice.customer)
        if (!customerId) break
        const userData = await findUserByStripeCustomer(customerId)
        if (!userData) {
          console.error('[webhook] invoice.*: user not found for customer', customerId)
          break
        }
        let subscription: any
        try {
          subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        } catch {
          break
        }
        const priceId = subscription.items?.data?.[0]?.price?.id
        const planTier = priceId ? getPlanFromPriceId(priceId) : undefined
        const periodStart = unixToIso(subscription.current_period_start)
        const periodEnd = unixToIso(subscription.current_period_end)
        const updatePayload: Record<string, unknown> = {
          subscription_status: subscription.status,
        }
        if (periodStart != null) updatePayload.subscription_period_start = periodStart
        if (periodEnd != null) updatePayload.subscription_period_end = periodEnd
        if (planTier) (updatePayload as any).subscription_tier = planTier
        const { error: updateError } = await supabaseAdmin
          .from('admin_users')
          .update(updatePayload)
          .eq('id', userData.id)
        if (updateError) console.error('[webhook] invoice.* update failed:', updateError)
        else if (planTier) console.log(`[webhook] ✅ invoice.* updated user ${userData.id} to tier ${planTier}`)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = normalizeCustomerId(subscription.customer)
        if (!customerId) break
        const userData = await findUserByStripeCustomer(customerId)
        if (!userData) {
          console.error('[webhook] customer.subscription.updated: user not found for customer', customerId)
          break
        }
        const priceId = subscription.items?.data?.[0]?.price?.id
        const planTier = priceId ? getPlanFromPriceId(priceId) : undefined
        const periodStart = unixToIso(subscription.current_period_start)
        const periodEnd = unixToIso(subscription.current_period_end)
        const updatePayload: Record<string, unknown> = {
          subscription_status: subscription.status,
        }
        if (periodStart != null) updatePayload.subscription_period_start = periodStart
        if (periodEnd != null) updatePayload.subscription_period_end = periodEnd
        if (planTier) (updatePayload as any).subscription_tier = planTier
        const { error: updateError } = await supabaseAdmin
          .from('admin_users')
          .update(updatePayload)
          .eq('id', userData.id)
        if (updateError) console.error('[webhook] customer.subscription.updated update failed:', updateError)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = normalizeCustomerId(subscription.customer)
        if (!customerId) break
        const userData = await findUserByStripeCustomer(customerId)
        if (!userData) {
          console.error('[webhook] customer.subscription.deleted: user not found for customer', customerId)
          break
        }
        const periodEnd = unixToIso(subscription.current_period_end)
        const downgradePayload: Record<string, unknown> = {
          subscription_tier: PLANS.FREE,
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }
        if (periodEnd != null) downgradePayload.subscription_period_end = periodEnd
        const { error: updateError } = await supabaseAdmin
          .from('admin_users')
          .update(downgradePayload)
          .eq('id', userData.id)
        if (updateError) console.error('[webhook] customer.subscription.deleted update failed:', updateError)
        break
      }
      
      case 'usage_record.created' as any: {
        // Handle usage record creation (for metered billing)
        console.log('Usage record created:', event.data.object)
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
