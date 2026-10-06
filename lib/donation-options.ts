/** Use only amounts saved by the administrator; discard invalid inputs. */
export function donationOptions(props: Record<string, any> = {}) {
    const amounts = Array.isArray(props.amounts) ? [...new Set(props.amounts
        .map((item: any) => Number(item && typeof item === "object" ? item.value : item))
        .filter((value: number) => Number.isFinite(value) && value >= 1))] as number[] : [];
    const configured = Number(props.defaultAmount);
    return { amounts, defaultAmount: Number.isFinite(configured) && configured >= 1 ? configured : amounts[0] || 0 };
}
