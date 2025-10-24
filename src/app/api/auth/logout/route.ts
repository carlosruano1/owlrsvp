import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { logoutAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value

    if (sessionToken) {
      await logoutAdmin(sessionToken)
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    
    // Clear the session cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error in logout API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
