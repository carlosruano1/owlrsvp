import { NextRequest, NextResponse } from 'next/server'
import { createAdminUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Register API called');
    const body = await request.json()
    const { username, email, password } = body

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

    // Create user with direct verification (skip email)
    console.log('Calling createAdminUser function with direct verification');
    const result = await createAdminUser(username, email, password, true)

    if (!result.success) {
      console.error('User creation failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // If there's a warning message but the account was created
    if (result.error && result.success) {
      return NextResponse.json({ 
        success: true,
        warning: result.error,
        verification_code: result.verification_code,
        message: 'Account created successfully, but there was an issue with the verification email. Please use the verification code provided.'
      })
    }

    console.log('User registered successfully:', username);
    return NextResponse.json({ 
      success: true,
      verification_code: result.verification_code,
      message: 'Account created successfully. Please use the verification code to activate your account.' 
    })
  } catch (error) {
    console.error('Error in register API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Registration failed: ${errorMessage}. Please try again or contact support.` 
    }, { status: 500 })
  }
}
