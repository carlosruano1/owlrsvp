import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Fetch event and access users
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const adminToken = params.token

    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token is required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('admin_token', adminToken)
      .single()

    if (eventError) {
      console.error('Error fetching event:', eventError)
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })
    }

    // Get access users for this event
    // TODO: Re-enable when event_access_codes table is created
    // const { data: accessUsers, error: accessError } = await supabase
    //   .from('event_access_codes')
    //   .select('*')
    //   .eq('event_id', event.id)
    //   .order('created_at', { ascending: false })

    // if (accessError) {
    //   console.error('Error fetching access users:', accessError)
    //   return NextResponse.json({ error: 'Failed to fetch access users' }, { status: 500 })
    // }

    return NextResponse.json({
      event,
      access_users: [] // Temporarily return empty array
    })
  } catch (error) {
    console.error('Error in admin access API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Revoke access for a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const adminToken = params.token
    const body = await request.json()
    const { access_id } = body

    if (!adminToken || !access_id) {
      return NextResponse.json({ error: 'Admin token and access ID are required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    // Verify the admin token is valid
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('admin_token', adminToken)
      .single()

    if (eventError) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 404 })
    }

    // Delete the access code
    // TODO: Re-enable when event_access_codes table is created
    // const { error: deleteError } = await supabase
    //   .from('event_access_codes')
    //   .delete()
    //   .eq('id', access_id)
    //   .eq('event_id', event.id)

    // if (deleteError) {
    //   console.error('Error deleting access code:', deleteError)
    //   return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
    // }

    return NextResponse.json({ success: true, message: 'Feature temporarily disabled' })
  } catch (error) {
    console.error('Error in admin access API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}