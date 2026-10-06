export type DonationCartItem = {
    slug: string;
    title: string;
    amount: number;
    frequency: string;
    campaignId?: string | null;
    kindnessBox?: boolean;
};
export type KindnessChoice = {
    campaignId: string;
    slug: string;
    title: string;
    unitAmount: number;
    quantity: number;
};
// Merge only the same campaign and frequency; retain unrelated/monthly gifts.
export function addKindnessChoices(cart: DonationCartItem[], choices: KindnessChoice[]): DonationCartItem[] {
    const next = cart.map(item => ({ ...item }));
    for (const choice of choices) {
        if (!choice.campaignId || !choice.slug || !Number.isSafeInteger(choice.quantity) || choice.quantity < 1 || choice.quantity > 99 || !Number.isFinite(choice.unitAmount) || choice.unitAmount < 1)
            continue;
        const amount = Math.round(choice.quantity * choice.unitAmount * 100) / 100;
        const existing = next.find(item => item.campaignId === choice.campaignId && item.frequency.toLowerCase() === "one_time");
        if (existing) {
            existing.amount = Math.round((Number(existing.amount) + amount) * 100) / 100;
            existing.kindnessBox = true;
        }
        else
            next.push({ slug: choice.slug, title: choice.title, amount, frequency: "one_time", campaignId: choice.campaignId, kindnessBox: true });
    }
    return next;
}
