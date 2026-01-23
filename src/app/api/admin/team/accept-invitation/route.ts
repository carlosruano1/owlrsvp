import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 })
    }

    // Find valid invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('team_invitations')
      .select(`
        id,
        expires_at,
        used,
        team_members (
          id,
          email,
          role,
          status,
          owner_id,
          admin_users!team_members_owner_id_fkey (
            username,
            email
          )
        )
      `)
      .eq('invitation_token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 })
    }

    if (invitation.used) {
      return NextResponse.json({ error: 'Invitation has already been used' }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if user already exists with this email
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, email_verified')
      .eq('email', invitation.team_members.email)
      .single()

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.team_members.email,
        role: invitation.team_members.role,
        inviter: invitation.team_members.admin_users,
        expires_at: invitation.expires_at
      },
      user_exists: !!existingUser,
      user_verified: existingUser?.email_verified || false
    })

  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { invitation_token } = await request.json()

    if (!invitation_token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 })
    }

    // Find valid invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('team_invitations')
      .select(`
        id,
        team_member_id,
        expires_at,
        used,
        team_members (
          id,
          email,
          role,
          owner_id
        )
      `)
      .eq('invitation_token', invitation_token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 })
    }

    // Verify the accepting user matches the invited email
    if (session.user!.email !== invitation.team_members.email) {
      return NextResponse.json({ error: 'Invitation email does not match your account email' }, { status: 400 })
    }

    // Mark invitation as used
    const { error: updateInvitationError } = await supabaseAdmin
      .from('team_invitations')
      .update({ used: true })
      .eq('id', invitation.id)

    if (updateInvitationError) {
      console.error('Error updating invitation:', updateInvitationError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }

    // Activate team member
    const { error: updateMemberError } = await supabaseAdmin
      .from('team_members')
      .update({
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .eq('id', invitation.team_member_id)

    if (updateMemberError) {
      console.error('Error updating team member:', updateMemberError)
      return NextResponse.json({ error: 'Failed to activate team member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the team!',
      team_member: {
        id: invitation.team_members.id,
        email: invitation.team_members.email,
        role: invitation.team_members.role,
        joined_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in accept invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}