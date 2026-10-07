export function paymentAmountsMatch(expected: number, actual: number, expectedCurrency: string, actualCurrency: string) {
    return Number.isFinite(expected) && Number.isFinite(actual) && Math.round(expected * 100) === Math.round(actual * 100) && expectedCurrency.toLowerCase() === actualCurrency.toLowerCase();
}
export function refundState(amount: number, refunded: number) {
    if (!Number.isFinite(refunded) || refunded < 0 || refunded > amount) throw new Error('Invalid refund amount');
    return refunded === 0 ? 'NONE' : refunded < amount ? 'PARTIAL' : 'FULL';
}
export function validDonationAmount(amount: number) {
    const cents = Math.round(amount * 100);
    return Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(cents) && Math.abs(cents - amount * 100) < 0.000001;
}
