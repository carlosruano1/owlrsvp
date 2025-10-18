// Plan limits and enforcement

export interface PlanLimits {
  maxEvents: number;
  maxAttendeesPerEvent: number;
  maxTotalAttendees?: number;
  allowsMultipleEvents: boolean;
  allowsCustomBranding: boolean;
  allowsAdvancedAnalytics: boolean;
  allowsExportToCSV: boolean;
  overageFeePerGuest?: number;
}

// Define plan limits
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxEvents: 1,
    maxAttendeesPerEvent: 50,
    allowsMultipleEvents: false,
    allowsCustomBranding: false,
    allowsAdvancedAnalytics: false,
    allowsExportToCSV: true,
  },
  basic: {
    maxEvents: 10,
    maxAttendeesPerEvent: 500,
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: false,
    allowsExportToCSV: true,
    overageFeePerGuest: 0.03,
  },
  pro: {
    maxEvents: 100,
    maxAttendeesPerEvent: 5000,
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: true,
    allowsExportToCSV: true,
    overageFeePerGuest: 0.03,
  },
  enterprise: {
    maxEvents: 1000,
    maxAttendeesPerEvent: 10000,
    maxTotalAttendees: 100000,
    allowsMultipleEvents: true,
    allowsCustomBranding: true,
    allowsAdvancedAnalytics: true,
    allowsExportToCSV: true,
  }
};

// Default to free plan if subscription tier is unknown
export function getPlanLimits(subscriptionTier: string = 'free'): PlanLimits {
  const tier = subscriptionTier.toLowerCase();
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

// Check if user can create another event
export function canCreateEvent(eventsCreated: number, subscriptionTier: string = 'free'): boolean {
  const limits = getPlanLimits(subscriptionTier);
  return eventsCreated < limits.maxEvents;
}

// Check if user can add more attendees to an event
export function canAddAttendee(attendeeCount: number, subscriptionTier: string = 'free'): boolean {
  const limits = getPlanLimits(subscriptionTier);
  return attendeeCount < limits.maxAttendeesPerEvent;
}

// Calculate how many more events a user can create
export function remainingEvents(eventsCreated: number, subscriptionTier: string = 'free'): number {
  const limits = getPlanLimits(subscriptionTier);
  return Math.max(0, limits.maxEvents - eventsCreated);
}

// Calculate how many more attendees can be added to an event
export function remainingAttendees(attendeeCount: number, subscriptionTier: string = 'free'): number {
  const limits = getPlanLimits(subscriptionTier);
  return Math.max(0, limits.maxAttendeesPerEvent - attendeeCount);
}

// Check if a feature is available in the user's plan
export function hasFeature(feature: keyof PlanLimits, subscriptionTier: string = 'free'): boolean {
  const limits = getPlanLimits(subscriptionTier);
  return !!limits[feature];
}

// Get a friendly display message about the limit
export function getLimitMessage(subscriptionTier: string = 'free'): string {
  const limits = getPlanLimits(subscriptionTier);
  
  if (subscriptionTier === 'free') {
    return `Free plan: Limited to ${limits.maxEvents} event with up to ${limits.maxAttendeesPerEvent} attendees.`;
  } else if (subscriptionTier === 'basic') {
    return `Basic plan: Up to ${limits.maxEvents} events with ${limits.maxAttendeesPerEvent} attendees each. $0.03 per guest over limit.`;
  } else if (subscriptionTier === 'pro') {
    return `Pro plan: Up to ${limits.maxEvents} events with ${limits.maxAttendeesPerEvent} attendees each. $0.03 per guest over limit.`;
  } else {
    return `Enterprise plan: Up to ${limits.maxEvents} events with ${limits.maxAttendeesPerEvent} attendees each.`;
  }
}
