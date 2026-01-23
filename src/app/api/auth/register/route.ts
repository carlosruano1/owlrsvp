import { NextRequest, NextResponse } from 'next/server'
import { createAdminUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Register API called');
    const body = await request.json()
    const { username, email, password, invitation_token } = body

    console.log('Register request received for:', email);

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: 'Username must be between 3 and 50 characters' }, { status: 400 })
    }

    // Strong password validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 })
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one lowercase letter' }, { status: 400 })
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 })
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one special character (!@#$%^&* etc.)' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Check if Supabase environment variables are configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not configured');
      return NextResponse.json({ 
        error: 'Database connection not configured. Please contact the administrator.' 
      }, { status: 500 })
    }

    // Create user and try to send verification email
    console.log('Calling createAdminUser function with email verification');
    const result = await createAdminUser(username, email, password, false)

    if (!result.success) {
      console.error('User creation failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Handle team invitation if provided
    if (invitation_token && result.success) {
      try {
        console.log('Processing team invitation for new user:', email);

        // Find and validate the invitation
        const { data: invitation, error: invitationError } = await supabaseAdmin
          .from('team_invitations')
          .select(`
            id,
            team_member_id,
            expires_at,
            used,
            team_members (
              id,
              email,
              role,
              owner_id
            )
          `)
          .eq('invitation_token', invitation_token)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (invitation && !invitationError) {
          // Mark invitation as used
          await supabaseAdmin
            .from('team_invitations')
            .update({ used: true })
            .eq('id', invitation.id)

          // Activate team member
          await supabaseAdmin
            .from('team_members')
            .update({
              status: 'active',
              joined_at: new Date().toISOString()
            })
            .eq('id', invitation.team_member_id)

          console.log('Team invitation accepted automatically for:', email);
        }
      } catch (invitationError) {
        console.error('Error processing team invitation:', invitationError);
        // Don't fail registration if invitation processing fails
      }
    }

    // Check if email was sent successfully
    // If result.error exists but success is true, it means email failed but account was created
    const emailSent = !result.error || (result.error && result.error.includes('verification email could not be sent'))

    if (emailSent && !result.error) {
      // Email sent successfully - redirect to check email
      console.log('User registered successfully, email sent:', username);
      return NextResponse.json({
        success: true,
        email_sent: true,
        invitation_processed: !!invitation_token,
        message: invitation_token
          ? 'Account created successfully and team invitation accepted! Please check your email to verify your account.'
          : 'Account created successfully. Please check your email to verify your account.'
      })
    }

    // Email failed but account created - return verification code as fallback
    console.log('User registered successfully, email failed, using code:', username);
    return NextResponse.json({
      success: true,
      email_sent: false,
      invitation_processed: !!invitation_token,
      verification_code: result.verification_code,
      message: invitation_token
        ? 'Account created successfully and team invitation accepted, but verification email could not be sent. Please use the verification code provided.'
        : 'Account created successfully, but verification email could not be sent. Please use the verification code provided.'
    })
  } catch (error) {
    console.error('Error in register API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Registration failed: ${errorMessage}. Please try again or contact support.` 
    }, { status: 500 })
  }
}
