import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'

// Helper to determine subscription tier from price ID
const getPlanFromPriceId = (priceId: string): string => {
  const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SSRI2Bw9m7IQubA6tAJWcq4'
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1SSRKABw9m7IQubAdsfUBPRT'
  const enterprisePriceId = process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_1SSRKqBw9m7IQubAK6MFOF1T'
  
  if (priceId === basicPriceId) return PLANS.BASIC
  if (priceId === proPriceId) return PLANS.PRO
  if (priceId === enterprisePriceId) return PLANS.ENTERPRISE
  return PLANS.FREE
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature') as string
  
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  
  let event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }
  
  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        
        // Get the Stripe customer ID from the session
        const customerId = session.customer

        if (!supabaseAdmin) {
          return NextResponse.json({ error: 'Admin database connection not available' }, { status: 500 })
        }
        
        // Find the user with this Stripe customer ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (userError) {
          console.error('Error finding user with Stripe customer ID:', userError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription) as any
        
        // Determine the plan tier based on the price ID
        const priceId = subscription.items.data[0].price.id
        const planTier = getPlanFromPriceId(priceId)
        
        // Update user's subscription information
        await supabaseAdmin
          .from('admin_users')
          .update({
            subscription_tier: planTier,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userData.id)
        
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Get the customer ID from the invoice
          const customerId = invoice.customer

          if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Admin database connection not available' }, { status: 500 })
          }
          
          // Find the user with this Stripe customer ID
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          
          if (userError) {
            console.error('Error finding user with Stripe customer ID:', userError)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
          }
          
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription) as any
          
          // Update subscription period end
          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: subscription.status,
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', userData.id)
        }
        
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        
        // Get the customer ID from the subscription
        const customerId = subscription.customer

        if (!supabaseAdmin) {
          return NextResponse.json({ error: 'Admin database connection not available' }, { status: 500 })
        }
        
        // Find the user with this Stripe customer ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (userError) {
          console.error('Error finding user with Stripe customer ID:', userError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        // Determine the plan tier based on the price ID
        const priceId = subscription.items.data[0].price.id
        const planTier = getPlanFromPriceId(priceId)
        
        // Update user's subscription information
        await supabaseAdmin
          .from('admin_users')
          .update({
            subscription_tier: planTier,
            subscription_status: subscription.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userData.id)
        
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        
        // Get the customer ID from the subscription
        const customerId = subscription.customer

        if (!supabaseAdmin) {
          return NextResponse.json({ error: 'Admin database connection not available' }, { status: 500 })
        }
        
        // Find the user with this Stripe customer ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (userError) {
          console.error('Error finding user with Stripe customer ID:', userError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        // Update user's subscription information to free tier
        await supabaseAdmin
          .from('users')
          .update({
            subscription_tier: PLANS.FREE,
            subscription_status: 'canceled',
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userData.id)
        
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
