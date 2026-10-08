# Financial reports and public metrics

## Financial reports

Admin → Reports separates Gross Donations, Confirmed Refunds, and Net Donations for the selected currency. Confirmed live payments with COMPLETED or REFUNDED status are included; pending, failed and test payments are excluded. Fully refunded payments remain part of gross and refund totals. Partial refunds reduce net without changing gross. No exchange rate or conversion is applied.

The period uses Donation.createdAt, not settlement/payment confirmation time. Refund amounts are cumulative confirmed refunds for that donation cohort at generation time, even when refunded later. This is a donation-record report, not a cash-flow or bank settlement report. The source, exact UTC period, generation time and methodology appear in the UI and summary CSV. Results are fetched in pages; errors or an excessive result size fail closed instead of producing truncated totals.

## Public metrics

Existing public figures remain visible, as explicitly requested by the association. Their values and wording have not been changed. Source, date and classification must not be invented.

Admin → Pages → Home → edit the achievements/statistics block. For each item, enter:

- Actual result or planned target.
- Public source/report name and optional HTTPS public report URL. Never link private files or beneficiary lists.
- Period start/end as YYYY-MM-DD.
- Calculation method (including numerator/denominator for percentages and deduplication rules for counts).
- Internal approver and approval date.
- Approval to display the documentation details publicly.

Once the documentation fields are complete, each number displays an actual/target label and an expandable source/period/calculation explanation. Incomplete evidence does not hide or change the number. The internal approver is not displayed. Completed actual-result periods must end on or before approval; targets may refer to future periods.

Enter the base Arabic source and methodology first, then translate their wording in English, Turkish and French page editors. Values, classifications, dates, approval and source links are shared canonical facts across locales; translated wording does not change those facts. This is an administrative publication decision, not automatic verification of documentary evidence.

## Information to request from the association

For every indicator: confirmed value, whether actual or target, measurement period, scope/geography, source document and public version, calculation method and accountable approver.

- **95% directed to the field:** the numerator and denominator amounts, currency, period, included/excluded costs (administration, fundraising, gateway fees), treatment of in-kind aid/refunds, whether spent or merely allocated, and supporting approved financial report.
- **300+ reached:** individuals versus households, whether unique beneficiaries or service instances, deduplication method, included programs, period, and an anonymized aggregate report.
- **15+ completed projects:** project list/count, completion criteria, completion dates, distinction between campaigns and projects, and approved completion report.
- **12+ work areas:** definition of area (country, city, district, camp), list and period, whether currently active or cumulative historical coverage.

Do not request identifiable beneficiary records for publication; aggregate figures and approved public reports suffice.
