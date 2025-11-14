import { NextRequest, NextResponse } from 'next/server'
import { stripe, createCheckoutSession } from '@/lib/stripe'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { priceId, successUrl, cancelUrl } = await request.json()
    
    // Validate required fields
    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: { message: 'Missing required parameters' } },
        { status: 400 }
      )
    }
    
    if (!stripe) {
      return NextResponse.json(
        { error: { message: 'Stripe not configured' } },
        { status: 500 }
      )
    }
    
    if (!supabase || !supabaseAdmin) {
      return NextResponse.json(
        { error: { message: 'Database connection not available' } },
        { status: 500 }
      )
    }

    // Get admin session from cookies
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: { message: 'Unauthorized - Please log in' } },
        { status: 401 }
      )
    }

    // Validate session
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_admin_session', { p_token: sessionToken })
      
    if (sessionError || !sessionData || sessionData.length === 0) {
      return NextResponse.json(
        { error: { message: 'Invalid session - Please log in again' } },
        { status: 401 }
      )
    }
    
    const userId = sessionData[0].user_id
    
    // Get user data from admin_users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, username, stripe_customer_id')
      .eq('id', userId)
      .single()
    
    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: { message: 'Error fetching user data' } },
        { status: 500 }
      )
    }
    
    let customerId = userData.stripe_customer_id
    
    // If no customer ID exists, create a new customer in Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email || undefined,
        metadata: {
          userId: userData.id,
          username: userData.username || '',
        },
      })
      
      customerId = customer.id
      
      // Save the customer ID to the admin_users record
      await supabaseAdmin
        .from('admin_users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.id)
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
