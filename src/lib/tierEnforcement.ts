// Tier enforcement utilities
import { supabase, supabaseAdmin } from './supabase'
import { getPlanLimits, hasFeature } from './plans'

/**
 * Get user's subscription tier from session cookie
 */
export async function getUserTierFromSession(sessionCookie: string | undefined): Promise<string> {
  if (!sessionCookie || !supabase) {
    return 'free'
  }

  try {
    const { data: sessionData } = await supabase
      .rpc('validate_admin_session', { p_token: sessionCookie })

    if (!sessionData || sessionData.length === 0) {
      return 'free'
    }

    const userId = sessionData[0].user_id

    // Fetch user subscription tier
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return 'free'
    }

    return userData.subscription_tier || 'free'
  } catch (error) {
    console.error('Error getting user tier from session:', error)
    return 'free'
  }
}

/**
 * Check if user can use custom branding (logo + colors)
 */
export async function canUseCustomBranding(sessionCookie: string | undefined): Promise<boolean> {
  const tier = await getUserTierFromSession(sessionCookie)
  return hasFeature('allowsCustomBranding', tier)
}

/**
 * Check if user can access advanced analytics
 */
export async function canAccessAdvancedAnalytics(sessionCookie: string | undefined): Promise<boolean> {
  const tier = await getUserTierFromSession(sessionCookie)
  return hasFeature('allowsAdvancedAnalytics', tier)
}

/**
 * Get user tier and limits from session
 */
export async function getUserTierAndLimits(sessionCookie: string | undefined) {
  const tier = await getUserTierFromSession(sessionCookie)
  const limits = getPlanLimits(tier)
  return { tier, limits }
}

