import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
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
      .select('id, created_by_admin_id, archived')
      .eq('id', eventId)
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
        .eq('event_id', eventId)
        .eq('admin_user_id', userId)
        .single();
        
      if (accessError || !accessData) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get the request body to check if we're archiving or unarchiving
    const body = await request.json().catch(() => ({}));
    const shouldArchive = body.archived !== undefined ? body.archived : true;

    // Update the event's archived status
    // Note: Archived events still count toward event limits - this just hides them from the active list
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ archived: shouldArchive })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error archiving event:', updateError);
      return NextResponse.json({ error: 'Failed to archive event' }, { status: 500 });
    }

    return NextResponse.json({ 
      event: updatedEvent,
      message: shouldArchive 
        ? 'Event archived successfully. Archived events still count toward your event limit.' 
        : 'Event unarchived successfully.'
    });

  } catch (error) {
    console.error('Error in archive endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




