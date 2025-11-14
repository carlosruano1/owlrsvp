import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase';
import { canAccessAdvancedAnalytics } from '@/lib/tierEnforcement';

// Helper function to group dates by day for charts
function groupByDay(dates: string[]) {
  const grouped: Record<string, number> = {};
  
  dates.forEach(date => {
    // Get the date part only (no time)
    const day = new Date(date).toISOString().split('T')[0];
    
    if (!grouped[day]) {
      grouped[day] = 0;
    }
    
    grouped[day]++;
  });
  
  // Sort by date
  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .reduce((acc: Record<string, number>, [date, count]) => {
      acc[date] = count;
      return acc;
    }, {});
}

export async function GET(request: NextRequest) {
  try {
    // Get event ID from query params
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

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

    // Check if user has access to advanced analytics
    const canAccess = await canAccessAdvancedAnalytics(sessionToken);
    if (!canAccess) {
      return NextResponse.json({
        error: 'Advanced analytics is only available on Pro and Enterprise plans. Please upgrade to access analytics.',
        requiresUpgrade: true,
        upgradeUrl: '/?upgrade=true&reason=analytics#pricing'
      }, { status: 403 });
    }

    // Fetch event details to verify ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, created_by_admin_id, title, created_at, event_date, admin_token')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify ownership - check if user created the event or has access to it
    if (event.created_by_admin_id && event.created_by_admin_id !== userId) {
      // Check if user has access through event_access table
      const { data: accessData, error: accessError } = await supabase
        .from('event_access')
        .select('id')
        .eq('event_id', eventId)
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
      .eq('event_id', eventId);

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError);
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
    }

    // Calculate stats
    const totalInvited = attendees?.length || 0;
    const totalAttending = attendees?.filter(a => a.attending).length || 0;
    const totalDeclined = attendees?.filter(a => !a.attending).length || 0;
    const totalGuests = attendees?.reduce((sum, a) => sum + (a.attending ? a.guest_count : 0), 0) || 0;
    
    // Calculate response rate
    const responseRate = totalInvited > 0 ? 
      ((totalAttending + totalDeclined) / totalInvited) * 100 : 0;

    // Calculate number of +1s
    const plusOnes = attendees?.filter(a => a.guest_count > 0).length || 0;
    const plusOnesAverage = plusOnes > 0 ? 
      (totalGuests / plusOnes).toFixed(1) : 0;

    // Get RSVPs over time
    const responseDates = attendees?.map(a => a.updated_at) || [];
    const responsesByDay = groupByDay(responseDates);
    
    // Get most common response time (hour of day)
    const responseHours: Record<number, number> = {};
    attendees?.forEach(a => {
      const hour = new Date(a.updated_at).getHours();
      if (!responseHours[hour]) responseHours[hour] = 0;
      responseHours[hour]++;
    });

    // Most active hour
    let mostActiveHour = 0;
    let mostActiveHourCount = 0;
    Object.entries(responseHours).forEach(([hour, count]) => {
      if (count > mostActiveHourCount) {
        mostActiveHour = parseInt(hour);
        mostActiveHourCount = count;
      }
    });

    // Get geographic data if available
    const locations: Record<string, number> = {};
    attendees?.forEach(a => {
      if (a.address) {
        // Extract city or postal code - this is simplified and would need proper parsing in production
        const location = a.address.split(',').pop()?.trim() || 'Unknown';
        if (!locations[location]) locations[location] = 0;
        locations[location]++;
      }
    });

    // Predicted attendance based on current response rate
    let predictedAttendance = totalAttending;
    if (totalInvited > (totalAttending + totalDeclined)) {
      const responseRateDecimal = responseRate / 100;
      const remaining = totalInvited - (totalAttending + totalDeclined);
      const expectedAdditional = remaining * (totalAttending / (totalAttending + totalDeclined));
      predictedAttendance += Math.round(expectedAdditional);
    }

    // Calculate average response time if event_date exists
    let averageResponseTime = null;
    if (event.event_date) {
      const eventDate = new Date(event.event_date);
      const responseTimes = attendees?.map(a => {
        const responseDate = new Date(a.updated_at);
        return Math.floor((eventDate.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24)); // days
      }) || [];
      
      if (responseTimes.length > 0) {
        const sum = responseTimes.reduce((a, b) => a + b, 0);
        averageResponseTime = Math.round(sum / responseTimes.length);
      }
    }

    // Create insights based on data
    const insights = [];

    // Response rate insight
    if (responseRate < 50) {
      insights.push({
        type: 'warning',
        message: `Your response rate is low at ${responseRate.toFixed(0)}%. Consider sending reminder emails.`
      });
    } else if (responseRate > 80) {
      insights.push({
        type: 'success',
        message: `Great job! Your response rate is high at ${responseRate.toFixed(0)}%.`
      });
    }

    // Time to event insight
    if (event.event_date) {
      const now = new Date();
      const eventDate = new Date(event.event_date);
      const daysToEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysToEvent > 0 && daysToEvent < 7 && responseRate < 70) {
        insights.push({
          type: 'urgent',
          message: `Event is in ${daysToEvent} days but response rate is only ${responseRate.toFixed(0)}%. Send final reminders now.`
        });
      }
    }

    // Most active time insight
    insights.push({
      type: 'info',
      message: `Most responses come in around ${mostActiveHour}:00. Consider sending reminders at this time.`
    });

    // Return analytics data
    return NextResponse.json({
      eventId,
      eventTitle: event.title,
      eventDate: event.event_date,
      adminToken: event.admin_token,
      analytics: {
        totalInvited,
        totalAttending,
        totalDeclined,
        totalGuests,
        responseRate: responseRate.toFixed(1),
        plusOnes,
        plusOnesAverage,
        responsesByDay,
        responseHours,
        mostActiveHour,
        locations,
        predictedAttendance,
        averageResponseTime
      },
      insights
    });

  } catch (error) {
    console.error('Error in event analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

