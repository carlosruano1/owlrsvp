import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { createCustomerPortalSession, getBaseUrl } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('stripe_customer_id')
      .eq('id', session.user.user_id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!userData.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found. Please upgrade to a paid plan first.' }, { status: 400 })
    }

    const body = await request.json()
    const returnUrl = body.returnUrl || `${getBaseUrl()}/admin/settings`

    // Create billing portal session
    const portalSession = await createCustomerPortalSession({
      customerId: userData.stripe_customer_id,
      returnUrl
    })

    return NextResponse.json({ 
      url: portalSession.url
    })
  } catch (error) {
    console.error('Error in billing portal API:', error)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}
