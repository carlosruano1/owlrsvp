import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset, requestPasswordResetWithTOTP } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, totpCode, method } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // If TOTP code is provided, use TOTP-based reset
    if (totpCode) {
      const result = await requestPasswordResetWithTOTP(email, totpCode)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        resetToken: result.resetToken,
        message: 'Password reset token generated. You can now reset your password.'
      })
    }

    // If email method is explicitly chosen, force email reset
    if (method === 'email') {
      const result = await requestPasswordResetForceEmail(email)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        requiresTOTP: false,
        message: 'If your email is registered, you will receive a password reset link shortly'
      })
    }

    // Otherwise, check if TOTP is enabled and use appropriate method
    const result = await requestPasswordReset(email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // If TOTP is enabled, give user choice (default to TOTP)
    if (result.requiresTOTP) {
      return NextResponse.json({
        success: true,
        totpEnabled: true,
        requiresTOTP: false, // Don't require it immediately, let user choose
        message: 'Choose how to reset your password'
      })
    }

    // Email-based reset
    return NextResponse.json({ 
      success: true,
      requiresTOTP: false,
      message: 'If your email is registered, you will receive a password reset link shortly'
    })
  } catch (error) {
    console.error('Error in forgot-password API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

