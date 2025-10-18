import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract id from params
  const { id } = params
  
  try {
    console.log('GET /api/events/[id] called with id:', id);
    
    if (!supabase) {
      console.error('Supabase client not initialized');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    // Try to find the event by ID first
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching event by ID:', error);
      
      // Try to find the event by admin_token as a fallback
      // This allows the event page to work even if the URL uses admin_token instead of id
      console.log('Trying to find event by admin_token instead...');
      const { data: eventByToken, error: tokenError } = await supabase
        .from('events')
        .select('*')
        .eq('admin_token', id)
        .single()
        
      if (tokenError || !eventByToken) {
        console.error('Event not found by admin_token either:', tokenError);
        return NextResponse.json({ 
          error: 'Event not found', 
          details: error.message 
        }, { status: 404 })
      }
      
      console.log('Found event by admin_token:', eventByToken.id);
      return NextResponse.json({ event: eventByToken })
    }

    if (!event) {
      console.error('Event query returned null');
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    console.log('Found event by ID:', event.id);
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
