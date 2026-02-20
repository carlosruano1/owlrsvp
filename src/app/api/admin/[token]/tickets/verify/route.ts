import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const { code, attendeeId } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (!code && !attendeeId) {
      return NextResponse.json({ error: 'Either ticket code or attendee ID is required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get event by admin token
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, user_id, payment_required, ticket_price')
      .eq('admin_token', token)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if ticketing is enabled for this event
    if (!event.payment_required || !event.ticket_price) {
      return NextResponse.json({ error: 'Ticketing is not enabled for this event' }, { status: 403 })
    }

    // Check if creator has Pro tier for ticketing
    if (!event.user_id) {
      return NextResponse.json({ error: 'Event creator not found' }, { status: 403 })
    }

    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('subscription_tier')
      .eq('id', event.user_id)
      .single()

    const creatorTier = userData?.subscription_tier || 'free'
    const hasTicketing = ['pro', 'enterprise', 'team'].includes(creatorTier)
    if (!hasTicketing) {
      return NextResponse.json({ error: 'Ticketing requires a Pro or Enterprise plan' }, { status: 403 })
    }

    let attendeeQuery = supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event.id)

    if (code) {
      attendeeQuery = attendeeQuery.eq('ticket_code', code)
    } else if (attendeeId) {
      attendeeQuery = attendeeQuery.eq('id', attendeeId)
    }

    const { data: attendee, error: attendeeError } = await attendeeQuery.single()

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    // Check if already checked in
    if (attendee.checked_in_at) {
      return NextResponse.json({
        error: 'Attendee is already checked in',
        attendee: {
          id: attendee.id,
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          checked_in_at: attendee.checked_in_at
        }
      }, { status: 409 })
    }

    // Mark as checked in
    const { data: updatedAttendee, error: updateError } = await supabase
      .from('attendees')
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: null // Could add session-based user ID later
      })
      .eq('id', attendee.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to check in attendee:', updateError)
      return NextResponse.json({ error: 'Failed to check in attendee' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      attendee: {
        id: updatedAttendee.id,
        first_name: updatedAttendee.first_name,
        last_name: updatedAttendee.last_name,
        checked_in_at: updatedAttendee.checked_in_at
      }
    })

  } catch (error) {
    console.error('Ticket verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}