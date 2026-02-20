// Tier-related utilities and upgrade messages

export interface TierLimits {
  maxEvents: number;
  maxAttendeesPerEvent: number;
  maxTotalAttendees?: number;
  allowsMultipleEvents: boolean;
  allowsCustomBranding: boolean;
  allowsAdvancedAnalytics: boolean;
  allowsExportToCSV: boolean;
  overageFeePerGuest?: number;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxEvents: 1,
    maxAttendeesPerEvent: 25,
    allowsMultipleEvents: false,
    allowsCustomBranding: false,
    allowsAdvancedAnalytics: false,
    allowsExportToCSV: true,
  },
  basic: {
    maxEvents: 5,
    maxAttendeesPerEvent: 200,
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: false,
    allowsExportToCSV: true,
    overageFeePerGuest: 0.05,
  },
  pro: {
    maxEvents: 25,
    maxAttendeesPerEvent: 1000,
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: true,
    allowsExportToCSV: true,
    overageFeePerGuest: 0.05,
  },
  enterprise: {
    maxEvents: 999999, // Effectively unlimited
    maxAttendeesPerEvent: Infinity, // Unlimited
    maxTotalAttendees: undefined, // No total limit
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: true,
    allowsExportToCSV: true,
    overageFeePerGuest: 0.05,
  },
  team: {
    maxEvents: 999999,
    maxAttendeesPerEvent: Infinity,
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: true,
    allowsExportToCSV: true,
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function hasFeature(tier: string, feature: keyof TierLimits): boolean {
  const limits = getTierLimits(tier);
  return Boolean(limits[feature]);
}

export function getUpgradeMessage(feature: string): { message: string } {
  const messages = {
    analytics: {
      message: 'Advanced analytics is only available on Pro and Enterprise plans. Please upgrade to access this feature.',
    },
    branding: {
      message: 'Custom branding is only available on Pro, Enterprise, and Team plans. Please upgrade to access this feature.',
    },
  };

  return messages[feature as keyof typeof messages] || {
    message: 'This feature requires a higher tier plan. Please upgrade to access this feature.',
  };
}

// Re-export from plans for backward compatibility
export { PLAN_LIMITS, hasFeature as hasFeatureFromPlans } from './plans';
export type { PlanLimits } from './plans';