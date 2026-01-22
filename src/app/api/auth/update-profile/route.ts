import { NextRequest, NextResponse } from 'next/server'
import { validateSession, sendVerificationEmail } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username } = body

    if (!email && !username) {
      return NextResponse.json({ error: 'Email or username is required' }, { status: 400 })
    }

    // Get session token from cookie
    const sessionToken = request.cookies.get('admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Validate session
    const session = await validateSession(sessionToken)
    if (!session.valid || !session.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const updates: { email?: string; username?: string; email_verified?: boolean } = {}

    // Check if email is being updated
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check if email is already taken by another user
      const { data: existingEmail } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .neq('id', session.user.user_id)
        .single()

      if (existingEmail) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 })
      }

      updates.email = email
      updates.email_verified = false // Require re-verification when email changes
    }

    // Check if username is being updated
    if (username) {
      // Validate username
      if (username.length < 3 || username.length > 50) {
        return NextResponse.json({ error: 'Username must be between 3 and 50 characters' }, { status: 400 })
      }

      // Check if username is already taken by another user
      const { data: existingUsername } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .neq('id', session.user.user_id)
        .single()

      if (existingUsername) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }

      updates.username = username
    }

    // Update user
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update(updates)
      .eq('id', session.user.user_id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // If email was updated, send verification email
    if (email) {
      // Get updated user info for email
      const { data: updatedUser } = await supabaseAdmin
        .from('admin_users')
        .select('username, email')
        .eq('id', session.user.user_id)
        .single()

      if (updatedUser) {
        const emailResult = await sendVerificationEmail(
          session.user.user_id,
          email,
          updatedUser.username
        )

        if (!emailResult.success) {
          console.error('Error sending verification email:', emailResult.error)
          // Still return success, but log the error
          // The user can use the resend verification endpoint
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: email ? 'Profile updated successfully. Please check your email to verify your new address.' : 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error in update-profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
