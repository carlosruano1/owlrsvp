import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreateRSVPData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateRSVPData = await request.json()
    // Load event to check open_invite and whitelist
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, open_invite')
      .eq('id', body.event_id)
      .single()
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.open_invite) {
      // If not open invite, require email and an existing attendee match by email or name
      if (!body.email && (!body.first_name || !body.last_name)) {
        return NextResponse.json({ error: 'This event is invite-only. Please provide your email and name.' }, { status: 400 })
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

    const { data, error } = await supabase
      .from('attendees')
      .insert({
        event_id: body.event_id,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email ?? null,
        guest_count: body.guest_count,
        attending: body.attending
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating RSVP:', error)
      return NextResponse.json({ error: 'Failed to submit RSVP' }, { status: 500 })
    }

    return NextResponse.json({ attendee: data })
  } catch (error) {
    console.error('Error in POST /api/rsvp:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
