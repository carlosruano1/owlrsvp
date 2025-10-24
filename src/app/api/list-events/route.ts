import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    // Get all events with their IDs, titles, and dates
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, admin_token, created_at, event_date')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }
    
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Unexpected error in list-events API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
