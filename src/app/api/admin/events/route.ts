import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    const status = request.nextUrl.searchParams.get('status') || 'active';
    const includeArchived = status === 'archived';

    // Get session token from cookies
    const request_cookies = request.cookies;
    const sessionToken = request_cookies.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Validate session
    const { data, error: sessionError } = await supabase
      .rpc('validate_admin_session', { p_token: sessionToken });
      
    if (sessionError) {
      console.error('Session validation error:', sessionError);
      return NextResponse.json({ error: 'Invalid session: ' + sessionError.message }, { status: 401 });
    }
    
    if (!data || data.length === 0) {
      console.error('No session data returned');
      return NextResponse.json({ error: 'Invalid session: No data returned' }, { status: 401 });
    }
    
    const userId = data[0].user_id;
    console.log('Fetching events for admin user ID:', userId);

    // Use the RPC function to get user's events (including team events)
    // This returns event IDs and permissions, not full event data
    const { data: eventPermissions, error } = await supabase
      .rpc('get_user_events', { p_user_id: userId })

    let filteredEvents: Event[] = [];
    if (eventPermissions && eventPermissions.length > 0) {
      // Extract event IDs from the RPC results
      const eventIds = eventPermissions.map((ep: { id: string }) => ep.id);

      // Fetch full event data for these IDs
        const { data: fullEvents, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, title, allow_plus_guests, background_color, page_background_color,
            spotlight_color, font_color, admin_token, company_name, company_logo_url,
            info_pdf_url, open_invite, auth_mode, promo_code, promo_codes,
            contact_name, contact_email, contact_phone, event_date, event_end_time,
            event_location, required_rsvp_fields, ticket_price, currency,
            payment_required, created_at, updated_at, archived,
            created_by_admin_id, original_created_at
          `)
        .in('id', eventIds)
        .eq('archived', includeArchived)
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error fetching full event data:', eventsError);
        return NextResponse.json({ error: 'Failed to fetch event details: ' + eventsError.message }, { status: 500 });
      }

      if (fullEvents) {
        // Merge permissions from RPC results with full event data
        filteredEvents = fullEvents.map(event => {
          const permissionData = eventPermissions.find((ep: { id: string }) => ep.id === event.id);
          return {
            ...event,
            user_id: event.created_by_admin_id, // Map created_by_admin_id to user_id for interface compatibility
            permissions: permissionData?.permissions || { can_edit: true, can_view_analytics: true, can_export_data: true, can_send_communications: true }
          };
        });
      }
    }

    // Generate admin tokens for events that don't have them
    if (filteredEvents && filteredEvents.length > 0) {
      const eventsNeedingTokens = filteredEvents.filter(event => !event.admin_token);
      if (eventsNeedingTokens.length > 0) {
        console.log(`Found ${eventsNeedingTokens.length} events without admin tokens, generating them...`);

        for (const event of eventsNeedingTokens) {
          // Generate a more secure admin token
          const adminToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15) +
                           Math.random().toString(36).substring(2, 8);
          
          const { error: updateError } = await supabase
            .from('events')
            .update({ admin_token: adminToken })
            .eq('id', event.id);
            
          if (updateError) {
            console.error(`Failed to update admin token for event ${event.id}:`, updateError);
          } else {
            console.log(`Generated admin token for event ${event.id}: ${adminToken}`);
            // Update the event in our local array
            event.admin_token = adminToken;
          }
        }
      }
    }

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events: ' + error.message }, { status: 500 });
    }
    
    console.log(`Found ${filteredEvents?.length || 0} events for user ${userId}`);

    // If no events found, try to find unassociated events by admin token
    if (!filteredEvents || filteredEvents.length === 0) {
      console.log('No events found with created_by_admin_id, trying to find by admin access');
      
      // First get all event access records for this admin
      const { data: accessRecords, error: accessError } = await supabase
        .from('event_access')
        .select('event_id')
        .eq('admin_user_id', userId);
        
      if (!accessError && accessRecords && accessRecords.length > 0) {
        const eventIds = accessRecords.map(record => record.event_id);
        console.log(`Found ${eventIds.length} event access records, fetching events`);
        
        // Then fetch those events with full event data
        const { data: accessEvents, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, title, allow_plus_guests, background_color, page_background_color,
            spotlight_color, font_color, admin_token, company_name, company_logo_url,
            info_pdf_url, open_invite, auth_mode, promo_code, promo_codes,
            contact_name, contact_email, contact_phone, event_date, event_end_time,
            event_location, required_rsvp_fields, ticket_price, currency,
            payment_required, created_at, updated_at, archived,
            created_by_admin_id, original_created_at
          `)
          .in('id', eventIds)
          .eq('archived', includeArchived) // Only show non-archived events
          .order('created_at', { ascending: false });

        if (!eventsError && accessEvents && accessEvents.length > 0) {
          console.log(`Found ${accessEvents.length} events through access records`);

          // Generate admin tokens for events that don't have them
          for (const event of accessEvents) {
            if (!event.admin_token) {
              const adminToken = Math.random().toString(36).substring(2, 15) +
                               Math.random().toString(36).substring(2, 15) +
                               Math.random().toString(36).substring(2, 8);

              const { error: updateError } = await supabase
                .from('events')
                .update({ admin_token: adminToken })
                .eq('id', event.id);

              if (!updateError) {
                event.admin_token = adminToken;
              }
            }
          }

          return NextResponse.json({
            events: accessEvents.map(event => ({
              ...event,
              user_id: event.created_by_admin_id, // Map created_by_admin_id to user_id
              attendee_count: 0, // We'll skip attendee count for simplicity in this fallback
              permissions: { can_edit: false, can_view_analytics: true, can_export_data: false, can_send_communications: false }, // Limited permissions for collaborators
              access_type: 'collaborator'
            })),
            note: 'Events shown are those you have access to, but did not create'
          });
        }
      }
      
      // If still no events, try to find by contact email as a last resort
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (!adminError && adminData && adminData.email) {
        console.log(`Trying to find events with contact_email: ${adminData.email}`);
        
        const { data: emailEvents, error: emailError } = await supabase
          .from('events')
          .select(`
            id, title, allow_plus_guests, background_color, page_background_color,
            spotlight_color, font_color, admin_token, company_name, company_logo_url,
            info_pdf_url, open_invite, auth_mode, promo_code, promo_codes,
            contact_name, contact_email, contact_phone, event_date, event_end_time,
            event_location, required_rsvp_fields, ticket_price, currency,
            payment_required, created_at, updated_at, archived,
            created_by_admin_id, original_created_at
          `)
          .eq('contact_email', adminData.email)
          .eq('archived', includeArchived) // Only show non-archived events
          .order('created_at', { ascending: false });
          
        if (!emailError && emailEvents && emailEvents.length > 0) {
          console.log(`Found ${emailEvents.length} events by contact email`);
          
          // Update these events to associate them with this admin and generate admin tokens
          for (const event of emailEvents) {
            const updates: any = {};
            
            if (!event.created_by_admin_id) {
              console.log(`Updating event ${event.id} to associate with admin ${userId}`);
              updates.created_by_admin_id = userId;
            }
            
            if (!event.admin_token) {
              const adminToken = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15) +
                               Math.random().toString(36).substring(2, 8);
              updates.admin_token = adminToken;
              event.admin_token = adminToken;
            }
            
            if (Object.keys(updates).length > 0) {
              await supabase
                .from('events')
                .update(updates)
                .eq('id', event.id);
            }
          }
          
          return NextResponse.json({
            events: emailEvents.map(event => ({
              ...event,
              user_id: event.created_by_admin_id, // Map created_by_admin_id to user_id
              attendee_count: 0, // We'll skip attendee count for simplicity
              permissions: { can_edit: true, can_view_analytics: true, can_export_data: true, can_send_communications: true }, // Full permissions for auto-associated events
              auto_associated: true
            })),
            note: 'Events have been automatically associated with your account based on email'
          });
        }
      }
    }

    // Fetch attendee counts for each event
    const eventsWithAttendeeCounts = await Promise.all(
      filteredEvents.map(async (event) => {
        if (!supabase) {
          console.error('Database connection not available');
          return { ...event, attendee_count: 0 };
        }

        const { count, error: countError } = await supabase
          .from('attendees')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('attending', true);

        if (countError) {
          console.error(`Error fetching attendee count for event ${event.id}:`, countError);
        }

        return {
          ...event,
          attendee_count: count || 0,
        };
      })
    );

    return NextResponse.json({ 
      events: eventsWithAttendeeCounts,
      status: includeArchived ? 'archived' : 'active'
    });
  } catch (error) {
    console.error('Error in GET /api/admin/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

