import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    const result = await resetPassword(token, newPassword)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Error in reset-password API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

