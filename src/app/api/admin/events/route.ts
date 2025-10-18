import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

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
    
    // Fetch events owned by this user
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, 
        title, 
        created_at,
        admin_token,
        created_by_admin_id
      `)
      .eq('created_by_admin_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events: ' + error.message }, { status: 500 });
    }
    
    console.log(`Found ${events?.length || 0} events for user ${userId}`);
    
    // If no events found, try to find unassociated events by admin token
    if (!events || events.length === 0) {
      console.log('No events found with created_by_admin_id, trying to find by admin access');
      
      // First get all event access records for this admin
      const { data: accessRecords, error: accessError } = await supabase
        .from('event_access')
        .select('event_id')
        .eq('admin_user_id', userId);
        
      if (!accessError && accessRecords && accessRecords.length > 0) {
        const eventIds = accessRecords.map(record => record.event_id);
        console.log(`Found ${eventIds.length} event access records, fetching events`);
        
        // Then fetch those events
        const { data: accessEvents, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, 
            title, 
            created_at,
            admin_token,
            created_by_admin_id
          `)
          .in('id', eventIds)
          .order('created_at', { ascending: false });
          
        if (!eventsError && accessEvents && accessEvents.length > 0) {
          console.log(`Found ${accessEvents.length} events through access records`);
          return NextResponse.json({ 
            events: accessEvents.map(event => ({
              ...event,
              attendee_count: 0, // We'll skip attendee count for simplicity in this fallback
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
            id, 
            title, 
            created_at,
            admin_token,
            created_by_admin_id,
            contact_email
          `)
          .eq('contact_email', adminData.email)
          .order('created_at', { ascending: false });
          
        if (!emailError && emailEvents && emailEvents.length > 0) {
          console.log(`Found ${emailEvents.length} events by contact email`);
          
          // Update these events to associate them with this admin
          emailEvents.forEach(async (event) => {
            if (!event.created_by_admin_id) {
              console.log(`Updating event ${event.id} to associate with admin ${userId}`);
              await supabase
                .from('events')
                .update({ created_by_admin_id: userId })
                .eq('id', event.id);
            }
          });
          
          return NextResponse.json({ 
            events: emailEvents.map(event => ({
              ...event,
              attendee_count: 0, // We'll skip attendee count for simplicity
              auto_associated: true
            })),
            note: 'Events have been automatically associated with your account based on email'
          });
        }
      }
    }

    // Fetch attendee counts for each event
    const eventsWithAttendeeCounts = await Promise.all(
      events.map(async (event) => {
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

    return NextResponse.json({ events: eventsWithAttendeeCounts });
  } catch (error) {
    console.error('Error in GET /api/admin/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

