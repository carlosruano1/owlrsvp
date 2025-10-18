import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { CreateRSVPData } from '@/lib/types'
import { PLAN_DETAILS, PLANS, isOverGuestLimit, createUsageRecord } from '@/lib/stripe'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body: CreateRSVPData = await request.json()
    console.log('RSVP API received request with body:', JSON.stringify(body, null, 2))
    
    if (!supabase) {
      console.error('Supabase client not initialized')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    // Validate event_id format first
    if (!body.event_id || typeof body.event_id !== 'string' || body.event_id.trim() === '') {
      console.error('Invalid event ID format:', body.event_id)
      return NextResponse.json({ error: 'Invalid event ID provided' }, { status: 400 })
    }
    
    console.log('Looking up event with ID:', body.event_id)
    
    // Try to find the event by ID first
    let event = null;
    let eventError = null;
    
    try {
      // First try to find by direct ID match
      const { data: eventById, error: idError } = await supabase
        .from('events')
        .select('id, open_invite, auth_mode, promo_code, user_id')
        .eq('id', body.event_id)
        .single();
      
      if (eventById) {
        console.log('Found event by direct ID match:', eventById.id);
        event = eventById;
      } else {
        eventError = idError;
        console.log('Direct ID match failed, trying alternative approaches...');
        
        // Try to find by admin_token (in case the ID is actually an admin token)
        const { data: eventByToken, error: tokenError } = await supabase
          .from('events')
          .select('id, open_invite, auth_mode, promo_code, user_id')
          .eq('admin_token', body.event_id)
          .single();
          
        if (eventByToken) {
          console.log('Found event by admin_token:', eventByToken.id);
          event = eventByToken;
          eventError = null;
        } else {
          // Try to get all events and log them for debugging
          const { data: allEvents } = await supabase
            .from('events')
            .select('id, title')
            .limit(5);
            
          console.log('Sample events in database:', allEvents);
        }
      }
    } catch (error) {
      console.error('Error during event lookup:', error);
      eventError = error;
    }
    
    console.log('Event lookup result:', event ? 'Found' : 'Not found')
      
    if (!event) {
      console.error('Event lookup failed')
      return NextResponse.json({ 
        error: 'Event not found or invalid event ID', 
        details: eventError ? eventError.message || 'Unknown error' : 'Event not found',
        code: eventError ? eventError.code : 'NOT_FOUND'
      }, { status: 404 })
    }
    
    console.log('Found event:', event.id)

    // Check attendee limit based on subscription tier
    const { data: attendeeCount, error: countError } = await supabase
      .from('attendees')
      .select('id', { count: 'exact' })
      .eq('event_id', body.event_id)
      .eq('attending', true)
    
    if (countError) {
      console.error('Error counting attendees:', countError)
      return NextResponse.json({ error: 'Failed to check event capacity' }, { status: 500 })
    }
    
    const currentAttendeeCount = attendeeCount?.length || 0
    const totalPartySize = (body.attending ? 1 + (body.guest_count || 0) : 0)
    
    // If the event has a user_id, check their subscription tier for guest limits
    if (event.user_id) {
      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Admin database connection not available' }, { status: 500 })
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('subscription_tier, stripe_subscription_id')
        .eq('id', event.user_id)
        .single()
      
      if (userError) {
        console.error('Error fetching user subscription:', userError)
        // Default to free tier limits if we can't fetch user data
        if (currentAttendeeCount + totalPartySize > PLAN_DETAILS[PLANS.FREE].guestLimit) {
          return NextResponse.json({ 
            error: `Event is at capacity. Maximum ${PLAN_DETAILS[PLANS.FREE].guestLimit} attendees allowed. Currently ${currentAttendeeCount} people are attending.` 
          }, { status: 400 })
        }
      } else {
        const tier = userData.subscription_tier || PLANS.FREE
        const guestLimit = PLAN_DETAILS[tier as keyof typeof PLANS]?.guestLimit || PLAN_DETAILS[PLANS.FREE].guestLimit
        
        // Check if adding this RSVP would exceed the guest limit
        if (currentAttendeeCount + totalPartySize > guestLimit) {
          // If user has a paid subscription, allow overflow with metered billing
          if (tier !== PLANS.FREE && userData.stripe_subscription_id) {
            // Track the overflow for metered billing
            try {
              // Get the subscription item for metered billing
              const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id)
              const subscriptionItem = subscription.items.data.find(
                item => item.price.recurring?.usage_type === 'metered'
              )
              
              // If there's a metered subscription item, create a usage record for overflow guests
              if (subscriptionItem) {
                const overflowGuests = (currentAttendeeCount + totalPartySize) - guestLimit
                await createUsageRecord({
                  subscriptionItemId: subscriptionItem.id,
                  quantity: overflowGuests,
                })
                
                // Allow the RSVP to proceed with overflow billing
                console.log(`Allowing overflow: ${overflowGuests} guests over limit, metered billing applied`)
              } else {
                // No metered billing item found, enforce the limit
                return NextResponse.json({ 
                  error: `Event is at capacity. Maximum ${guestLimit} attendees allowed with your current plan. Currently ${currentAttendeeCount} people are attending.` 
                }, { status: 400 })
              }
            } catch (error) {
              console.error('Error processing overflow billing:', error)
              return NextResponse.json({ 
                error: `Event is at capacity. Maximum ${guestLimit} attendees allowed with your current plan. Currently ${currentAttendeeCount} people are attending.` 
              }, { status: 400 })
            }
          } else {
            // Free tier or no subscription ID, enforce the limit
            return NextResponse.json({ 
              error: `Event is at capacity. Maximum ${guestLimit} attendees allowed with the current plan. Currently ${currentAttendeeCount} people are attending. Upgrade to allow more guests.` 
            }, { status: 400 })
          }
        }
      }
    } else {
      // For events without a user_id (legacy events), use the default free tier limit
      if (currentAttendeeCount + totalPartySize > PLAN_DETAILS[PLANS.FREE].guestLimit) {
        return NextResponse.json({ 
          error: `Event is at capacity. Maximum ${PLAN_DETAILS[PLANS.FREE].guestLimit} attendees allowed. Currently ${currentAttendeeCount} people are attending.` 
        }, { status: 400 })
      }
    }

    // Determine auth mode (fallback to open_invite for backward compatibility)
    const authMode = event.auth_mode || (event.open_invite ? 'open' : 'guest_list')
    
    // Handle different auth modes
    if (authMode === 'code') {
      // Check if promo code is provided and matches
      const providedCode = body.promo_code || ''
      const eventCode = event.promo_code || ''
      
      if (!providedCode || providedCode.toLowerCase().trim() !== eventCode.toLowerCase().trim()) {
        return NextResponse.json({ error: 'Invalid promo code. Please check and try again.' }, { status: 403 })
      }
    } 
    else if (authMode === 'guest_list' || !event.open_invite) {
      // If guest list only, require email and an existing attendee match by email or name
      if (!body.email && (!body.first_name || !body.last_name)) {
        return NextResponse.json({ error: 'This event is invite-only. Please provide your email and name.' }, { status: 400 })
      }
      if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }
      
      const { data: existing } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', body.event_id)
        .or(`email.eq.${body.email || ''},and(first_name.ilike.${body.first_name || ''},last_name.ilike.${body.last_name || ''})`)
        .limit(1)
      if (!existing || existing.length === 0) {
        return NextResponse.json({ error: 'We could not find you on the guest list.' }, { status: 403 })
      }
    }

    // Use the handle_rsvp function to upsert the attendee
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    console.log('Submitting RSVP:', {
      event_id: body.event_id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      guest_count: body.guest_count,
      attending: body.attending,
      phone: body.phone,
      address: body.address
    })
    
    // Try direct insert first, falling back to RPC if available
    try {
      const { data, error } = await supabase
        .from('attendees')
        .upsert({
          event_id: body.event_id,
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email || null,
          guest_count: body.guest_count || 0,
          attending: body.attending || false,
          phone: body.phone || null,
          address: body.address || null
        }, { 
          onConflict: 'event_id,first_name,last_name',
          ignoreDuplicates: false
        })
        .select()
        
      if (error) {
        console.error('Direct upsert failed, trying RPC:', error)
        // Fall back to RPC method
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('handle_rsvp', {
            p_event_id: body.event_id,
            p_first_name: body.first_name,
            p_last_name: body.last_name,
            p_email: body.email ?? null,
            p_guest_count: body.guest_count || 0,
            p_attending: body.attending || false,
            p_phone: body.phone ?? null,
            p_address: body.address ?? null
          })
          
        if (rpcError) {
          throw rpcError
        }
        
        return NextResponse.json({ attendee: rpcData[0] || rpcData })
      }
      
      return NextResponse.json({ attendee: data[0] })
    } catch (error) {
      console.error('Error creating RSVP:', error)
      return NextResponse.json({ error: 'Failed to submit RSVP' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in POST /api/rsvp:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
