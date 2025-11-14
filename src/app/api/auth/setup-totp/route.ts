import { NextRequest, NextResponse } from 'next/server'
import { setupTOTP, validateSession } from '@/lib/auth'

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

    // Setup TOTP
    const result = await setupTOTP(session.user.user_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      qrCode: result.qrCode,
      secret: process.env.NODE_ENV === 'development' ? result.secret : undefined
    })
  } catch (error) {
    console.error('Error in setup-totp API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

