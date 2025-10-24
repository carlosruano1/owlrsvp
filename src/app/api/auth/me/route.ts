import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await validateSession(sessionToken)

    if (!result.valid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Error in me API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
