import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    // Get team members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select(`
        id,
        email,
        role,
        status,
        invited_at,
        joined_at,
        last_login_at,
        event_permissions (
          event_id,
          permissions,
          granted_at,
          events (
            id,
            title,
            admin_token
          )
        )
      `)
      .eq('owner_id', session.user!.user_id)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Format the response
    const formattedMembers = members.map(member => ({
      id: member.id,
      email: member.email,
      role: member.role,
      status: member.status,
      invited_at: member.invited_at,
      joined_at: member.joined_at,
      last_login_at: member.last_login_at,
      event_permissions: member.event_permissions?.map((perm: any) => ({
        event_id: perm.event_id,
        event_title: perm.events?.title,
        event_admin_token: perm.events?.admin_token,
        permissions: perm.permissions,
        granted_at: perm.granted_at
      })) || []
    }))

    return NextResponse.json({
      success: true,
      members: formattedMembers
    })

  } catch (error) {
    console.error('Error in team members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}