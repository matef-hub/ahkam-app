/**
 * Server-side Monetization & Entitlement Layer (P0)
 *
 * Entitlement states:
 * - ANONYMOUS: No user or session.
 * - TRIAL: Temporary visitor session (limited to 1 trial search, preview content).
 * - FREE: Google-authenticated user without an active paid subscription (limited search, preview content).
 * - PAID: Active paid subscriber (unrestricted search and full judgment text).
 */

export const FREE_SEARCH_ALLOWANCE = 5;

/**
 * Checks whether a user has an active, non-expired paid subscription.
 * Uses strict server-side timestamp comparison against UTC now.
 */
export function isSubscriptionActive(user) {
  if (!user || typeof user !== "object") return false;

  const status = String(user.subscriptionStatus || "").trim().toLowerCase();
  const tier = String(user.subscriptionTier || "").trim().toLowerCase();

  const isPaidTier = tier === "paid" || tier === "pro" || tier === "firm" || tier === "premium";
  const isActiveStatus = status === "active" || status === "trialing";

  if (!isPaidTier || !isActiveStatus) return false;

  // Validate expiration date if present
  if (user.subscriptionExpiresAt) {
    const expiresMs = new Date(user.subscriptionExpiresAt).getTime();
    if (Number.isNaN(expiresMs)) return false;
    if (expiresMs <= Date.now()) return false;
  }

  return true;
}

/**
 * Resolves the full entitlement profile for a given user and session.
 */
export function resolveEntitlement(user, session) {
  if (!user && !session) {
    return {
      tier: "anonymous",
      isAnonymous: true,
      isTrial: false,
      isFree: false,
      isPaid: false,
      canViewFullJudgment: false,
      canUseFullSearch: false,
      searchAllowance: 0,
    };
  }

  if (session?.isTrial) {
    return {
      tier: "trial",
      isAnonymous: false,
      isTrial: true,
      isFree: false,
      isPaid: false,
      canViewFullJudgment: false,
      canUseFullSearch: false,
      searchAllowance: 1,
    };
  }

  if (isSubscriptionActive(user)) {
    return {
      tier: "paid",
      isAnonymous: false,
      isTrial: false,
      isFree: false,
      isPaid: true,
      canViewFullJudgment: true,
      canUseFullSearch: true,
      searchAllowance: Infinity,
    };
  }

  // Free / Registered Google user without active paid subscription
  return {
    tier: "free",
    isAnonymous: false,
    isTrial: false,
    isFree: true,
    isPaid: false,
    canViewFullJudgment: false,
    canUseFullSearch: false,
    searchAllowance: FREE_SEARCH_ALLOWANCE,
  };
}

export function canViewFullJudgment(user, session) {
  return resolveEntitlement(user, session).canViewFullJudgment;
}

export function canUseFullSearch(user, session) {
  return resolveEntitlement(user, session).canUseFullSearch;
}
