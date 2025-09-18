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

// Create attendee
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('admin_token', params.token)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })
    }

    const insert = {
      event_id: event.id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      guest_count: body.guest_count ?? 0,
      attending: body.attending ?? false
    }

    const { data, error } = await supabase.from('attendees').insert(insert).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ attendee: data })
  } catch (error) {
    console.error('Error in POST /api/admin/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update attendee
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const attendeeId = body.id as string
    if (!attendeeId) return NextResponse.json({ error: 'Missing attendee id' }, { status: 400 })

    // Optional: ensure attendee belongs to event for this token
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('admin_token', params.token)
      .single()
    if (eventError || !event) return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })

    const updates = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      guest_count: body.guest_count,
      attending: body.attending
    }

    const { data, error } = await supabase
      .from('attendees')
      .update(updates)
      .eq('id', attendeeId)
      .eq('event_id', event.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ attendee: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete attendee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing attendee id' }, { status: 400 })

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('admin_token', params.token)
      .single()
    if (eventError || !event) return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })

    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', id)
      .eq('event_id', event.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}