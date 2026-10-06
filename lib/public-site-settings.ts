// Only fields intended for publication may cross the server/client boundary.
// Analytics identifiers below are public browser IDs, not API credentials.
export const PUBLIC_SITE_SETTINGS_FIELDS = [
    'siteName', 'logoText', 'logoImage', 'accentColor',
    'contactEmail', 'contactPhone', 'whatsappNumber', 'facebookUrl', 'twitterUrl',
    'instagramUrl', 'youtubeUrl', 'linkedinUrl', 'tiktokUrl',
    'footerTagline', 'footerDescription', 'copyrightText',
    'socialPosition', 'gaMeasurementId', 'facebookPixelId',
] as const;
export type PublicSiteSettings = Partial<Record<typeof PUBLIC_SITE_SETTINGS_FIELDS[number] | 'contactAddress' | 'registrationNumber' | 'verificationUrl', string | null>>;
// This older CMS schema has no socialPosition column. Keep the optional public
// property for callers, but do not let it invalidate the whole settings query.
export const PUBLIC_SITE_SETTINGS_SELECT = PUBLIC_SITE_SETTINGS_FIELDS
    .filter(field => field !== 'socialPosition').join(',');
// Reconstruct the object instead of trusting database types or spreading a row.
// This also discards newly added private columns and unexpected nested values.
export function pickPublicSiteSettings(value: unknown): PublicSiteSettings | null {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const row = value as Record<string, unknown>;
    const result: PublicSiteSettings = {};
    for (const field of PUBLIC_SITE_SETTINGS_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(row, field))
            continue;
        const item = row[field];
        if (typeof item === 'string' || item === null)
            result[field] = item;
    }
    return result;
}
