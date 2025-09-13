import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreateEventData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateEventData = await request.json()
    
    // Generate random admin token
    const adminToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15)
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: body.title,
        allow_plus_guests: body.allow_plus_guests,
        background_color: body.background_color || '#1f2937',
        admin_token: adminToken
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ 
      event: data,
      guest_link: `${process.env.NEXT_PUBLIC_BASE_URL}/e/${data.id}`,
      admin_link: `${process.env.NEXT_PUBLIC_BASE_URL}/a/${adminToken}`
    })
  } catch (error) {
    console.error('Error in POST /api/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
