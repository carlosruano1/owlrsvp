import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession, checkEventAccess } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params)
  const id = params?.id?.trim()

  try {
    if (!id) {
      console.error('GET /api/events/[id] missing id', { params: context.params })
      return NextResponse.json({ error: 'Event not found', details: 'Missing event id' }, { status: 404 })
    }
    console.log('GET /api/events/[id] id:', id)

    if (!supabaseAdmin) {
      console.error('GET /api/events/[id] supabaseAdmin is null')
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
    
    // Use admin client so public invite links work regardless of RLS
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    let finalEvent = event

    if (error) {
      console.error('[events/[id]] Supabase error by id:', id, error.code, error.message, error.details)
      return NextResponse.json({
        error: 'Event not found',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }, { status: 404 })
    }

    if (!finalEvent) {
      // Fallback: find by admin_token (share link)
      const { data: eventByToken, error: tokenError } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('admin_token', id)
        .maybeSingle()

      if (tokenError) {
        console.error('[events/[id]] Supabase error by admin_token:', id, tokenError.code, tokenError.message)
        return NextResponse.json({
          error: 'Event not found',
          details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined,
        }, { status: 404 })
      }
      if (!eventByToken) {
        console.error('[events/[id]] No row for id or admin_token:', id)
        return NextResponse.json({
          error: 'Event not found',
          ...(process.env.NODE_ENV === 'development' && { requestedId: id, hint: 'Check Supabase events table has a row with id or admin_token matching this value.' }),
        }, { status: 404 })
      }
      console.log('[events/[id]] Found by admin_token:', eventByToken.id)
      finalEvent = eventByToken
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
    const creatorId = finalEvent.user_id || finalEvent.created_by_admin_id
    
    if (creatorId && supabaseAdmin) {
      try {
        const { data: creatorData, error: creatorError } = await supabaseAdmin
          .from('admin_users')
          .select('subscription_tier')
          .eq('id', creatorId)
          .single()
        
        if (creatorError) {
          console.error('[API] Error fetching creator tier for creator_id:', creatorId, 'Error:', creatorError)
          // Default to 'pro' if error - don't show ads if we can't verify
          creatorTier = 'pro'
        } else if (creatorData) {
          const rawTier = creatorData.subscription_tier
          if (rawTier) {
            creatorTier = String(rawTier).toLowerCase().trim()
            console.log('[API] Found creator tier - Raw:', rawTier, 'Normalized:', creatorTier, 'Will show ads:', creatorTier === 'free')
          } else {
            console.warn('[API] Creator data found but subscription_tier is null/undefined for creator_id:', creatorId)
            // No tier data - default to paid tier (don't show ads)
            creatorTier = 'pro'
          }
        } else {
          console.warn('[API] No creator data found for creator_id:', creatorId)
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
      // But only if we're CERTAIN there's no creator - if supabaseAdmin is unavailable, default to pro
      if (!supabaseAdmin) {
        console.warn('[API] supabaseAdmin not available, defaulting to pro tier (no ads)')
        creatorTier = 'pro'
      } else {
        console.log('[API] Event has no creator_id (user_id or created_by_admin_id), defaulting to free tier for ads')
        creatorTier = 'free'
      }
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
