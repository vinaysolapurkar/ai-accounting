export const PLAN_LIMITS = {
  free: {
    receiptsPerMonth: 25,
    aiQueriesPerMonth: 50,
    invoices: true,
    reports: true,
    tallyExport: false,
    multiCurrency: false,
    apiAccess: false,
    multiUser: false,
  },
  pro: {
    receiptsPerMonth: Infinity,
    aiQueriesPerMonth: Infinity,
    invoices: true,
    reports: true,
    tallyExport: true,
    multiCurrency: true,
    apiAccess: false,
    multiUser: false,
  },
  business: {
    receiptsPerMonth: Infinity,
    aiQueriesPerMonth: Infinity,
    invoices: true,
    reports: true,
    tallyExport: true,
    multiCurrency: true,
    apiAccess: true,
    multiUser: true,
  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan as PlanId) || "free"] || PLAN_LIMITS.free;
}
