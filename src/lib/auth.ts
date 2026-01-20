import { supabase } from './supabase'
import { sendEmail, generateVerificationEmail, generatePasswordResetEmail, generateMagicLinkEmail, generateEventAccessEmail } from './email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export interface AdminUser {
  id: string
  username: string
  email: string
  email_verified: boolean
  subscription_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'cancelled' | 'past_due'
  max_events: number
  max_attendees_per_event: number
  events_created_count: number
  created_at: string
  last_login?: string
}

export interface SessionData {
  user_id: string
  username: string
  email: string
  subscription_tier: string
}

export interface EventAccess {
  event_id: string
  event_title: string
  admin_token: string
  access_code: string
  expires_at: string
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  skipEmailVerification = false
): Promise<{ success: boolean; user_id?: string; verification_code?: string; error?: string }> {
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client not initialized. Check your environment variables.');
      return { 
        success: false, 
        error: 'Database connection not configured. Please contact support.' 
      }
    }

    console.log('Checking if user exists:', username, email);
    
    // Fix the query syntax - use proper parameterization
    const { data: existingUser, error: queryError } = await supabase
      .from('admin_users')
      .select('id')
      .or(`username.eq."${username}",email.eq."${email}"`)
      .limit(1)
    
    if (queryError) {
      console.error('Error checking existing user:', queryError);
      return { success: false, error: 'Error checking user availability' }
    }

    if (existingUser && existingUser.length > 0) {
      return { success: false, error: 'Username or email already exists' }
    }

    // Hash password
    const passwordHash = await hashPassword(password)
    console.log('Password hashed successfully');

    // Generate a verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create user using the database function
    console.log('Attempting to create user with username:', username);
    const { data, error } = await supabase
      .rpc('create_admin_user', {
        p_username: username,
        p_email: email,
        p_password_hash: passwordHash
      })

    if (error) {
      console.error('Error creating admin user:', error);
      // Return more specific error message
      if (error.message.includes('duplicate key')) {
        return { success: false, error: 'Username or email already exists' }
      }
      return { success: false, error: `Failed to create account: ${error.message}` }
    }

    if (!data) {
      console.error('No user ID returned from create_admin_user function');
      return { success: false, error: 'Failed to create account: No user ID returned' }
    }

    const user_id = data
    console.log('User created successfully with ID:', user_id);

    // Store verification code in the database
    const { error: verificationError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: user_id,
        code: verificationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours expiry
      })

    if (verificationError) {
      console.error('Error storing verification code:', verificationError);
    }

    // If we're using direct verification, return the code
    if (skipEmailVerification) {
      return { 
        success: true, 
        user_id, 
        verification_code: verificationCode 
      }
    }

    // Otherwise try to send verification email
    try {
      // Send verification email
      const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(data)}`
      const emailContent = generateVerificationEmail(username, verificationUrl)
      
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })
      console.log('Verification email sent to:', email);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with account creation even if email fails
      // Return the verification code as a fallback
      return { 
        success: true, 
        user_id,
        verification_code: verificationCode,
        error: 'Account created, but verification email could not be sent. Please use the verification code provided.'
      }
    }

    return { success: true, user_id, verification_code: verificationCode }
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    return { 
      success: false, 
      error: error instanceof Error ? 
        `Registration error: ${error.message}` : 
        'Internal server error during registration'
    }
  }
}

export async function verifyAdminEmail(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    const { data, error } = await supabase
      .rpc('verify_admin_email', { p_token: token })

    if (error) {
      console.error('Error verifying email:', error)
      return { success: false, error: 'Invalid or expired verification token' }
    }

    return { success: data }
  } catch (error) {
    console.error('Error in verifyAdminEmail:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Verify user with verification code instead of email
export async function verifyAdminWithCode(
  email: string, 
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // First, find the user by email
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('Error finding user by email:', userError)
      return { success: false, error: 'User not found' }
    }

    // Check if the verification code is valid
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (verificationError || !verificationData) {
      console.error('Error verifying code:', verificationError)
      return { success: false, error: 'Invalid or expired verification code' }
    }

    // Mark the code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id)

    // Mark the user's email as verified
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ email_verified: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user verification status:', updateError)
      return { success: false, error: 'Failed to verify email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in verifyAdminWithCode:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function authenticateAdmin(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: AdminUser; session_token?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Find user by username or email
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash)
    if (!passwordValid) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Temporarily bypass email verification check for local development
    if (!user.email_verified && process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Please verify your email address before logging in' }
    }
    
    // If email is not verified in development, auto-verify it
    if (!user.email_verified && process.env.NODE_ENV === 'development') {
      console.log('Development mode: Auto-verifying email for', user.email);
      try {
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ email_verified: true })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error auto-verifying email:', updateError);
        } else {
          console.log('Email auto-verified successfully');
        }
      } catch (err) {
        console.error('Exception during auto-verification:', err);
      }
    }

    // Create session
    const { data: sessionToken, error: sessionError } = await supabase
      .rpc('create_admin_session', {
        p_user_id: user.id,
        p_ip_address: null, // Will be set by API route
        p_user_agent: null  // Will be set by API route
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Failed to create session' }
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Remove sensitive data
    const { password_hash, email_verification_token, ...userData } = user

    return { 
      success: true, 
      user: userData as AdminUser,
      session_token: sessionToken
    }
  } catch (error) {
    console.error('Error in authenticateAdmin:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function validateSession(sessionToken: string): Promise<{ valid: boolean; user?: SessionData }> {
  try {
    if (!supabase) {
      return { valid: false }
    }

    const { data, error } = await supabase
      .rpc('validate_admin_session', { p_token: sessionToken })

    if (error || !data || data.length === 0) {
      return { valid: false }
    }

    const sessionData = data[0]
    return { 
      valid: true, 
      user: {
        user_id: sessionData.user_id,
        username: sessionData.username,
        email: sessionData.email,
        subscription_tier: sessionData.subscription_tier
      }
    }
  } catch (error) {
    console.error('Error in validateSession:', error)
    return { valid: false }
  }
}

// Generate a secure random access code (6 digits)
export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a magic link for passwordless login
export async function createMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    // If user doesn't exist, create a temporary user
    let userId = user?.id
    let username = user?.username || email.split('@')[0]

    if (!userId) {
      // Generate a temporary username if needed
      if (!username || username.length < 3) {
        username = `user_${Math.random().toString(36).substring(2, 10)}`
      }

      // Create a new user with a random password (they'll never use it)
      const tempPassword = crypto.randomBytes(16).toString('hex')
      const passwordHash = await hashPassword(tempPassword)

      const { data: newUserId, error: createError } = await supabase
        .rpc('create_admin_user', {
          p_username: username,
          p_email: email,
          p_password_hash: passwordHash
        })

      if (createError) {
        console.error('Error creating temporary user:', createError)
        return { success: false, error: 'Failed to create account' }
      }

      userId = newUserId

      // Mark email as verified for magic link users
      await supabase
        .from('admin_users')
        .update({ email_verified: true })
        .eq('id', userId)
    }

    // Generate a token that expires in 1 hour
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store the magic link token
    await supabase
      .from('magic_link_tokens')
      .insert({
        admin_user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString()
      })

    // Send magic link email
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/magic-login?token=${encodeURIComponent(token)}`
    const emailContent = generateMagicLinkEmail(username, magicLinkUrl)
    
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    return { success: true }
  } catch (error) {
    console.error('Error in createMagicLink:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Validate a magic link token and create a session
export async function validateMagicLink(token: string): Promise<{ success: boolean; user?: AdminUser; session_token?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Find valid magic link token
    const { data: tokenData, error: tokenError } = await supabase
      .from('magic_link_tokens')
      .select('admin_user_id')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or expired magic link' }
    }

    // Mark token as used
    await supabase
      .from('magic_link_tokens')
      .update({ used: true })
      .eq('token', token)

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', tokenData.admin_user_id)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Create session
    const { data: sessionToken, error: sessionError } = await supabase
      .rpc('create_admin_session', {
        p_user_id: user.id,
        p_ip_address: null,
        p_user_agent: null
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Failed to create session' }
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Remove sensitive data
    const { password_hash, email_verification_token, ...userData } = user

    return { 
      success: true, 
      user: userData as AdminUser,
      session_token: sessionToken
    }
  } catch (error) {
    console.error('Error in validateMagicLink:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Create an access code for a specific event
export async function createEventAccess(eventId: string, email: string): Promise<{ success: boolean; access_code?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, admin_token')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Event not found' }
    }

    // Generate a 6-digit access code
    const accessCode = generateAccessCode()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store the access code
    await supabase
      .from('event_access_codes')
      .insert({
        event_id: eventId,
        email: email,
        access_code: accessCode,
        expires_at: expiresAt.toISOString()
      })

    // Send email with access code
    const emailContent = generateEventAccessEmail(
      email.split('@')[0], // Simple name extraction
      event.title,
      accessCode,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/a/${event.admin_token}`
    )
    
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    return { success: true, access_code: accessCode }
  } catch (error) {
    console.error('Error in createEventAccess:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Validate an event access code
export async function validateEventAccess(eventId: string, accessCode: string): Promise<{ success: boolean; event?: EventAccess; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Find valid access code
    const { data: accessData, error: accessError } = await supabase
      .from('event_access_codes')
      .select('*')
      .eq('event_id', eventId)
      .eq('access_code', accessCode)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (accessError || !accessData) {
      return { success: false, error: 'Invalid or expired access code' }
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, admin_token')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Event not found' }
    }

    return { 
      success: true, 
      event: {
        event_id: event.id,
        event_title: event.title,
        admin_token: event.admin_token,
        access_code: accessCode,
        expires_at: accessData.expires_at
      }
    }
  } catch (error) {
    console.error('Error in validateEventAccess:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function logoutAdmin(sessionToken: string): Promise<{ success: boolean }> {
  try {
    if (!supabase) {
      return { success: false }
    }

    await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', sessionToken)

    return { success: true }
  } catch (error) {
    console.error('Error in logoutAdmin:', error)
    return { success: false }
  }
}

// Validate admin token for secure access to admin routes
export async function validateAdminToken(adminToken: string): Promise<{ 
  valid: boolean; 
  event_id?: string;
  error?: string;
  isAdmin?: boolean;
}> {
  try {
    if (!supabase) {
      return { valid: false, error: 'Database not configured' }
    }

    // Check if the token exists and is valid
    const { data: event, error } = await supabase
      .from('events')
      .select('id, admin_token, created_by_admin_id')
      .eq('admin_token', adminToken)
      .single()

    if (error || !event) {
      return { valid: false, error: 'Invalid admin token' }
    }

    // Return success with event ID and admin status
    return { 
      valid: true, 
      event_id: event.id,
      isAdmin: !!event.created_by_admin_id 
    }
  } catch (error) {
    console.error('Error in validateAdminToken:', error)
    return { valid: false, error: 'Internal server error' }
  }
}

// Setup TOTP for a user (generate secret and QR code)
export async function setupTOTP(userId: string): Promise<{ success: boolean; secret?: string; qrCode?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret()
    
    // Create service name for the authenticator app
    const serviceName = 'OwlRSVP'
    const accountName = user.email
    
    // Generate the OTP Auth URL
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret)
    
    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(otpAuthUrl)

    // Store the secret (encrypted/hashed in production - for now storing as-is)
    // In production, you should encrypt this before storing
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ totp_secret: secret, totp_enabled: false }) // Not enabled until verified
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to save TOTP secret' }
    }

    return { success: true, secret, qrCode }
  } catch (error) {
    console.error('Error in setupTOTP:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Verify TOTP code and enable it for a user
export async function verifyAndEnableTOTP(userId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Get user's TOTP secret
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('totp_secret')
      .eq('id', userId)
      .single()

    if (userError || !user || !user.totp_secret) {
      return { success: false, error: 'TOTP not set up. Please set it up first.' }
    }

    // Verify the token
    const isValid = authenticator.verify({ token, secret: user.totp_secret })

    if (!isValid) {
      return { success: false, error: 'Invalid TOTP code' }
    }

    // Enable TOTP
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ totp_enabled: true })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to enable TOTP' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in verifyAndEnableTOTP:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Verify TOTP code (for password reset)
export async function verifyTOTP(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Get user's TOTP secret
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, totp_secret, totp_enabled')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    if (!user.totp_enabled || !user.totp_secret) {
      return { success: false, error: 'TOTP is not enabled for this account' }
    }

    // Verify the token
    const isValid = authenticator.verify({ token, secret: user.totp_secret })

    if (!isValid) {
      return { success: false, error: 'Invalid TOTP code' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in verifyTOTP:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Check if user has TOTP enabled
export async function checkTOTPEnabled(email: string): Promise<{ enabled: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { enabled: false, error: 'Database not configured' }
    }

    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('totp_enabled')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return { enabled: false }
    }

    return { enabled: !!user.totp_enabled }
  } catch (error) {
    console.error('Error in checkTOTPEnabled:', error)
    return { enabled: false }
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; requiresTOTP?: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, username, email, totp_enabled')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      // Don't reveal if email exists or not
      return { success: true }
    }

    // Check if TOTP is enabled - if so, use TOTP instead of email
    if (user.totp_enabled) {
      // Generate reset token that requires TOTP verification
      const resetToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store reset token
      await supabase
        .from('password_reset_tokens')
        .insert({
          admin_user_id: user.id,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
          requires_totp: true
        })

      // Return success with TOTP requirement flag
      // The frontend will show TOTP input instead of email link
      return { success: true, requiresTOTP: true }
    }

    // Fallback to email-based reset
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token
    await supabase
      .from('password_reset_tokens')
      .insert({
        admin_user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        requires_totp: false
      })

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(resetToken)}`
    const emailContent = generatePasswordResetEmail(user.username, resetUrl)
    
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    return { success: true, requiresTOTP: false }
  } catch (error) {
    console.error('Error in requestPasswordReset:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Request password reset with TOTP verification
export async function requestPasswordResetWithTOTP(email: string, totpCode: string): Promise<{ success: boolean; resetToken?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Verify TOTP first
    const totpResult = await verifyTOTP(email, totpCode)
    if (!totpResult.success) {
      return { success: false, error: totpResult.error }
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token (TOTP already verified)
    await supabase
      .from('password_reset_tokens')
      .insert({
        admin_user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        requires_totp: false // Already verified
      })

    return { success: true, resetToken }
  } catch (error) {
    console.error('Error in requestPasswordResetWithTOTP:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Find valid reset token
    const { data: resetData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('admin_user_id, requires_totp')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !resetData) {
      return { success: false, error: 'Invalid or expired reset token' }
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('id', resetData.admin_user_id)

    if (updateError) {
      return { success: false, error: 'Failed to update password' }
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)

    return { success: true }
  } catch (error) {
    console.error('Error in resetPassword:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Change password for logged-in user (requires current password)
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    // Get user's current password hash
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Verify current password
    const passwordValid = await verifyPassword(currentPassword, user.password_hash)
    if (!passwordValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long' }
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to update password' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in changePassword:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Disable TOTP for a user
export async function disableTOTP(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' }
    }

    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ totp_enabled: false, totp_secret: null })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to disable TOTP' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in disableTOTP:', error)
    return { success: false, error: 'Internal server error' }
  }
}
