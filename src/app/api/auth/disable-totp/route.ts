import { NextRequest, NextResponse } from 'next/server'
import { disableTOTP, validateSession } from '@/lib/auth'

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

    // Disable TOTP
    const result = await disableTOTP(session.user.user_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'TOTP disabled successfully'
    })
  } catch (error) {
    console.error('Error in disable-totp API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

