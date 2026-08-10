/**
 * Subscription plan management utilities for Aeterna.
 * Stores plan data in localStorage — ready to connect to Stripe backend when available.
 */

export type PlanType = "free" | "pro" | "family";

export interface PlanLimits {
  maxVaults: number;
  maxBeneficiaries: number;
  features: string[];
}

const PLAN_KEY = "aeterna_current_plan";
const PLAN_START_KEY = "aeterna_plan_start_date";

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxVaults: 3,
    maxBeneficiaries: 1,
    features: [
      "email_switch",
      "aes_encryption",
      "basic_vaults",
    ],
  },
  pro: {
    maxVaults: Infinity,
    maxBeneficiaries: 5,
    features: [
      "email_switch",
      "aes_encryption",
      "basic_vaults",
      "unlimited_vaults",
      "video_messages",
      "2fa_vault",
      "time_capsules",
      "file_upload",
      "1gb_storage",
      "priority_support",
    ],
  },
  family: {
    maxVaults: Infinity,
    maxBeneficiaries: Infinity,
    features: [
      "email_switch",
      "aes_encryption",
      "basic_vaults",
      "unlimited_vaults",
      "video_messages",
      "2fa_vault",
      "time_capsules",
      "file_upload",
      "unlimited_storage",
      "sms_alerts",
      "whatsapp_alerts",
      "scheduled_triggers",
      "priority_support",
      "family_dashboard",
      "shamir_recovery",
      "unlimited_beneficiaries",
    ],
  },
};

/**
 * Get the current subscription plan from localStorage.
 */
export function getCurrentPlan(): PlanType {
  const stored = localStorage.getItem(PLAN_KEY);
  if (stored === "pro" || stored === "family") return stored;
  return "free";
}

/**
 * Set the current subscription plan and store the start date.
 */
export function setCurrentPlan(plan: PlanType): void {
  localStorage.setItem(PLAN_KEY, plan);
  if (plan !== "free") {
    localStorage.setItem(PLAN_START_KEY, new Date().toISOString());
  } else {
    localStorage.removeItem(PLAN_START_KEY);
  }
}

/**
 * Get limits and features for a given plan.
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if the current plan allows a specific feature.
 */
export function canUseFeature(feature: string): boolean {
  const plan = getCurrentPlan();
  const limits = getPlanLimits(plan);
  return limits.features.includes(feature);
}

/**
 * Get the next billing date (1 year from plan start).
 */
export function getNextBillingDate(): string | null {
  const startDate = localStorage.getItem(PLAN_START_KEY);
  if (!startDate) return null;
  const next = new Date(startDate);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

/**
 * Cancel the current plan (revert to free).
 */
export function cancelPlan(): void {
  setCurrentPlan("free");
}

/**
 * Get plan display info.
 */
export function getPlanDisplayName(plan: PlanType): string {
  switch (plan) {
    case "pro":
      return "Pro";
    case "family":
      return "Family";
    default:
      return "Free";
  }
}
