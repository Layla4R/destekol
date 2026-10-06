export function formatCurrency(amount: number | string, currency = "USD", locale = "en-US") {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(num || 0);
}
export function formatNumber(num: number) {
    return new Intl.NumberFormat("en-US").format(num);
}
export function generateReceiptNumber() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    // High entropy: timestamp in base36 + two random segments to prevent collisions
    const ts = Date.now().toString(36).toUpperCase().slice(-5);
    const r1 = Math.floor(100 + Math.random() * 900);
    const r2 = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `4R-${y}${m}${d}-${ts}${r1}${r2}`;
}
