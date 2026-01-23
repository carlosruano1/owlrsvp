import { NextRequest, NextResponse } from 'next/server'
import { validateSession, sendVerificationEmail } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
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

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, email, email_verified, totp_enabled')
      .eq('id', session.user.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json({ 
        success: true,
        message: 'Email is already verified' 
      })
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.id,
      user.email,
      user.username
    )

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: emailResult.error || 'Failed to send verification email' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    })
  } catch (error) {
    console.error('Error in resend-verification API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
