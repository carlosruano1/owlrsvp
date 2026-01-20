import { NextRequest, NextResponse } from 'next/server'
import { stripe, createConnectedAccount, createAccountLink } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/admin/settings?stripe_connected=true`
    const refreshUrl = `${baseUrl}/admin/settings?stripe_refresh=true`

    // Check if user already has a Stripe account
    const { data: userData, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('stripe_account_id')
      .eq('id', session.user.user_id)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    let accountId = userData?.stripe_account_id

    // Create new account if doesn't exist
    if (!accountId) {
      const account = await createConnectedAccount()
      accountId = account.id

      // Save account ID to database
      const { error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update({ 
          stripe_account_id: accountId,
          stripe_account_status: 'pending'
        })
        .eq('id', session.user.user_id)

      if (updateError) {
        console.error('Error saving Stripe account ID:', updateError)
        return NextResponse.json({ error: 'Failed to save account' }, { status: 500 })
      }
    }

    // Create account link for onboarding
    const accountLink = await createAccountLink(accountId, returnUrl, refreshUrl)

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({ error: 'Failed to create Connect link' }, { status: 500 })
  }
}
