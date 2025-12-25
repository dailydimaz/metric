// Billing configuration and plan limits
// When VITE_STRIPE_PUBLISHABLE_KEY is not set, billing is disabled and all features are unlimited

export const PLANS = {
  free: {
    name: 'Hobby',
    price: 0,
    eventsLimit: 10_000,
    sitesLimit: 1,
    retentionDays: 7,
    features: ['Core web analytics', '7-day data retention', 'Email support'],
  },
  pro: {
    name: 'Pro',
    price: 19,
    eventsLimit: 100_000,
    sitesLimit: -1, // unlimited
    retentionDays: 365,
    features: [
      'Custom event tracking',
      'Funnel analysis',
      '1-year data retention',
      'API access',
      'Priority support',
    ],
  },
  business: {
    name: 'Business',
    price: 79,
    eventsLimit: 1_000_000,
    sitesLimit: -1, // unlimited
    retentionDays: 730,
    features: [
      'Everything in Pro',
      'Retention cohorts',
      'Team collaboration',
      '2-year data retention',
      'Custom dashboards',
      'Slack integration',
      'Dedicated support',
    ],
  },
  selfhosted: {
    name: 'Self-Hosted',
    price: 0,
    eventsLimit: -1, // unlimited
    sitesLimit: -1, // unlimited
    retentionDays: -1, // unlimited
    features: [
      'Unlimited websites',
      'Unlimited events',
      'Unlimited data retention',
      'All features unlocked',
      'Full control over your data',
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function isBillingEnabled(): boolean {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}

export function isSelfHosted(): boolean {
  return !isBillingEnabled();
}

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan];
}

export function formatNumber(num: number): string {
  if (num < 0) return 'Unlimited';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit < 0) return 0; // unlimited
  return Math.min(100, Math.round((used / limit) * 100));
}

export function isNearLimit(used: number, limit: number, threshold = 80): boolean {
  if (limit < 0) return false; // unlimited
  return getUsagePercentage(used, limit) >= threshold;
}

export function isOverLimit(used: number, limit: number): boolean {
  if (limit < 0) return false; // unlimited
  return used >= limit;
}
