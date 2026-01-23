import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'
import { sendEmail, generateTeamInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

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

    // Check subscription tier
    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('subscription_tier, subscription_status')
      .eq('id', session.user!.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['pro', 'enterprise'].includes(user.subscription_tier) || user.subscription_status !== 'active') {
      return NextResponse.json({
        error: 'Team management requires an active Pro or Enterprise subscription'
      }, { status: 403 })
    }

    // Parse request body
    const { email, role = 'editor', message } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, editor, or viewer' }, { status: 400 })
    }

    // Check if email is already a team member
    const { data: existingMember } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('owner_id', session.user!.user_id)
      .eq('email', email)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'This email is already a team member' }, { status: 409 })
    }

    // Check if email is already an admin user
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAdmin) {
      return NextResponse.json({ error: 'This email is already registered as an admin user' }, { status: 409 })
    }

    // Create team member record
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        owner_id: session.user!.user_id,
        email,
        role,
        status: 'invited'
      })
      .select()
      .single()

    if (memberError) {
      console.error('Error creating team member:', memberError)
      return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation record
    const { error: invitationError } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        team_member_id: teamMember.id,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString()
      })

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      // Clean up the team member record
      await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('id', teamMember.id)

      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/team/accept-invitation?token=${invitationToken}`
    const emailContent = generateTeamInvitationEmail(
      session.user!.email, // inviter email as name placeholder
      'Event Team', // We'll use a generic name for now
      invitationUrl,
      message
    )

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (!emailResult.success) {
      console.error('Error sending invitation email:', emailResult.error)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      team_member: {
        id: teamMember.id,
        email: teamMember.email,
        role: teamMember.role,
        status: teamMember.status,
        invited_at: teamMember.invited_at
      }
    })

  } catch (error) {
    console.error('Error in team invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}