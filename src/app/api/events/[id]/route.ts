import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    let finalEvent = event

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
      finalEvent = eventByToken
    }

    if (!finalEvent) {
      console.error('Event query returned null');
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if event creator is on free tier (for ads display)
    // Only check the account tier, not event features
    let creatorTier = 'free'
    if (finalEvent.created_by_admin_id && supabaseAdmin) {
      try {
        const { data: creatorData } = await supabaseAdmin
          .from('admin_users')
          .select('subscription_tier')
          .eq('id', finalEvent.created_by_admin_id)
          .single()
        
        if (creatorData) {
          creatorTier = creatorData.subscription_tier || 'free'
        }
      } catch (err) {
        // If we can't get creator tier, default to free (show ads)
        console.log('Could not fetch creator tier, defaulting to free')
      }
    }
    // If event has no creator (anonymous event), default to free tier for ads

    console.log('Found event by ID:', finalEvent.id, 'Creator tier:', creatorTier);
    return NextResponse.json({ 
      event: finalEvent,
      creatorTier // Include creator tier for watermark logic
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
