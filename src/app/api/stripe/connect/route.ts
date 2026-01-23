import { NextRequest, NextResponse } from 'next/server'
import { stripe, createConnectedAccount, createAccountLink, getBaseUrl } from '@/lib/stripe'
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
      return NextResponse.json({ error: 'Stripe not configured - check STRIPE_SECRET_KEY' }, { status: 500 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const baseUrl = getBaseUrl()
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
      
      // Check if it's a column missing error
      if (userError.message?.includes('column') || userError.message?.includes('stripe_account_id')) {
        return NextResponse.json({ 
          error: 'Database columns missing. Run this SQL in Supabase: ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT, ADD COLUMN IF NOT EXISTS stripe_account_status TEXT;' 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: `Database error: ${userError.message || 'Failed to fetch user data'}` 
      }, { status: 500 })
    }

    let accountId = userData?.stripe_account_id

    // Create new account if doesn't exist
    if (!accountId) {
      try {
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
          
          // Check if it's a column missing error
          if (updateError.message?.includes('column') || updateError.message?.includes('stripe_account')) {
            return NextResponse.json({ 
              error: 'Database columns missing. Run this SQL in Supabase: ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT, ADD COLUMN IF NOT EXISTS stripe_account_status TEXT;' 
            }, { status: 500 })
          }
          
          return NextResponse.json({ 
            error: `Failed to save account: ${updateError.message || 'Database error'}` 
          }, { status: 500 })
        }
      } catch (stripeError: any) {
        console.error('Stripe account creation error:', stripeError)
        
        // Show the actual Stripe error message
        const errorMsg = stripeError?.message || stripeError?.code || 'Failed to create Stripe account'
        return NextResponse.json({ 
          error: `Stripe error: ${errorMsg}`,
          details: process.env.NODE_ENV === 'development' ? JSON.stringify(stripeError, null, 2) : undefined
        }, { status: 500 })
      }
    }

    // Create account link for onboarding
    try {
      const accountLink = await createAccountLink(accountId, returnUrl, refreshUrl)
      return NextResponse.json({ url: accountLink.url })
    } catch (linkError: any) {
      console.error('Account link creation error:', linkError)
      
      // Show the actual Stripe error message
      const errorMsg = linkError?.message || linkError?.code || 'Failed to create Connect link'
      return NextResponse.json({ 
        error: `Stripe error: ${errorMsg}`,
        details: process.env.NODE_ENV === 'development' ? JSON.stringify(linkError, null, 2) : undefined
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    
    let errorMessage = 'Failed to create Connect link'
    if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}
