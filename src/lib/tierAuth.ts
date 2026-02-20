import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from './supabase'

// Use admin client for server-side operations that need access to admin_users table
const db = supabaseAdmin;

/**
 * Extract session token from request cookies
 */
export function getSessionTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get('admin_session')?.value;
}

/**
 * Get user tier from session token
 */
export async function getUserTier(sessionToken: string | undefined): Promise<string> {
  if (!sessionToken || !db) {
    return 'free';
  }

  try {
    const { data: sessionData } = await db
      .rpc('validate_admin_session', { p_token: sessionToken });

    if (!sessionData || sessionData.length === 0) {
      return 'free';
    }

    const userId = sessionData[0].user_id;

    const { data: userData, error } = await db
      .from('admin_users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return 'free';
    }

    return userData.subscription_tier || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Get effective tier considering team permissions
 */
export async function getEffectiveTier(sessionToken: string | undefined, context?: { eventId?: string }): Promise<string> {
  if (!sessionToken || !db) {
    return 'free';
  }

  try {
    const { data: sessionData } = await db
      .rpc('validate_admin_session', { p_token: sessionToken });

    if (!sessionData || sessionData.length === 0) {
      return 'free';
    }

    const userId = sessionData[0].user_id;

    // Get user data with team info if applicable
    const { data: userData, error } = await db
      .from('admin_users')
      .select('subscription_tier, email')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return 'free';
    }

    const baseTier = userData.subscription_tier || 'free';

    // If user is on team tier and we have an event context, check team permissions
    if (baseTier === 'team' && context?.eventId) {
      const { data: teamMember } = await db
        .from('team_members')
        .select('admin_users!inner(subscription_tier)')
        .eq('email', userData.email)
        .eq('status', 'active')
        .single();

      if (teamMember?.admin_users?.[0]?.subscription_tier) {
        return teamMember.admin_users[0].subscription_tier;
      }
    }

    return baseTier;
  } catch (error) {
    console.error('Error getting effective tier:', error);
    return 'free';
  }
}

/**
 * Check if user can access advanced analytics
 */
export async function canAccessAdvancedAnalytics(sessionToken: string | undefined, eventId?: string): Promise<boolean> {
  const tier = await getEffectiveTier(sessionToken, { eventId });
  return ['pro', 'enterprise'].includes(tier);
}

/**
 * Check if user can use custom branding
 */
export async function canUseCustomBranding(sessionToken: string | undefined): Promise<boolean> {
  const tier = await getEffectiveTier(sessionToken);
  return ['pro', 'enterprise', 'team'].includes(tier);
}

/**
 * Check if user can use the color picker (available for basic and above)
 */
export async function canUseColorPicker(sessionToken: string | undefined): Promise<boolean> {
  const tier = await getEffectiveTier(sessionToken);
  return ['basic', 'pro', 'enterprise', 'team'].includes(tier);
}

/**
 * Check if user can use ticketing features (QR check-in, ticket emails)
 */
export async function canUseTicketing(sessionToken: string | undefined): Promise<boolean> {
  const tier = await getEffectiveTier(sessionToken);
  return ['pro', 'enterprise', 'team'].includes(tier);
}

/**
 * Get user tier and limits
 */
export async function getUserTierAndLimits(sessionToken: string | undefined) {
  const tier = await getEffectiveTier(sessionToken);
  const limits = getTierLimits(tier);

  return {
    tier,
    limits,
    canAccessAdvancedAnalytics: await canAccessAdvancedAnalytics(sessionToken),
    canUseCustomBranding: await canUseCustomBranding(sessionToken),
  };
}

// Re-export from tierEnforcement for backward compatibility
export { canAccessAdvancedAnalytics as canAccessAdvancedAnalyticsAlt } from './tierEnforcement';
export { canUseCustomBranding as canUseCustomBrandingAlt } from './tierEnforcement';

// Import getTierLimits from plans
import { getPlanLimits } from './plans';

function getTierLimits(tier: string) {
  return getPlanLimits(tier as any) || getPlanLimits('free');
}