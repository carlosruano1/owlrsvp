
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    // Verify admin token
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('admin_token', token)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })
    }

    // Get attendees
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })

    if (attendeesError) {
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
    }

    // Generate CSV
    const csvHeader = 'First Name,Last Name,Email,Phone,Address,Attending,Guest Count,Total Party Size,RSVP Date\n'
    const csvRows = (attendees || []).map(attendee => {
      const totalPartySize = attendee.attending ? 1 + attendee.guest_count : 0
      const rsvpDate = new Date(attendee.created_at).toLocaleDateString()
      return `"${attendee.first_name}","${attendee.last_name}","${attendee.email || ''}","${attendee.phone || ''}","${(attendee.address || '').replace(/"/g,'""')}","${attendee.attending ? 'Yes' : 'No'}",${attendee.guest_count},${totalPartySize},"${rsvpDate}"`
    }).join('\n')

    const csv = csvHeader + csvRows
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_rsvps.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/csv:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
