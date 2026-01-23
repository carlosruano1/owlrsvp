import { NextRequest, NextResponse } from 'next/server'
import { disableTOTP, validateSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Test endpoint to check TOTP status
export async function GET(request: NextRequest) {
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

    // Check current TOTP status
    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('totp_enabled, totp_secret')
      .eq('id', session.user.user_id)
      .single()

    return NextResponse.json({
      user_id: session.user.user_id,
      totp_enabled: user?.totp_enabled,
      has_totp_secret: !!user?.totp_secret
    })
  } catch (error) {
    console.error('[Disable TOTP API] GET Exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('admin_session')?.value
    console.log('[Disable TOTP API] Session token present:', !!sessionToken)

    if (!sessionToken) {
      console.log('[Disable TOTP API] No session token')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Validate session
    console.log('[Disable TOTP API] Validating session...')
    const session = await validateSession(sessionToken)
    console.log('[Disable TOTP API] Session validation result:', { valid: session.valid, hasUser: !!session.user })

    if (!session.valid || !session.user) {
      console.log('[Disable TOTP API] Session validation failed')
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    console.log('[Disable TOTP API] Disabling TOTP for user:', session.user.user_id)

    // Disable TOTP
    const result = await disableTOTP(session.user.user_id)

    if (!result.success) {
      console.error('[Disable TOTP API] Disable TOTP failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log('[Disable TOTP API] TOTP disabled successfully')
    return NextResponse.json({
      success: true,
      message: 'TOTP disabled successfully'
    })
  } catch (error) {
    console.error('[Disable TOTP API] Exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}