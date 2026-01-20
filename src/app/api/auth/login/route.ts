import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { authenticateAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  console.log('POST /api/auth/login called')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  
  try {
    let body
    try {
      body = await request.json()
      console.log('Request body received')
    } catch (jsonError) {
      console.error('Error parsing JSON in login API:', jsonError)
      return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 })
    }

    const { usernameOrEmail, password } = body

    // Validation
    if (!usernameOrEmail || !password) {
      console.log('Missing credentials in request')
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 })
    }

    console.log('Attempting authentication for:', usernameOrEmail)

    // Authenticate user
    let result
    try {
      result = await authenticateAdmin(usernameOrEmail, password)
      console.log('authenticateAdmin returned:', result.success ? 'success' : 'failed', result.error || '')
    } catch (authError) {
      console.error('Exception in authenticateAdmin:', authError)
      console.error('Exception stack:', authError instanceof Error ? authError.stack : 'No stack')
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, { status: 500 })
    }

    if (!result) {
      console.error('authenticateAdmin returned undefined/null')
      return NextResponse.json({ error: 'Authentication service error' }, { status: 500 })
    }

    if (!result.success) {
      console.log('Authentication failed:', result.error)
      return NextResponse.json({ error: result.error || 'Authentication failed' }, { status: 401 })
    }

    if (!result.session_token) {
      console.error('No session token returned from authenticateAdmin')
      console.error('Result object:', JSON.stringify(result, null, 2))
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    console.log('Authentication successful, setting cookie')

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

    console.log('Login successful, cookie set')
    return response
  } catch (error) {
    console.error('Unexpected error in login API:', error)
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
