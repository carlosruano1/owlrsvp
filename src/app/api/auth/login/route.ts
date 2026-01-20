import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usernameOrEmail, password } = body

    // Validation
    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 })
    }

    // Authenticate user
    const result = await authenticateAdmin(usernameOrEmail, password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: result.user,
      message: 'Login successful' 
    })

    // Set HTTP-only cookie
    response.cookies.set('admin_session', result.session_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error in login API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
