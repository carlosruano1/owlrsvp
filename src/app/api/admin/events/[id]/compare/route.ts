import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase';

// Get analytics data for a specific event to use in comparison
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: compareEventId } = await params;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Get session token from cookies
    const sessionToken = request.cookies.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Validate session
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_admin_session', { p_token: sessionToken });
      
    if (sessionError || !sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const userId = sessionData[0].user_id;

    // Get the event to verify ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, created_at, event_date, created_by_admin_id')
      .eq('id', compareEventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify ownership
    if (event.created_by_admin_id && event.created_by_admin_id !== userId) {
      // Check if user has access through event_access table
      const { data: accessData, error: accessError } = await supabase
        .from('event_access')
        .select('id')
        .eq('event_id', compareEventId)
        .eq('admin_user_id', userId)
        .single();
        
      if (accessError || !accessData) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Fetch all attendees for this event
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', compareEventId);

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError);
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
    }

    // Calculate stats (same logic as main analytics endpoint)
    const totalInvited = attendees?.length || 0;
    const totalAttending = attendees?.filter(a => a.attending).length || 0;
    const totalDeclined = attendees?.filter(a => !a.attending).length || 0;
    const totalGuests = attendees?.reduce((sum, a) => sum + (a.attending ? a.guest_count : 0), 0) || 0;
    const totalAttendance = totalAttending + totalGuests;
    
    const responseRate = totalInvited > 0 ? 
      ((totalAttending + totalDeclined) / totalInvited) * 100 : 0;

    // Calculate response velocity
    const eventCreatedAt = new Date(event.created_at);
    const now = new Date();
    const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - eventCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
    const responseVelocity = totalInvited > 0 ? (totalInvited / daysSinceCreation) : 0;

    // Calculate average response time if event_date exists
    let averageResponseTime = null;
    if (event.event_date) {
      const eventDate = new Date(event.event_date);
      const responseTimes = attendees?.map(a => {
        const responseDate = new Date(a.updated_at);
        return Math.floor((eventDate.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24));
      }).filter(t => t >= 0) || [];
      
      if (responseTimes.length > 0) {
        const sum = responseTimes.reduce((a, b) => a + b, 0);
        averageResponseTime = Math.round(sum / responseTimes.length);
      }
    }

    return NextResponse.json({
      eventId: compareEventId,
      eventTitle: event.title,
      eventDate: event.event_date,
      created_at: event.created_at,
      metrics: {
        totalInvited,
        totalAttending,
        totalDeclined,
        totalGuests,
        totalAttendance,
        responseRate: responseRate.toFixed(1),
        responseVelocity: responseVelocity.toFixed(1),
        averageResponseTime
      }
    });

  } catch (error) {
    console.error('Error in compare endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


