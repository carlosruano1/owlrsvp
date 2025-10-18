import { NextRequest, NextResponse } from 'next/server'
import { validateEventAccess } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, access_code } = body

    // Validation
    if (!event_id || !access_code) {
      return NextResponse.json({ error: 'Event ID and access code are required' }, { status: 400 })
    }

    // Validate event access
    const result = await validateEventAccess(event_id, access_code)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Set event access cookie
    const response = NextResponse.json({ 
      success: true, 
      event: result.event,
      message: 'Access granted' 
    })

    // Set HTTP-only cookie for this specific event access
    response.cookies.set(`event_access_${result.event?.event_id}`, access_code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error in validate event access API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
