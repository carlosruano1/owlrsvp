import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const teamMemberId = params.id

    // Verify the team member belongs to the current user
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id, email, status')
      .eq('id', teamMemberId)
      .eq('owner_id', session.user!.user_id)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Remove all event permissions for this team member
    const { error: permissionsError } = await supabaseAdmin
      .from('event_permissions')
      .delete()
      .eq('team_member_id', teamMemberId)

    if (permissionsError) {
      console.error('Error removing permissions:', permissionsError)
      // Continue with member deletion even if permissions removal fails
    }

    // Remove any pending invitations
    const { error: invitationsError } = await supabaseAdmin
      .from('team_invitations')
      .delete()
      .eq('team_member_id', teamMemberId)

    if (invitationsError) {
      console.error('Error removing invitations:', invitationsError)
      // Continue with member deletion
    }

    // Remove the team member
    const { error: deleteError } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', teamMemberId)

    if (deleteError) {
      console.error('Error removing team member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully'
    })

  } catch (error) {
    console.error('Error in team member delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}