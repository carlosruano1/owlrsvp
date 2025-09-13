import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreateRSVPData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateRSVPData = await request.json()
    
    const { data, error } = await supabase
      .from('attendees')
      .insert({
        event_id: body.event_id,
        first_name: body.first_name,
        last_name: body.last_name,
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
