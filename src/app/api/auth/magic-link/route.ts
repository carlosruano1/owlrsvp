import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validation
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create magic link
    const result = await createMagicLink(email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Always return success even if email doesn't exist (for security)
    return NextResponse.json({ 
      success: true, 
      message: 'If your email is registered, you will receive a magic link shortly' 
    })
  } catch (error) {
    console.error('Error in magic link API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
