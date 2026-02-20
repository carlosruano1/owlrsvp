// Tier enforcement utilities
import { supabase, supabaseAdmin } from './supabase'
import { getPlanLimits, hasFeature } from './plans'

/**
 * Get user's effective subscription tier from session cookie
 * Team accounts inherit permissions from their admin
 */
export async function getUserTierFromSession(sessionCookie: string | undefined, eventId?: string): Promise<string> {
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
      .select('subscription_tier, email')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return 'free'
    }

    const baseTier = userData.subscription_tier || 'free'

    // If user is on team tier and we have an event context, check if they have admin-level permissions
    if (baseTier === 'team' && eventId) {
      // First find the team member record by email
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', userData.email)
        .eq('status', 'active')
        .single()

      if (!teamError && teamMember) {
        // Check if this team member has permissions for this specific event
        const { data: permissions, error: permError } = await supabase
          .from('event_permissions')
          .select('permissions')
          .eq('event_id', eventId)
          .eq('team_member_id', teamMember.id)
          .single()

        if (!permError && permissions) {
          const perms = permissions.permissions || {}
          // If team member has analytics permission, they effectively have pro features for this event
          if (perms.can_view_analytics) {
            return 'pro' // Grant pro-level features for this context
          }
        }
      }
    }

    return baseTier
  } catch (error) {
    console.error('Error getting user tier from session:', error)
    return 'free'
  }
}

/**
 * @deprecated Use tierAuth.ts instead
 * Check if user can use custom branding (logo + colors)
 * Team accounts inherit this from their admin
 */
export async function canUseCustomBranding(sessionCookie: string | undefined): Promise<boolean> {
  const { canUseCustomBranding: newFn } = await import('./tierAuth')
  return newFn(sessionCookie)
}

/**
 * @deprecated Use tierAuth.ts instead
 * Check if user can access advanced analytics
 * Team accounts inherit this from their admin
 */
export async function canAccessAdvancedAnalytics(sessionCookie: string | undefined, eventId?: string): Promise<boolean> {
  const { canAccessAdvancedAnalytics: newFn } = await import('./tierAuth')
  return newFn(sessionCookie, eventId)
}

/**
 * Get the admin tier for a team member
 */
export async function getAdminTierForTeamMember(userEmail: string): Promise<string> {
  if (!supabase) {
    return 'free'
  }

  try {
    // Find the team member record and get their admin's current tier
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select(`
        owner_subscription_tier,
        admin_users!team_members_owner_id_fkey (
          subscription_tier
        )
      `)
      .eq('email', userEmail)
      .eq('status', 'active')
      .single() as { data: { admin_users: { subscription_tier: string } } | null, error: any }

    if (!error && teamMember) {
      // Return the admin's current tier (not the stored tier at invitation time)
      return teamMember.admin_users?.subscription_tier || 'free'
    }

    return 'free'
  } catch (error) {
    console.error('Error getting admin tier for team member:', error)
    return 'free'
  }
}

/**
 * Get effective tier for a user, considering team inheritance
 */
export async function getEffectiveUserTier(sessionCookie: string | undefined, context?: { eventId?: string }): Promise<string> {
  if (!sessionCookie || !supabase) {
    console.log('[getEffectiveUserTier] No session cookie or supabase')
    return 'free'
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_admin_session', { p_token: sessionCookie })

    if (sessionError) {
      console.error('[getEffectiveUserTier] Session validation error:', sessionError)
      return 'free'
    }

    if (!sessionData || sessionData.length === 0) {
      console.log('[getEffectiveUserTier] No session data')
      return 'free'
    }

    const userId = sessionData[0].user_id

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('subscription_tier, email')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[getEffectiveUserTier] User fetch error:', userError)
      return 'free'
    }

    if (!userData) {
      console.log('[getEffectiveUserTier] No user data found')
      return 'free'
    }

    const baseTier = (userData.subscription_tier || 'free').toLowerCase().trim()
    console.log('[getEffectiveUserTier] Base tier:', baseTier, 'User ID:', userId, 'Raw tier:', userData.subscription_tier)

    // If user is on team tier and we have an event context, check if they have admin-level permissions
    if (baseTier === 'team' && context?.eventId) {
      // First find the team member record by email
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', userData.email)
        .eq('status', 'active')
        .single()

      if (!teamError && teamMember) {
        // Check if this team member has permissions for this specific event
        const { data: permissions, error: permError } = await supabase
          .from('event_permissions')
          .select('permissions')
          .eq('event_id', context.eventId)
          .eq('team_member_id', teamMember.id)
          .single()

        if (!permError && permissions) {
          const perms = permissions.permissions || {}
          // If team member has analytics permission, they effectively have pro features for this event
          if (perms.can_view_analytics) {
            return 'pro' // Grant pro-level features for this context
          }
        }
      }
    }

    // If user is on team tier, return their admin's tier for feature access
    if (baseTier === 'team') {
      const adminTier = await getAdminTierForTeamMember(userData.email)
      console.log('[getEffectiveUserTier] Team member, admin tier:', adminTier)
      return adminTier
    }

    console.log('[getEffectiveUserTier] Returning base tier:', baseTier)
    return baseTier
  } catch (error) {
    console.error('[getEffectiveUserTier] Error getting effective user tier:', error)
    return 'free'
  }
}

/**
 * Get user tier and limits from session
 */
export async function getUserTierAndLimits(sessionCookie: string | undefined) {
  const tier = await getEffectiveUserTier(sessionCookie)
  const limits = getPlanLimits(tier)
  return { tier, limits }
}

