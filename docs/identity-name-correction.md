# Association identity correction — 21 October 2026

The owner requested the exact public name **DESTEK OL İNSANİ YARDIM VE KALKINMA DERNEĞİ**. Public branding now uses this name in every locale and corrects historical CMS spellings when rendering editorial content. Account records and stored CMS rows were not rewritten.

The corrected logo is `public/brand/destekol-legal-logo-v5.png` (2043 × 770, transparent PNG). It was edited using the built-in ImageGen tool from the owner's existing `Destekol Logo with Humanitarian Subtitle.png`. The new versioned URL avoids the site's immutable image cache. The original supplied asset remains available.

## ImageGen prompt

> Edit this exact existing logo asset. Preserve the DestekOL wordmark, hand, leaf, heart, circular symbol, shapes, blue/teal/gold colors and proportions. Change ONLY its Turkish subtitle to the exact text: DESTEK OL İNSANİ YARDIM VE KALKINMA DERNEĞİ . The old word KALKINDIRMA is wrong; the new word is KALKINMA. Use crisp readable bold dark-blue sans-serif uppercase with correct Turkish dotted İ and Ğ. Keep the subtitle on one line beneath the mark, centered and spanning the mark width. Output a transparent PNG with tight reasonable margins around the entire logo, no huge empty padding. No added design elements. This is the production website logo.

## Verification

- TypeScript and branding, public-settings, policy-rendering and kit tests passed.
- Production build passed using an isolated `.next-identity-name` output directory.
- About pages returned HTTP 200 in Turkish, Arabic, English and French, with the correct legal name and versioned logo and without the old spelling.
- Follow-up styling increases footer navigation links from 12px to 14px with weight 700; official verification links have larger text, padding, a tinted background and visible focus states.
- These checks were completed locally before the owner authorized production publication.

Google's [domain relationship guidance](https://support.google.com/nonprofits/answer/9937659?hl=en) calls for a working website, clear mission, street address, registration information and a clear relationship between the domain and the organization. These edits do not constitute Google approval or independent verification of registration records.
