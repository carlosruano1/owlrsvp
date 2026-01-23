import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset, requestPasswordResetWithTOTP, requestPasswordResetForceEmail } from '@/lib/auth'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

// Test token insertion
async function testTokenInsertion() {
  try {
    const testToken = 'test-' + Date.now()
    const { error } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        token: testToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      })

    if (error) {
      console.error('[Token Test] Insert failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Token Test] Insert succeeded')
    return { success: true }
  } catch (err) {
    console.error('[Token Test] Exception:', err)
    return { success: false, error: String(err) }
  }
}

// Diagnostic endpoint for email configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'test-token') {
      console.log('[Token Test] Testing token insertion')
      const testResult = await testTokenInsertion()
      return NextResponse.json({
        success: testResult.success,
        error: testResult.error,
        message: testResult.success ? 'Token insertion test passed' : 'Token insertion test failed'
      })

    } else if (action === 'test' && searchParams.get('email')) {
      const testEmail = searchParams.get('email')!
      console.log('[Email Test] Testing email functionality with:', testEmail)

      // Generate a test password reset email
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/reset-password?token=test-token`
      const emailContent = generatePasswordResetEmail('Test User', resetUrl)

      console.log('[Email Test] Generated email content, sending test email...')
      const result = await sendEmail({
        to: testEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })

      if (!result.success) {
        console.error('[Email Test] Email sending failed:', result.error)
        return NextResponse.json({
          success: false,
          error: result.error,
          configured: !!process.env.RESEND_API_KEY
        }, { status: 500 })
      }

      console.log('[Email Test] Email sent successfully')
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        configured: !!process.env.RESEND_API_KEY,
        message: 'Test email sent successfully. Check your inbox.'
      })
    }

    // Default diagnostic info
    return NextResponse.json({
      configured: !!process.env.RESEND_API_KEY,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      environment: process.env.NODE_ENV,
      resendConfigured: !!process.env.RESEND_API_KEY,
      usage: {
        test: '/api/auth/forgot-password?action=test&email=your@email.com',
        'test-token': '/api/auth/forgot-password?action=test-token',
        diagnostic: '/api/auth/forgot-password (GET request)'
      }
    })
  } catch (error) {
    console.error('[Email Diagnostic] Exception:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      configured: !!process.env.RESEND_API_KEY
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Forgot Password API] Received POST request')
    const rawBody = await request.text()
    console.log('[Forgot Password API] Raw request text:', rawBody)

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('[Forgot Password API] JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    console.log('[Forgot Password API] Parsed request body:', body)

    const { email, totpCode, method } = body
    console.log('[Forgot Password API] Extracted email:', email, 'type:', typeof email)
    console.log('[Forgot Password API] Extracted parameters:', { email, hasTotpCode: !!totpCode, method })

    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error('[Forgot Password API] Invalid or missing email:', email)
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      console.error('[Forgot Password API] Invalid email format:', email)
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    console.log('[Forgot Password API] Using clean email:', cleanEmail)

    // If TOTP code is provided, use TOTP-based reset
    if (totpCode) {
      console.log('[Forgot Password API] Processing TOTP-based reset for:', cleanEmail)
      const result = await requestPasswordResetWithTOTP(cleanEmail, totpCode)

      if (!result.success) {
        console.error('[Forgot Password API] TOTP reset failed:', result.error)
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      console.log('[Forgot Password API] TOTP reset successful, token generated')
      return NextResponse.json({
        success: true,
        resetToken: result.resetToken,
        message: 'Password reset token generated. You can now reset your password.'
      })
    }

    // If email method is explicitly chosen, force email reset
    if (method === 'email') {
      console.log('[Forgot Password API] Processing forced email reset for:', cleanEmail)
      const result = await requestPasswordResetForceEmail(cleanEmail)

      if (!result.success) {
        console.error('[Forgot Password API] Forced email reset failed:', result.error)
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      console.log('[Forgot Password API] Forced email reset completed for:', email)
      return NextResponse.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link shortly'
      })
    }

    // Otherwise, check if TOTP is enabled and use appropriate method
    console.log('[Forgot Password API] Checking password reset options for email:', cleanEmail)
    const result = await requestPasswordReset(cleanEmail)

    if (!result.success) {
      console.error('[Forgot Password API] Password reset check failed for email:', email, 'error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log('[Forgot Password API] Password reset result for email:', cleanEmail, 'result:', { success: result.success, totpEnabled: result.totpEnabled })

    // If TOTP is enabled, give user choice (default to TOTP)
    if (result.totpEnabled) {
      console.log('[Forgot Password API] TOTP enabled for email:', cleanEmail, 'showing method choice')
      const response = {
        success: true,
        totpEnabled: true,
        message: 'Choose how to reset your password'
      }
      console.log('[Forgot Password API] Returning response:', response)
      return NextResponse.json(response)
    }

    // Email-based reset was sent
    console.log('[Forgot Password API] Email reset processed for email:', cleanEmail, 'TOTP not enabled')
    const response = {
      success: true,
      totpEnabled: false,
      message: 'If your email is registered, you will receive a password reset link shortly'
    }
    console.log('[Forgot Password API] Returning response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Forgot Password API] Exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

