import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { CreateEventData } from '@/lib/types'
import { canCreateEvent, getPlanLimits } from '@/lib/plans'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured. Please set up your Supabase environment variables.' 
      }, { status: 500 })
    }

    const body: CreateEventData = await request.json()

    // Basic validation for logo URL if provided
    const allowedLogoExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
    if (body.company_logo_url) {
      const url = body.company_logo_url.trim()
      const isHttp = url.startsWith('http://') || url.startsWith('https://')
      const hasAllowedExt = allowedLogoExtensions.some(ext => url.toLowerCase().includes(ext))
      if (!isHttp || !hasAllowedExt) {
        return NextResponse.json({ error: 'Invalid logo URL. Use a direct link to png, jpg, jpeg, webp, or svg.' }, { status: 400 })
      }
    }
    
    // Generate random admin token
    const adminToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15)
    
    // Check if user is authenticated
    const sessionCookie = request.cookies.get('admin_session')?.value;
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
          
          // Fetch user subscription tier and events count
          const { data: userData, error: userError } = await supabase
            .from('admin_users')
            .select('subscription_tier, events_created_count')
            .eq('id', userId)
            .single();
            
          if (!userError && userData) {
            userTier = userData.subscription_tier || 'free';
            eventsCreated = userData.events_created_count || 0;
            console.log(`User tier: ${userTier}, Events created: ${eventsCreated}`);
            
            // Check if user can create more events based on their plan
            if (!canCreateEvent(eventsCreated, userTier)) {
              return NextResponse.json({ 
                error: `You've reached the maximum number of events allowed in your ${userTier} plan. Please upgrade to create more events.`,
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
    const eventData: any = {
      title: body.title,
      allow_plus_guests: body.allow_plus_guests,
      background_color: body.background_color || '#1f2937',
      admin_token: adminToken,
      company_name: body.company_name ?? null,
      company_logo_url: body.company_logo_url ?? null,
      open_invite: body.open_invite ?? true,
      auth_mode: body.auth_mode || 'open'
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
        if (body.event_location) eventData.event_location = body.event_location;
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
