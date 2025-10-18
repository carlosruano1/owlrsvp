import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Direct RSVP API received request with body:', JSON.stringify(body, null, 2))
    
    // Basic validation
    if (!body.event_id || !body.first_name || !body.last_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: event_id, first_name, last_name' 
      }, { status: 400 })
    }
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    // First, fetch the event to check access mode and promo code
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, auth_mode, open_invite, promo_code')
      .eq('id', body.event_id)
      .single()
      
    if (eventError || !event) {
      console.error('Error fetching event:', eventError)
      return NextResponse.json({ 
        error: 'Event not found or invalid event ID', 
        details: eventError?.message || 'Unknown error'
      }, { status: 404 })
    }
    
    // Determine auth mode (fallback to open_invite for backward compatibility)
    const authMode = event.auth_mode || (event.open_invite ? 'open' : 'guest_list')
    
    // If promo code is required, validate it
    if (authMode === 'code') {
      const providedCode = body.promo_code || ''
      const eventCode = event.promo_code || ''
      
      console.log(`Validating promo code: provided "${providedCode}", expected "${eventCode}"`)
      
      if (!providedCode || providedCode.toLowerCase().trim() !== eventCode.toLowerCase().trim()) {
        return NextResponse.json({ 
          error: 'Invalid promo code. Please check and try again.',
          provided: providedCode,
          expected: eventCode
        }, { status: 403 })
      }
      
      console.log('Promo code validation passed')
    }
    
    // If guest list is required, check if the attendee is in the list
    if (authMode === 'guest_list') {
      const { data: existingAttendee, error: attendeeError } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', body.event_id)
        .eq('first_name', body.first_name)
        .eq('last_name', body.last_name)
        .single()
        
      if (attendeeError || !existingAttendee) {
        return NextResponse.json({ 
          error: 'You are not on the guest list for this event. Please contact the event organizer.',
          details: 'Guest list access required'
        }, { status: 403 })
      }
      
      console.log('Guest list validation passed')
    }
    // Check if a guest with the same email already exists for this event
    let existingAttendeeId = null
    
    if (body.email) {
      const { data: existingAttendee } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', body.event_id)
        .eq('email', body.email)
        .single()
        
      if (existingAttendee) {
        console.log('Found existing attendee with same email:', existingAttendee.id)
        existingAttendeeId = existingAttendee.id
      }
    }
    
    // If we found an existing attendee with the same email, update it
    if (existingAttendeeId) {
      const { data: updateData, error: updateError } = await supabase
        .from('attendees')
        .update({
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone || null,
          address: body.address || null,
          guest_count: body.guest_count || 0,
          attending: body.attending === undefined ? true : body.attending
        })
        .eq('id', existingAttendeeId)
        .select()
        .single()
        
      if (updateError) {
        console.error('Error updating existing RSVP:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update existing RSVP',
          details: updateError.message
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'RSVP updated successfully',
        attendee: updateData,
        updated: true
      })
    }

    // Otherwise, insert a new record
    const { data, error } = await supabase
      .from('attendees')
      .insert({
        event_id: body.event_id,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        guest_count: body.guest_count || 0,
        attending: body.attending === undefined ? true : body.attending
      })
      .select()
      
    if (error) {
      console.error('Error inserting RSVP:', error)
      
      // If it's a foreign key error, the event doesn't exist
      if (error.code === '23503') {
        return NextResponse.json({ 
          error: 'Event not found. Please check the event_id.',
          details: error.message
        }, { status: 404 })
      }
      
      // If it's a unique constraint error, the person already RSVP'd
      if (error.code === '23505') {
        // Try to update instead - this is a fallback for cases where email matching didn't work
        const { data: updateData, error: updateError } = await supabase
          .from('attendees')
          .update({
            email: body.email || null,
            phone: body.phone || null,
            address: body.address || null,
            guest_count: body.guest_count || 0,
            attending: body.attending === undefined ? true : body.attending
          })
          .eq('event_id', body.event_id)
          .eq('first_name', body.first_name)
          .eq('last_name', body.last_name)
          .select()
          
        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update existing RSVP',
            details: updateError.message
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'RSVP updated successfully',
          attendee: updateData?.[0],
          updated: true
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to submit RSVP',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RSVP submitted successfully',
      attendee: data?.[0]
    })
  } catch (error) {
    console.error('Unexpected error in direct-rsvp API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
