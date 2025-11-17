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

    // ===== TRENDS DATA: Fetch previous events for comparison =====
    let trendsData = null;
    try {
      // Get all events by this user (excluding current event)
      // First try by created_by_admin_id, then by event_access
      let userEvents = null;
      let eventsError = null;
      
      // Try to get events by created_by_admin_id
      const { data: ownedEvents, error: ownedError } = await supabase
        .from('events')
        .select('id, title, created_at, event_date')
        .eq('created_by_admin_id', userId)
        .neq('id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!ownedError && ownedEvents) {
        userEvents = ownedEvents;
      } else {
        // Try to get events through event_access
        const { data: accessRecords, error: accessError } = await supabase
          .from('event_access')
          .select('event_id')
          .eq('admin_user_id', userId);

        if (!accessError && accessRecords && accessRecords.length > 0) {
          const eventIds = accessRecords.map(r => r.event_id).filter(id => id !== eventId);
          if (eventIds.length > 0) {
            const { data: accessEvents, error: accessEventsError } = await supabase
              .from('events')
              .select('id, title, created_at, event_date')
              .in('id', eventIds)
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (!accessEventsError && accessEvents) {
              userEvents = accessEvents;
            } else {
              eventsError = accessEventsError;
            }
          }
        } else {
          eventsError = accessError;
        }
      }

      if (!eventsError && userEvents && userEvents.length > 0) {
        // Get attendees for each previous event
        const eventIds = userEvents.map(e => e.id);
        const { data: allAttendees, error: allAttendeesError } = await supabase
          .from('attendees')
          .select('event_id, attending, guest_count, created_at, updated_at')
          .in('event_id', eventIds);

        if (!allAttendeesError && allAttendees) {
          // Calculate stats for each previous event
          const previousEventsStats = userEvents.map(prevEvent => {
            const prevAttendees = allAttendees.filter(a => a.event_id === prevEvent.id);
            const prevTotalInvited = prevAttendees.length;
            const prevTotalAttending = prevAttendees.filter(a => a.attending).length;
            const prevTotalGuests = prevAttendees.reduce((sum, a) => sum + (a.attending ? a.guest_count : 0), 0);
            const prevTotalAttendance = prevTotalAttending + prevTotalGuests;
            const prevResponseRate = prevTotalInvited > 0 
              ? ((prevAttendees.filter(a => a.attending || !a.attending).length) / prevTotalInvited) * 100 
              : 0;

            // Calculate average response time (days before event)
            let prevAvgResponseTime = null;
            if (prevEvent.event_date) {
              const prevEventDate = new Date(prevEvent.event_date);
              const prevResponseTimes = prevAttendees
                .map(a => {
                  const responseDate = new Date(a.updated_at);
                  return Math.floor((prevEventDate.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24));
                })
                .filter(t => t >= 0); // Only count responses before event
              
              if (prevResponseTimes.length > 0) {
                const sum = prevResponseTimes.reduce((a, b) => a + b, 0);
                prevAvgResponseTime = Math.round(sum / prevResponseTimes.length);
              }
            }

            return {
              eventId: prevEvent.id,
              title: prevEvent.title,
              created_at: prevEvent.created_at,
              event_date: prevEvent.event_date || null,
              totalInvited: prevTotalInvited,
              totalAttending: prevTotalAttending,
              totalGuests: prevTotalGuests,
              totalAttendance: prevTotalAttendance,
              responseRate: prevResponseRate,
              avgResponseTime: prevAvgResponseTime
            };
          });

          // Calculate growth metrics
          const currentTotalAttendance = totalAttending + totalGuests;
          const previousEventsAvgAttendance = previousEventsStats.length > 0
            ? previousEventsStats.reduce((sum, e) => sum + e.totalAttendance, 0) / previousEventsStats.length
            : 0;
          
          const attendanceGrowth = previousEventsAvgAttendance > 0
            ? ((currentTotalAttendance - previousEventsAvgAttendance) / previousEventsAvgAttendance) * 100
            : 0;

          const previousEventsAvgResponseRate = previousEventsStats.length > 0
            ? previousEventsStats.reduce((sum, e) => sum + e.responseRate, 0) / previousEventsStats.length
            : 0;

          const responseRateGrowth = previousEventsAvgResponseRate > 0
            ? ((responseRate - previousEventsAvgResponseRate) / previousEventsAvgResponseRate) * 100
            : 0;

          // Calculate response velocity (responses per day since event creation)
          const eventCreatedAt = new Date(event.created_at);
          const now = new Date();
          const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - eventCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
          const currentResponseVelocity = totalInvited > 0 ? (totalInvited / daysSinceCreation) : 0;

          // Calculate velocity for previous events
          const previousEventsVelocity = previousEventsStats.map(prevEvent => {
            const prevCreatedAt = new Date(prevEvent.created_at);
            const prevDaysSinceCreation = Math.max(1, Math.floor((now.getTime() - prevCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
            return prevEvent.totalInvited > 0 ? (prevEvent.totalInvited / prevDaysSinceCreation) : 0;
          });

          const avgPreviousVelocity = previousEventsVelocity.length > 0
            ? previousEventsVelocity.reduce((sum, v) => sum + v, 0) / previousEventsVelocity.length
            : 0;

          const velocityGrowth = avgPreviousVelocity > 0
            ? ((currentResponseVelocity - avgPreviousVelocity) / avgPreviousVelocity) * 100
            : 0;

          // Build trends data
          // Include all previous events (not just top 5) for comparison dropdown
          trendsData = {
            previousEvents: previousEventsStats.slice(0, 5).map(e => ({
              eventId: e.eventId,
              title: e.title,
              totalAttendance: e.totalAttendance,
              responseRate: e.responseRate,
              totalInvited: e.totalInvited,
              created_at: e.created_at
            })),
            // Full list of previous events for comparison dropdown
            allPreviousEvents: previousEventsStats.map(e => ({
              eventId: e.eventId,
              title: e.title,
              event_date: e.event_date,
              created_at: e.created_at,
              totalAttendance: e.totalAttendance,
              responseRate: e.responseRate
            })),
            growth: {
              attendanceGrowth: attendanceGrowth.toFixed(1),
              responseRateGrowth: responseRateGrowth.toFixed(1),
              velocityGrowth: velocityGrowth.toFixed(1),
              currentAttendance: currentTotalAttendance,
              avgPreviousAttendance: Math.round(previousEventsAvgAttendance),
              currentResponseRate: responseRate,
              avgPreviousResponseRate: previousEventsAvgResponseRate.toFixed(1),
              currentVelocity: currentResponseVelocity.toFixed(1),
              avgPreviousVelocity: avgPreviousVelocity.toFixed(1)
            },
            historicalData: previousEventsStats.map(e => ({
              date: e.created_at,
              attendance: e.totalAttendance,
              responseRate: e.responseRate,
              title: e.title
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          };

          // Add growth insights
          if (attendanceGrowth > 20) {
            insights.push({
              type: 'success',
              message: `🎉 Amazing! Your attendance is ${attendanceGrowth.toFixed(0)}% higher than your average. Keep it up!`
            });
          } else if (attendanceGrowth < -10) {
            insights.push({
              type: 'warning',
              message: `Your attendance is ${Math.abs(attendanceGrowth).toFixed(0)}% below your average. Consider sending more reminders.`
            });
          }
        }
      }
    } catch (trendsError) {
      console.error('Error calculating trends:', trendsError);
      // Don't fail the whole request if trends fail
    }

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
      trends: trendsData,
      insights
    });

  } catch (error) {
    console.error('Error in event analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

