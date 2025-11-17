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
      console.error('Stripe initialization failed. Missing STRIPE_SECRET_KEY environment variable.')
      return NextResponse.json(
        { 
          error: { 
            message: 'Stripe not configured. Please set STRIPE_SECRET_KEY in your environment variables.' 
          } 
        },
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
    
    if (!userId) {
      console.error('No user_id found in session data')
      return NextResponse.json(
        { error: { message: 'Invalid session data' } },
        { status: 401 }
      )
    }
    
    // Get user data from admin_users table
    // Note: stripe_customer_id may not exist yet - we'll handle it gracefully
    const { data: userData, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, username')
      .eq('id', userId)
      .single()
    
    if (userError) {
      console.error('Error fetching user data:', {
        error: userError,
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        userId: userId
      })
      
      // Check if user doesn't exist
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { message: 'User account not found. Please contact support.' } },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { 
          error: { 
            message: `Error fetching user data: ${userError.message || 'Database error'}` 
          } 
        },
        { status: 500 }
      )
    }
    
    if (!userData) {
      console.error('User data is null for userId:', userId)
      return NextResponse.json(
        { error: { message: 'User account not found' } },
        { status: 404 }
      )
    }
    
    // Try to get existing customer ID (if column exists)
    let customerId: string | null = null
    try {
      const { data: customerData } = await supabaseAdmin
        .from('admin_users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()
      
      customerId = customerData?.stripe_customer_id || null
    } catch (err) {
      // Column doesn't exist yet - we'll create it when saving
      console.log('stripe_customer_id column not found, will create customer and add column')
    }
    
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
      
      // Try to save the customer ID to the admin_users record
      // If column doesn't exist, this will fail but we'll handle it gracefully
      try {
        await supabaseAdmin
          .from('admin_users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userData.id)
      } catch (updateError: any) {
        // If column doesn't exist, log the error but continue
        if (updateError?.code === '42703' || updateError?.message?.includes('column') || updateError?.message?.includes('does not exist')) {
          console.error('stripe_customer_id column does not exist. Please run the migration SQL to add it.')
          console.error('Customer created in Stripe:', customerId, 'but could not save to database.')
          // Continue anyway - the checkout will work, we just can't save the customer ID yet
        } else {
          throw updateError
        }
      }
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
