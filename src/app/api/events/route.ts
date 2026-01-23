import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { CreateEventData } from '@/lib/types'
import { canCreateEvent, getPlanLimits } from '@/lib/plans'
import { canUseCustomBranding } from '@/lib/tierEnforcement'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured. Please set up your Supabase environment variables.' 
      }, { status: 500 })
    }

    const body: CreateEventData = await request.json()

    // Check if user has custom branding feature
    const sessionCookie = request.cookies.get('admin_session')?.value
    const canBrand = await canUseCustomBranding(sessionCookie)

    // Basic validation for logo URL if provided
    const allowedLogoExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
    if (body.company_logo_url) {
      // Check if free tier is trying to use logo
      if (!canBrand) {
        return NextResponse.json({ 
          error: 'Custom branding (logo upload) is only available on Basic, Pro, and Enterprise plans. Please upgrade to use custom logos.',
          requiresUpgrade: true,
          upgradeUrl: '/?upgrade=true&reason=branding#pricing'
        }, { status: 403 })
      }

      const url = body.company_logo_url.trim()
      const isHttp = url.startsWith('http://') || url.startsWith('https://')
      const hasAllowedExt = allowedLogoExtensions.some(ext => url.toLowerCase().includes(ext))
      if (!isHttp || !hasAllowedExt) {
        return NextResponse.json({ error: 'Invalid logo URL. Use a direct link to png, jpg, jpeg, webp, or svg.' }, { status: 400 })
      }
    }

    // Check if free tier is trying to use custom colors
    if (!canBrand && (body.page_background_color || body.spotlight_color || body.font_color || body.company_name)) {
      return NextResponse.json({ 
        error: 'Custom branding (colors, company name) is only available on Basic, Pro, and Enterprise plans. Please upgrade to customize your event appearance.',
        requiresUpgrade: true,
        upgradeUrl: '/pricing?upgrade=true&reason=branding'
      }, { status: 403 })
    }
    
    // Generate random admin token
    const adminToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15)
    
    // Check if user is authenticated
    let userId = null;
    let userTier = 'free';
    let eventsCreated = 0;
    
    if (sessionCookie) {
      try {
        // Validate the session
        const { data: sessionData } = await supabase
          .rpc('validate_admin_session', { p_token: sessionCookie });
          
        if (sessionData && sessionData.length > 0) {
          userId = sessionData[0].user_id;
          console.log('Creating event for authenticated user:', userId);
          
          // Fetch user subscription tier and subscription period
          const { data: userData, error: userError } = await supabase
            .from('admin_users')
            .select('subscription_tier, subscription_period_start, subscription_period_end')
            .eq('id', userId)
            .single();
            
          if (!userError && userData) {
            userTier = userData.subscription_tier || 'free';
            
            // For free tier: count total events (lifetime limit)
            // For paid tiers: count events created in current billing period (monthly reset)
            if (userTier === 'free') {
              // Count total events for free tier
              const { count: totalEvents } = await supabase
                .from('events')
                .select('id', { count: 'exact', head: true })
                .eq('created_by_admin_id', userId)
                .eq('archived', false);
              
              eventsCreated = totalEvents || 0;
            } else {
              // For paid tiers, count events created in current billing period
              // Use subscription_period_start if available, otherwise use start of current month
              let periodStart: Date;
              if (userData.subscription_period_start) {
                periodStart = new Date(userData.subscription_period_start);
              } else {
                // Fallback to start of current month
                const now = new Date();
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
              }
              
              const { count: periodEvents } = await supabase
                .from('events')
                .select('id', { count: 'exact', head: true })
                .eq('created_by_admin_id', userId)
                .eq('archived', false)
                .gte('created_at', periodStart.toISOString());
              
              eventsCreated = periodEvents || 0;
            }
            
            console.log(`User tier: ${userTier}, Events created this period: ${eventsCreated}`);
            
            // Check if user can create more events based on their plan
            if (!canCreateEvent(eventsCreated, userTier)) {
              const periodText = userTier === 'free' ? 'total' : 'this month';
              return NextResponse.json({ 
                error: `You've reached the maximum number of events allowed in your ${userTier} plan (${periodText}). Please upgrade to create more events.`,
                plan_limits: getPlanLimits(userTier)
              }, { status: 403 });
            }
          }
        }
      } catch (sessionError) {
        console.error('Error validating session:', sessionError);
        // Continue without user ID if session validation fails
      }
    }
    
    // Create a base event object with required fields
    const now = new Date().toISOString();
    const eventData: any = {
      title: body.title,
      allow_plus_guests: body.allow_plus_guests,
      background_color: body.background_color || '#1f2937',
      admin_token: adminToken,
      company_name: body.company_name ?? null,
      company_logo_url: body.company_logo_url ?? null,
      open_invite: body.open_invite ?? true,
      auth_mode: body.auth_mode || 'open',
      archived: false, // New events are never archived
      original_created_at: now // Track original creation date to prevent gaming
    };
    
    // Only add optional fields if they exist in the schema
    // This prevents errors if the database schema doesn't have these columns yet
    try {
      // Check if the events table structure is as expected
      const { data: columnsData, error: columnsError } = await supabase
        .from('events')
        .select()
        .limit(1);
      
      // If we can get the structure, add the optional fields
      if (!columnsError) {
        // Add fields that might not exist in all installations
        if (body.page_background_color) eventData.page_background_color = body.page_background_color;
        if (body.spotlight_color) eventData.spotlight_color = body.spotlight_color;
        if (body.font_color) eventData.font_color = body.font_color;
        if (body.event_date) eventData.event_date = body.event_date;
        if (body.event_end_time) eventData.event_end_time = body.event_end_time;
        if (body.event_location) eventData.event_location = body.event_location;
        if (body.event_location_link) eventData.event_location_link = body.event_location_link;
        // Payment fields
        if (body.ticket_price !== undefined) eventData.ticket_price = body.ticket_price || null;
        if (body.currency !== undefined) eventData.currency = body.currency || 'usd';
        if (body.payment_required !== undefined) eventData.payment_required = body.payment_required || false;
        // Only allow required_rsvp_fields for basic+ tier accounts
        if (body.required_rsvp_fields) {
          if (userTier === 'free') {
            return NextResponse.json({ 
              error: 'Additional RSVP fields (email, phone, address, guests) are only available on Basic tier and above. Please upgrade to use this feature.',
            }, { status: 403 });
          }
          eventData.required_rsvp_fields = body.required_rsvp_fields;
        }
        if (userId) eventData.created_by_admin_id = userId;
      } else {
        console.log('Could not verify table structure, using minimal fields only');
      }
    } catch (schemaError) {
      console.error('Error checking schema:', schemaError);
      // Continue with minimal fields
    }
    
    console.log('Creating event with data:', eventData);
    
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      // Surface the underlying error for easier debugging during setup
      return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ 
      event: data,
      guest_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${data.id}`,
      admin_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/a/${adminToken}`
    })
  } catch (error) {
    console.error('Error in POST /api/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
