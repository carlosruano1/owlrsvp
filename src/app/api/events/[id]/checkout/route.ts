import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createEventCheckoutSession } from '@/lib/stripe'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { attendeeName, attendeeEmail, quantity = 1 } = await request.json()
    const eventId = params.id

    if (!attendeeName || !attendeeEmail) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    if (!supabase || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get event with payment info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, ticket_price, currency, payment_required, user_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.payment_required || !event.ticket_price) {
      return NextResponse.json({ error: 'Payment not required for this event' }, { status: 400 })
    }

    // Get organizer's Stripe account
    if (!event.user_id) {
      return NextResponse.json({ error: 'Event organizer not found' }, { status: 400 })
    }

    const { data: organizer, error: orgError } = await supabaseAdmin
      .from('admin_users')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', event.user_id)
      .single()

    if (orgError || !organizer?.stripe_account_id) {
      return NextResponse.json({ 
        error: 'Event organizer has not set up payments. Please contact the organizer.' 
      }, { status: 400 })
    }

    if (organizer.stripe_account_status !== 'active') {
      return NextResponse.json({ 
        error: 'Event organizer\'s payment account is not yet active. Please contact the organizer.' 
      }, { status: 400 })
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Optional: Set platform fee percentage (e.g., 2.9 for 2.9% fee)
    // Set to 0 to take no fee, or use environment variable
    const platformFeePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '0')
    
    const { sessionId, url } = await createEventCheckoutSession({
      eventId: event.id,
      eventTitle: event.title,
      attendeeName,
      attendeeEmail,
      ticketPrice: event.ticket_price,
      quantity,
      currency: event.currency || 'usd',
      stripeAccountId: organizer.stripe_account_id,
      successUrl: `${baseUrl}/e/${eventId}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/e/${eventId}?payment_cancelled=true`,
      applicationFeePercent: platformFeePercent,
    })

    return NextResponse.json({ sessionId, url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session' 
    }, { status: 500 })
  }
}
