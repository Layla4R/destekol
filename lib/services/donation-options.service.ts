import { getPageBySlug } from "@/lib/pageData";
import { donationOptions } from "@/lib/donation-options";

export async function getDonationOptions(locale: string) {
    const home = await getPageBySlug("home", locale);
    return donationOptions(home?.sections.find(section => section.type === "quick_donate")?.props);
}
