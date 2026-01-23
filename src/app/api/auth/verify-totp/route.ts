import { NextRequest, NextResponse } from 'next/server'
import { verifyAndEnableTOTP, validateSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'TOTP code is required' }, { status: 400 })
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

    // Verify and enable TOTP
    const result = await verifyAndEnableTOTP(session.user.user_id, token)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'TOTP enabled successfully'
    })
  } catch (error) {
    console.error('Error in verify-totp API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}