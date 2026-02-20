import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session.valid || !session.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({
        stripe_account_id: null,
        stripe_account_status: null,
      })
      .eq('id', session.user.user_id)

    if (error) {
      console.error('[stripe/disconnect] Update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to disconnect Stripe account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, message: 'Stripe account disconnected. You can connect again from Settings.' })
  } catch (e) {
    console.error('[stripe/disconnect] Error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to disconnect' },
      { status: 500 }
    )
  }
}
