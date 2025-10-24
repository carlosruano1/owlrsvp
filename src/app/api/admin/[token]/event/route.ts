import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get event by admin token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Extract token from params
  const { token } = params
  
  try {
    console.log('Getting event with token:', token)
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('admin_token', token)
      .single()
    
    if (eventError) {
      console.error('Error fetching event:', eventError)
      return NextResponse.json({ error: 'Error fetching event' }, { status: 500 })
    }
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error in GET /api/admin/[token]/event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update event settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Extract token from params
  const { token } = params
  
  try {
    const body = await request.json()
    
    console.log('Updating event with token:', token) // Debug log
    
    // Find event by admin token
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, auth_mode')
      .eq('admin_token', token)
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })
    }

    // Prepare updates - only include fields that are explicitly provided
    const updates: Record<string, any> = {}
    
    // Basic validation
    if (body.auth_mode !== undefined) {
      if (!['open', 'code', 'guest_list'].includes(body.auth_mode)) {
        return NextResponse.json({ error: 'Invalid auth_mode' }, { status: 400 })
      }
      updates.auth_mode = body.auth_mode
      // For backward compatibility
      updates.open_invite = body.auth_mode === 'open'
    }

    if (body.promo_code !== undefined) {
      updates.promo_code = body.promo_code || null
    }
    
    if (body.contact_name !== undefined) {
      updates.contact_name = body.contact_name || null
    }
    
    if (body.contact_email !== undefined) {
      updates.contact_email = body.contact_email || null
    }
    
    if (body.contact_phone !== undefined) {
      updates.contact_phone = body.contact_phone || null
    }
    
    // Handle event details fields
    if (body.title !== undefined) {
      updates.title = body.title
    }
    
    if (body.event_date !== undefined) {
      updates.event_date = body.event_date || null
    }
    
    if (body.event_location !== undefined) {
      updates.event_location = body.event_location || null
    }
    
    if (body.company_name !== undefined) {
      updates.company_name = body.company_name || null
    }
    
    if (body.company_logo_url !== undefined) {
      updates.company_logo_url = body.company_logo_url || null
    }

    // Optional field to store information PDF URL
    if (body.info_pdf_url !== undefined) {
      updates.info_pdf_url = body.info_pdf_url || null
    }
    
    // Handle color customization fields
    if (body.background_color !== undefined) {
      updates.background_color = body.background_color
    }
    
    // Handle new color fields that might not exist in the database yet
    try {
      if (body.page_background_color !== undefined) {
        updates.page_background_color = body.page_background_color
      }
      
      if (body.spotlight_color !== undefined) {
        updates.spotlight_color = body.spotlight_color
      }
      
      if (body.font_color !== undefined) {
        updates.font_color = body.font_color
      }
    } catch (e) {
      console.log('Advanced color fields not available in database schema yet')
      // These fields will be ignored if they don't exist in the database
    }
    
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    
    // Update the event
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    console.log('Updating event with ID:', event.id, 'Updates:', updates)
    
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', event.id)
        .select()
      
      if (error) {
        console.error('Error updating event:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Event not found or not updated' }, { status: 404 })
      }
      
      // Return the first result instead of using .single()
      return NextResponse.json({ event: data[0] })
    } catch (error) {
      console.error('Exception in event update:', error)
      return NextResponse.json({ error: 'Failed to update event settings' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error in PATCH /api/admin/[token]/event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
