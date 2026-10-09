# Campaign details and approved delivery plans

Admin → Campaigns → Edit Campaign → **Campaign delivery plan / خطة الحملة**.

The campaign cover is the main image. There is no home-page hero or general achievement strip. The donation panel appears next to the image and stays below the site navigation while scrolling on desktop; its own overflow remains scrollable on shorter screens. Mobile presents the image, donation panel, then campaign information. The existing card controls now start at the campaign default amount (25 when unavailable), with preset amounts.

`Campaign.projectPlan` in the **destekol** schema stores shared quantities/dates/budget and Arabic, Turkish, English and French narratives. No public schema changes. Existing campaigns receive an empty draft; a zero balance is explained as no recorded collected donations, without assuming a prelaunch phase.

Enter the real approved project file: version and private reference, campaign phase, beneficiary count/unit and selection criteria, safe scope/location, need evidence/source, implementation dates, activities, measurable target outputs, cost assumptions, implementing entity, delivery partner or direct-delivery explanation, monitoring/report date, shortfall/surplus/delay arrangements and fundraising explanation. Medical campaigns additionally require the specialist-reviewed health/nutrition narrative and safe delivery method in all languages.

Budget rows contain quantity, unit cost and four translated item names. Their sum must match the campaign goal in its actual currency. Enter all four language versions, approve and save. Approval date and staff ID are assigned by the server. Internal project references and approving staff IDs are never rendered to visitors. The public page labels beneficiary counts, outputs and the budget as planned targets rather than delivered results.

Any edit in the base campaign form or delivery-plan editor clears approval, requiring explicit approval again. API edits that omit `projectPlan` withdraw approval too. The server rejects incomplete approvals and public rendering revalidates the saved plan. Published plans show version, approval date, dates, narratives, and the budget. Draft contents remain in admin; the website states that the completed approved plan is still pending.

The software validates completeness and consistency, not the truth of the project file or the qualifications of its reviewer. The association must supply and approve those records before public plan publication. No invented budget, partner, beneficiary count or schedule has been seeded.

Verification: `node --test tests/campaign-plan.test.cjs`; four-language desktop/mobile browser checks; sticky panel position before/after scrolling; actual campaign covers; no old reviewer claims, no general achievement metrics, and full descriptions. The new JSONB column uses the existing deny-by-default RLS and server-only database access.
