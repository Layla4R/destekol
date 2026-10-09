export function readCampaignGallery(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((src): src is string => typeof src === 'string' && src.length <= 2000 && (/^https:\/\//i.test(src) || /^\/(?!\/)/.test(src))).map(src => src.trim()))].slice(0, 20);
}
export function validateCampaignGallery(input: unknown): string[] {
  if (!Array.isArray(input) || input.length > 20 || input.some(src => typeof src !== 'string' || !src.trim() || src.length > 2000 || !(/^https:\/\//i.test(src.trim()) || /^\/(?!\/)/.test(src.trim())))) throw new Error('Gallery must contain up to 20 HTTPS or local image URLs.');
  return readCampaignGallery(input);
}
