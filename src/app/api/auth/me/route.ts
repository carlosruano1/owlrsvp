import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await validateSession(sessionToken)

    if (!result.valid || !result.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Fetch full user data including TOTP status
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('id, username, email, email_verified, subscription_tier, subscription_status, max_events, max_attendees_per_event, events_created_count, created_at, last_login, totp_enabled')
      .eq('id', result.user.user_id)
      .single()

    if (userError || !userData) {
      // Fallback to session data if user fetch fails
      return NextResponse.json({ user: result.user })
    }

    // Remove sensitive fields
    const { password_hash, email_verification_token, totp_secret, ...safeUserData } = userData

    return NextResponse.json({ user: safeUserData })
  } catch (error) {
    console.error('Error in me API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
