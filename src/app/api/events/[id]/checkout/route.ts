import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createEventCheckoutSession, getBaseUrl, getAccountStatus } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const paramId = params?.id?.trim()

    if (!paramId) {
      console.error('[checkout] Missing event id in params', { params: context.params })
      return NextResponse.json({ error: 'Event not found', details: 'Missing event id' }, { status: 404 })
    }

    const { attendeeName, attendeeEmail, quantity = 1 } = await request.json()

    if (!attendeeName || !attendeeEmail) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get event with payment info (use admin client to bypass RLS)
    let event: { id: string; title: string; ticket_price: number; currency: string; payment_required: boolean; user_id: string } | null = null

    const { data: eventById, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title, ticket_price, currency, payment_required, user_id')
      .eq('id', paramId)
      .maybeSingle()

    if (eventError) {
      console.error('[checkout] Event fetch by id failed:', paramId, eventError.code, eventError.message)
      return NextResponse.json({
        error: 'Event not found',
        ...(process.env.NODE_ENV === 'development' && { details: eventError.message }),
      }, { status: 404 })
    }
    if (eventById) {
      event = eventById
    }

    if (!event) {
      const { data: eventByToken, error: tokenError } = await supabaseAdmin
        .from('events')
        .select('id, title, ticket_price, currency, payment_required, user_id')
        .eq('admin_token', paramId)
        .maybeSingle()
      if (tokenError) {
        console.error('[checkout] Event fetch by admin_token failed:', paramId, tokenError.code, tokenError.message)
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      if (eventByToken) {
        event = eventByToken
      }
    }

    if (!event) {
      console.error('[checkout] No event row for id or admin_token:', paramId)
      return NextResponse.json({
        error: 'Event not found',
        ...(process.env.NODE_ENV === 'development' && { requestedId: paramId }),
      }, { status: 404 })
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
        error: 'Event organizer has not set up payments.',
        hint: 'The organizer must connect Stripe in Admin → Settings → Connect Stripe Account.',
      }, { status: 400 })
    }

    // Refresh status from Stripe (in case they just finished onboarding)
    let status = organizer.stripe_account_status
    try {
      const accountStatus = await getAccountStatus(organizer.stripe_account_id)
      status = accountStatus.status
      if (accountStatus.status !== organizer.stripe_account_status) {
        await supabaseAdmin
          .from('admin_users')
          .update({ stripe_account_status: accountStatus.status })
          .eq('id', event.user_id)
      }
    } catch (statusErr) {
      console.error('[checkout] Could not refresh Stripe account status:', statusErr)
    }

    if (status !== 'active') {
      const reason = status === 'pending' || status === 'incomplete'
        ? 'Stripe Connect onboarding is not complete. The organizer should go to Admin → Settings, open "Connect Stripe Account", and finish adding bank details and identity in Stripe.'
        : 'Payment account is not yet active.'
      return NextResponse.json({
        error: 'Event organizer\'s payment account is not yet active.',
        hint: reason,
        status,
      }, { status: 400 })
    }

    // Create checkout session
    const baseUrl = getBaseUrl()
    
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
      successUrl: `${baseUrl}/e/${event.id}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/e/${event.id}?payment_cancelled=true`,
      applicationFeePercent: platformFeePercent,
    })

    return NextResponse.json({ sessionId, url })
  } catch (error: unknown) {
    console.error('[checkout] Error:', error)
    const err = error as { message?: string; code?: string; type?: string }
    const message = err?.message || (typeof error === 'string' ? error : 'Failed to create checkout session')
    return NextResponse.json({
      error: message,
      hint: 'Check Stripe Dashboard → Connect → Accounts: ensure the connected account is fully onboarded (charges enabled). Use the same Stripe mode (test/live) as your STRIPE_SECRET_KEY.',
    }, { status: 500 })
  }
}
