import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Get event by admin token
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('admin_token', params.token)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })
    }

    // Get attendees for this event
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError)
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
    }

    // Calculate totals
    const attending = attendees?.filter(a => a.attending) || []
    const notAttending = attendees?.filter(a => !a.attending) || []
    const totalAttending = attending.reduce((sum, a) => sum + 1 + a.guest_count, 0)
    const totalNotAttending = notAttending.length

    return NextResponse.json({
      event,
      attendees: attendees || [],
      stats: {
        totalAttending,
        totalNotAttending,
        totalResponses: (attendees?.length || 0)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
