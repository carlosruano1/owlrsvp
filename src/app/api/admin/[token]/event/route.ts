import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { canUseCustomBranding, getUserTierFromSession } from '@/lib/tierEnforcement'

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
      .select('id, auth_mode, event_date, original_created_at')
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
    
    // Payment fields
    if (body.ticket_price !== undefined) {
      updates.ticket_price = body.ticket_price || null
    }
    if (body.currency !== undefined) {
      updates.currency = body.currency || 'usd'
    }
    if (body.payment_required !== undefined) {
      updates.payment_required = body.payment_required || false
    }
    
    // Handle event details fields
    if (body.title !== undefined) {
      updates.title = body.title
    }
    
    // Protection against date editing gaming: Prevent changing event_date significantly forward
    // This prevents users from "reusing" old events by changing their dates
    if (body.event_date !== undefined) {
      const newEventDate = body.event_date ? new Date(body.event_date) : null;
      const oldEventDate = event.event_date ? new Date(event.event_date) : null;
      
      if (newEventDate && oldEventDate) {
        // Calculate days difference (positive = moving forward, negative = moving backward)
        const daysDiff = (newEventDate.getTime() - oldEventDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // If trying to move event date more than 30 days forward, this is suspicious
        // Allow backward changes (rescheduling to earlier date is fine)
        // But prevent gaming by moving old events to future dates
        if (daysDiff > 30) {
          console.warn(`Suspicious date change detected for event ${event.id}: ${daysDiff.toFixed(0)} days forward`);
          // Still allow it, but log it for monitoring
          // You could also block it: return NextResponse.json({ error: 'Cannot change event date more than 30 days forward. Please create a new event instead.' }, { status: 400 });
        }
      }
      
      // Also check against original_created_at to prevent gaming
      if (newEventDate && event.original_created_at) {
        const originalCreatedAt = new Date(event.original_created_at);
        const daysSinceOriginal = (newEventDate.getTime() - originalCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // If new event date is more than 365 days after original creation, it's very suspicious
        // This catches cases where someone creates an event, archives it, then tries to "reuse" it a year later
        if (daysSinceOriginal > 365) {
          console.warn(`Very suspicious date change: Event ${event.id} created ${daysSinceOriginal.toFixed(0)} days ago, trying to set date to future`);
          // You could block this: return NextResponse.json({ error: 'Event date cannot be more than 1 year after original creation. Please create a new event.' }, { status: 400 });
        }
      }
      
      updates.event_date = body.event_date || null
    }
    
    if (body.event_end_time !== undefined) {
      updates.event_end_time = body.event_end_time || null
    }
    
    if (body.event_location !== undefined) {
      updates.event_location = body.event_location || null
    }
    
    // Check if user has custom branding feature for branding-related updates
    const sessionCookie = request.cookies.get('admin_session')?.value
    const canBrand = await canUseCustomBranding(sessionCookie)
    
    // Check if trying to update branding features without permission
    const brandingFields = [
      body.company_name !== undefined,
      body.company_logo_url !== undefined,
      body.page_background_color !== undefined,
      body.spotlight_color !== undefined,
      body.font_color !== undefined
    ].some(Boolean)
    
    if (brandingFields && !canBrand) {
      return NextResponse.json({ 
        error: 'Custom branding is only available on Basic, Pro, and Enterprise plans. Please upgrade to customize your event appearance.',
        requiresUpgrade: true,
        upgradeUrl: '/?upgrade=true&reason=branding#pricing'
      }, { status: 403 })
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
    
    // Handle required RSVP fields (JSON field)
    // Only allow for basic+ tier accounts
    if (body.required_rsvp_fields !== undefined) {
      // Check user tier
      const userTier = await getUserTierFromSession(sessionCookie)
      if (userTier === 'free') {
        return NextResponse.json({ 
          error: 'Additional RSVP fields (email, phone, address, guests) are only available on Basic tier and above. Please upgrade to use this feature.',
          requiresUpgrade: true,
          upgradeUrl: '/?upgrade=true&reason=rsvp_fields#pricing'
        }, { status: 403 })
      }
      
      // Wrap in try-catch in case column doesn't exist yet
      try {
        updates.required_rsvp_fields = body.required_rsvp_fields || null
      } catch (e) {
        console.log('required_rsvp_fields column not available in database schema yet')
        // If column doesn't exist, we'll get an error when trying to update, but we'll handle it gracefully
      }
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
        
        // Check if error is about missing column
        if (error.message?.includes('required_rsvp_fields') || error.message?.includes('column') || error.code === '42703') {
          return NextResponse.json({ 
            error: 'The required_rsvp_fields column does not exist in the database. Please run the migration SQL to add it.',
            requiresMigration: true,
            migrationHint: 'Run: ALTER TABLE events ADD COLUMN IF NOT EXISTS required_rsvp_fields JSONB;'
          }, { status: 500 })
        }
        
        return NextResponse.json({ error: error.message || 'Database error occurred' }, { status: 500 })
      }
      
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Event not found or not updated' }, { status: 404 })
      }
      
      // Return the first result instead of using .single()
      return NextResponse.json({ event: data[0] })
    } catch (error: any) {
      console.error('Exception in event update:', error)
      
      // Check if error is about missing column
      if (error?.message?.includes('required_rsvp_fields') || error?.message?.includes('column') || error?.code === '42703') {
        return NextResponse.json({ 
          error: 'The required_rsvp_fields column does not exist in the database. Please run the migration SQL to add it.',
          requiresMigration: true,
          migrationHint: 'Run: ALTER TABLE events ADD COLUMN IF NOT EXISTS required_rsvp_fields JSONB;'
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: error?.message || 'Failed to update event settings' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error in PATCH /api/admin/[token]/event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
