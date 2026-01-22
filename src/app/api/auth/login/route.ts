import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called')
    const body = await request.json()
    const { usernameOrEmail, password } = body

    console.log('Login attempt for:', usernameOrEmail)

    // Validation
    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 })
    }

    // Authenticate user
    console.log('Calling authenticateAdmin...')
    const result = await authenticateAdmin(usernameOrEmail, password)
    console.log('authenticateAdmin result:', { success: result.success, error: result.error })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Authentication failed' }, { status: 401 })
    }

    if (!result.session_token) {
      console.error('No session token returned from authenticateAdmin')
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: result.user,
      message: 'Login successful' 
    })

    // Set HTTP-only cookie
    response.cookies.set('admin_session', result.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    console.log('Login successful, session cookie set')
    return response
  } catch (error) {
    console.error('Error in login API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}
