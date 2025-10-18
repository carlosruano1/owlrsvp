import { NextRequest, NextResponse } from 'next/server'
import { createEventAccess } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, email } = body

    // Validation
    if (!event_id || !email) {
      return NextResponse.json({ error: 'Event ID and email are required' }, { status: 400 })
    }

    // Create event access
    const result = await createEventAccess(event_id, email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Access code sent to email'
    })
  } catch (error) {
    console.error('Error in event access API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
