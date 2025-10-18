import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const result = await verifyAdminEmail(token)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully' 
    })
  } catch (error) {
    console.error('Error in verify-email API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
