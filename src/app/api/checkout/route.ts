import { NextResponse } from 'next/server'
import { stripe, createCheckoutSession } from '@/lib/stripe'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { priceId, successUrl, cancelUrl } = await request.json()
    
    // Validate required fields
    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: { message: 'Missing required parameters' } },
        { status: 400 }
      )
    }
    
    if (!supabase || !supabaseAdmin) {
      return NextResponse.json(
        { error: { message: 'Database connection not available' } },
        { status: 500 }
      )
    }

    // Get the current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }
    
    const user = session.user
    
    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: { message: 'Error fetching user data' } },
        { status: 500 }
      )
    }
    
    let customerId = userData?.stripe_customer_id
    
    // If no customer ID exists, create a new customer in Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      
      customerId = customer.id
      
      // Save the customer ID to the user record
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }
    
    // Create a checkout session
    const { sessionId } = await createCheckoutSession({
      priceId,
      customerId,
      successUrl,
      cancelUrl,
    })
    
    return NextResponse.json({ sessionId })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: { message: 'An error occurred during checkout' } },
      { status: 500 }
    )
  }
}
