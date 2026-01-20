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

    console.log('Starting account deletion for user_id:', session.user.user_id)

    // Try to cancel Stripe subscription if exists (optional - won't block deletion)
    try {
      const { data: userData } = await supabaseAdmin
        .from('admin_users')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('id', session.user.user_id)
        .single()

      if (userData?.stripe_subscription_id && stripe) {
        try {
          await stripe.subscriptions.cancel(userData.stripe_subscription_id)
          console.log('Stripe subscription cancelled')
        } catch (stripeError) {
          console.error('Error canceling Stripe subscription:', stripeError)
          // Continue with account deletion even if subscription cancellation fails
        }
      }
    } catch (stripeCheckError) {
      // Column might not exist or user might not have Stripe data - that's fine, continue with deletion
      console.log('Skipping Stripe cancellation (column may not exist or user has no subscription)')
    }

    // Call the SQL function to delete the user account and all related data
    console.log('Calling delete_admin_user_account RPC function with user_id:', session.user.user_id)
    const { data, error: deleteError } = await supabaseAdmin.rpc('delete_admin_user_account', {
      p_user_id: session.user.user_id
    })

    console.log('RPC call result - data:', data, 'error:', deleteError)

    // If RPC fails, fall back to manual deletion
    if (deleteError) {
      console.error('RPC function failed, falling back to manual deletion:', deleteError)
      
      // Manual deletion fallback
      const userId = session.user.user_id
      
      // Get all event IDs
      const { data: eventsByAdminId } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('admin_user_id', userId)

      const { data: eventsByCreatedBy } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('created_by_admin_id', userId)

      const allEventIds = [
        ...(eventsByAdminId || []).map(e => e.id),
        ...(eventsByCreatedBy || []).map(e => e.id)
      ]
      const uniqueEventIds = [...new Set(allEventIds)]

      if (uniqueEventIds.length > 0) {
        await supabaseAdmin.from('attendees').delete().in('event_id', uniqueEventIds)
        await supabaseAdmin.from('events').delete().in('id', uniqueEventIds)
      }

      await supabaseAdmin.from('event_access').delete().eq('admin_user_id', userId)
      await supabaseAdmin.from('admin_sessions').delete().eq('admin_user_id', userId)
      await supabaseAdmin.from('verification_codes').delete().eq('user_id', userId)
      await supabaseAdmin.from('password_reset_tokens').delete().eq('admin_user_id', userId)
      await supabaseAdmin.from('magic_link_tokens').delete().eq('admin_user_id', userId)
      
      const { error: userDeleteError } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('id', userId)

      if (userDeleteError) {
        console.error('Manual deletion also failed:', userDeleteError)
        return NextResponse.json({ 
          error: 'Failed to delete account', 
          details: userDeleteError.message 
        }, { status: 500 })
      }
      
      console.log('Account deleted via manual fallback')
    } else if (data !== true) {
      console.error('Account deletion returned false or unexpected result:', data)
      return NextResponse.json({ 
        error: 'Failed to delete account',
        details: 'Function returned false or unexpected result',
        result: data
      }, { status: 500 })
    } else {
      console.log('Account successfully deleted via RPC function')
    }

    // Verify deletion
    const { data: verifyUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', session.user.user_id)
      .single()

    if (verifyUser) {
      console.error('User still exists after deletion attempt!')
      return NextResponse.json({ 
        error: 'Account deletion failed - user still exists',
        details: 'Please contact support'
      }, { status: 500 })
    }

    console.log('Account deletion verified - user no longer exists')

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
