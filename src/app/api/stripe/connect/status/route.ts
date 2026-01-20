import { NextRequest, NextResponse } from 'next/server'
import { stripe, getAccountStatus } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session.valid || !session.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!stripe || !supabaseAdmin) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Get user's Stripe account ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', session.user.user_id)
      .single()

    if (userError || !userData?.stripe_account_id) {
      return NextResponse.json({ 
        connected: false,
        status: null 
      })
    }

    // Get account status from Stripe
    try {
      const accountStatus = await getAccountStatus(userData.stripe_account_id)
      
      // Update database if status changed
      if (accountStatus.status !== userData.stripe_account_status) {
        await supabaseAdmin
          .from('admin_users')
          .update({ stripe_account_status: accountStatus.status })
          .eq('id', session.user.user_id)
      }

      return NextResponse.json({
        connected: true,
        status: accountStatus.status,
        accountId: accountStatus.id,
        chargesEnabled: accountStatus.chargesEnabled,
        payoutsEnabled: accountStatus.payoutsEnabled,
      })
    } catch (error) {
      console.error('Error getting account status:', error)
      return NextResponse.json({
        connected: true,
        status: userData.stripe_account_status || 'pending',
      })
    }
  } catch (error) {
    console.error('Connect status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
