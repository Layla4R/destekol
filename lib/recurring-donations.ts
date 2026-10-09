import { validDonationAmount } from './payment-lifecycle';

/** Provider-independent contract. No provider adapter is installed or activated yet. */
export const RECURRING_SERVICE_AVAILABLE = false;
export type RecurringSubscriptionState = 'PENDING_AUTHORIZATION' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLATION_PENDING' | 'CANCELLED';
export type RecurringPlan = {
    version: string; amount: number; currency: string; frequency: 'MONTHLY';
    firstChargeAt: string; timeZone: string; billingSchedule: string;
    duration: 'UNTIL_CANCELLED'; cancellationTerms: string;
    providerApproved: boolean; cancellationTested: boolean;
};
export function createMonthlyAuthorizationRecord(plan: RecurringPlan, consent: {
    donorId: string; locale: string; recurringAccepted: boolean; acceptedPlanVersion: string;
}, now = new Date()) {
    if (!plan.providerApproved || !plan.cancellationTested) throw new Error('RECURRING_NOT_READY');
    if (!validDonationAmount(plan.amount) || !['USD', 'TRY', 'EUR', 'GBP', 'RUB'].includes(plan.currency)
        || plan.frequency !== 'MONTHLY' || plan.duration !== 'UNTIL_CANCELLED') throw new Error('INVALID_RECURRING_PLAN');
    const first = Date.parse(plan.firstChargeAt);
    if (!Number.isFinite(first) || !/(?:Z|[+-]\d{2}:\d{2})$/.test(plan.firstChargeAt) || first < now.getTime()
        || !plan.timeZone || !plan.billingSchedule?.trim() || !plan.cancellationTerms?.trim() || !plan.version?.trim()) throw new Error('INCOMPLETE_RECURRING_TERMS');
    try { new Intl.DateTimeFormat('en', { timeZone: plan.timeZone }).format(now); } catch { throw new Error('INVALID_BILLING_TIMEZONE'); }
    // Marketing consent and general policy acknowledgement cannot substitute for this consent.
    if (!consent.donorId?.trim() || !consent.recurringAccepted || consent.acceptedPlanVersion !== plan.version
        || !['ar', 'tr', 'en', 'fr'].includes(consent.locale)) throw new Error('RECURRING_AUTHORIZATION_REQUIRED');
    return {
        donorId: consent.donorId, locale: consent.locale, consentAt: now.toISOString(),
        recurringAccepted: true, acceptedPlanVersion: plan.version,
        planSnapshot: { ...plan }, subscriptionStatus: 'PENDING_AUTHORIZATION' as RecurringSubscriptionState,
    };
}
export type ProviderCancellationResult = { confirmed: boolean; providerReference?: string; effectiveAt?: string };
export function cancellationDecision(state: RecurringSubscriptionState, result: ProviderCancellationResult) {
    if (state === 'CANCELLED') return { subscriptionStatus: state, confirmed: true };
    if (!['ACTIVE', 'SUSPENDED', 'CANCELLATION_PENDING'].includes(state)) throw new Error('SUBSCRIPTION_NOT_ACTIVE');
    if (!result.confirmed || !result.providerReference?.trim() || !result.effectiveAt || !Number.isFinite(Date.parse(result.effectiveAt))) {
        return { subscriptionStatus: 'CANCELLATION_PENDING' as RecurringSubscriptionState, confirmed: false };
    }
    // Subscription cancellation never changes the payment/refund ledger.
    return { subscriptionStatus: 'CANCELLED' as RecurringSubscriptionState, confirmed: true,
        providerReference: result.providerReference, effectiveAt: result.effectiveAt };
}
