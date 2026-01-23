import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateSession, checkEventAccess } from '@/lib/auth'

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

    // Check if this is an admin request (has session cookie)
    const sessionToken = request.cookies.get('admin_session')?.value
    let isAdminRequest = false
    let userId: string | null = null

    if (sessionToken) {
      const session = await validateSession(sessionToken)
      if (session.valid) {
        isAdminRequest = true
        userId = session.user!.user_id
      }
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

    // If this is an admin request, check permissions
    if (isAdminRequest && userId) {
      const accessCheck = await checkEventAccess(userId, finalEvent.id, 'can_edit')
      if (!accessCheck.hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Check if event creator is on free tier (for ads display)
    // Only show ads if we're CERTAIN it's free tier - default to paid tier if uncertain
    let creatorTier: string | null = null
    if (finalEvent.user_id && supabaseAdmin) {
      try {
        const { data: creatorData, error: creatorError } = await supabaseAdmin
          .from('admin_users')
          .select('subscription_tier')
          .eq('id', finalEvent.user_id)
          .single()
        
        if (creatorError) {
          console.error('[API] Error fetching creator tier for user_id:', finalEvent.user_id, 'Error:', creatorError)
          // Default to 'pro' if error - don't show ads if we can't verify
          creatorTier = 'pro'
        } else if (creatorData) {
          const rawTier = creatorData.subscription_tier
          if (rawTier) {
            creatorTier = String(rawTier).toLowerCase().trim()
            console.log('[API] Found creator tier - Raw:', rawTier, 'Normalized:', creatorTier, 'Will show ads:', creatorTier === 'free')
          } else {
            console.warn('[API] Creator data found but subscription_tier is null/undefined for user_id:', finalEvent.user_id)
            // No tier data - default to paid tier (don't show ads)
            creatorTier = 'pro'
          }
        } else {
          console.warn('[API] No creator data found for user_id:', finalEvent.user_id)
          // No tier data - default to paid tier (don't show ads)
          creatorTier = 'pro'
        }
      } catch (err) {
        // If we can't get creator tier, default to paid tier (don't show ads)
        console.log('[API] Exception fetching creator tier, defaulting to paid:', err)
        creatorTier = 'pro'
      }
    } else {
      // If event has no creator (anonymous event), default to free tier for ads
      creatorTier = 'free'
    }

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
