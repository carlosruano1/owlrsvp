import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session.valid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Parse request body
    const { team_member_email, event_id, permissions } = await request.json()

    if (!team_member_email || !event_id) {
      return NextResponse.json({ error: 'Team member email and event ID are required' }, { status: 400 })
    }

    // Validate permissions object
    const defaultPermissions = {
      can_edit: true,
      can_view_analytics: true,
      can_export_data: true,
      can_send_communications: false
    }

    const finalPermissions = { ...defaultPermissions, ...permissions }

    // Verify the user owns the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .eq('id', event_id)
      .eq('created_by_admin_id', session.user!.user_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    // Find the team member
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id, email, status')
      .eq('owner_id', session.user!.user_id)
      .eq('email', team_member_email)
      .eq('status', 'active')
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: 'Team member not found or not active' }, { status: 404 })
    }

    // Insert or update permissions
    const { data: permission, error: permissionError } = await supabaseAdmin
      .from('event_permissions')
      .upsert({
        event_id,
        team_member_id: teamMember.id,
        permissions: finalPermissions,
        granted_by: session.user!.user_id
      })
      .select()
      .single()

    if (permissionError) {
      console.error('Error setting permissions:', permissionError)
      return NextResponse.json({ error: 'Failed to set permissions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      permission: {
        event_id,
        event_title: event.title,
        team_member_email,
        permissions: finalPermissions,
        granted_at: permission.granted_at
      }
    })

  } catch (error) {
    console.error('Error in team permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate session
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session.valid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Parse request body
    const { team_member_email, event_id } = await request.json()

    if (!team_member_email || !event_id) {
      return NextResponse.json({ error: 'Team member email and event ID are required' }, { status: 400 })
    }

    // Verify the user owns the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('created_by_admin_id', session.user!.user_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    // Find the team member
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('owner_id', session.user!.user_id)
      .eq('email', team_member_email)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Remove permissions
    const { error: deleteError } = await supabaseAdmin
      .from('event_permissions')
      .delete()
      .eq('event_id', event_id)
      .eq('team_member_id', teamMember.id)

    if (deleteError) {
      console.error('Error removing permissions:', deleteError)
      return NextResponse.json({ error: 'Failed to remove permissions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions removed successfully'
    })

  } catch (error) {
    console.error('Error in team permissions delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}