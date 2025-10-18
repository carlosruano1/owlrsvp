import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminWithCode } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    // Validation
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 })
    }

    // Verify the code
    const result = await verifyAdminWithCode(email, code)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account verified successfully. You can now log in.' 
    })
  } catch (error) {
    console.error('Error in verify-code API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
