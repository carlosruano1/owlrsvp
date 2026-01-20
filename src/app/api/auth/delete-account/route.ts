import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function DELETE(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Validate session
    const session = await validateSession(sessionToken)
    if (!session.valid || !session.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get user's Stripe customer ID and subscription ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', session.user.user_id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Cancel Stripe subscription if exists
    if (userData.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.cancel(userData.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError)
        // Continue with account deletion even if subscription cancellation fails
      }
    }

    // Delete user's events and related data (cascade should handle this, but we'll be explicit)
    // First, get all events for this user
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('admin_user_id', session.user.user_id)

    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id)
      
      // Delete attendees for these events
      await supabaseAdmin
        .from('attendees')
        .delete()
        .in('event_id', eventIds)

      // Delete events
      await supabaseAdmin
        .from('events')
        .delete()
        .eq('admin_user_id', session.user.user_id)
    }

    // Delete user's sessions
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('admin_user_id', session.user.user_id)

    // Delete user's verification codes
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('user_id', session.user.user_id)

    // Delete user's password reset tokens
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('admin_user_id', session.user.user_id)

    // Delete user's magic link tokens
    await supabaseAdmin
      .from('magic_link_tokens')
      .delete()
      .eq('admin_user_id', session.user.user_id)

    // Finally, delete the user account (soft delete by setting is_active to false)
    const { error: deleteError } = await supabaseAdmin
      .from('admin_users')
      .update({ is_active: false })
      .eq('id', session.user.user_id)

    if (deleteError) {
      console.error('Error deleting account:', deleteError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // Clear the session cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully'
    })
    
    response.cookies.delete('admin_session')

    return response
  } catch (error) {
    console.error('Error in delete-account API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
