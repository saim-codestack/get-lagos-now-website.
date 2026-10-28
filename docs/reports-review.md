# Reports migration review

Retrieved all 11 public WordPress pages using the pages endpoint on 28 October 2026. Raw API responses remain in tools/source/report-*.json. No report was reduced to a summary. Source builder styling, empty spacer elements, and repeated decorative marquee copy were removed; text, figures, recipient descriptions, testimonials, captions, and historical links were retained except for the exact exclusions in reports-content-review.json. All original image URLs and local files are recorded in reports-assets.json.

## Approval and integrity items

- The 2021–2024 reports use “B Corp Certified” and a B Lab badge alongside BCFG statements. The B Lab paragraph and badge are withheld with visible notes and original-source links pending confirmation. BCFG wording remains explicitly historical source wording. Exact original HTML is retained in reports-content-review.json and raw responses.
- The 2025 report includes 2026 verification, goals, and “186 Volunteer hrs. in 2026.” These dates are preserved verbatim with a visible context note; no totals were combined. The source also says “last 18 yrs.” although the website says since 2010; client clarification needed.
- The 2022 annual report says August 12th/PCC Sylvania while the event page says August 11th/SE 82nd and Division. Both historical statements remain as published; do not infer one is correct.
- Obvious unrelated celebrity/adult and anime-merchandise links were excluded from the 2022 and 2021 event pages respectively. Exact excluded HTML is logged for source-owner cleanup.
- Donation QR codes are retained as historical report imagery, accompanied by an archival context notice. Client should confirm current donation methods before promoting the archive as a live fundraising route.
- Third-party destinations remain original historical links. Live third-party status has not been exhaustively verified.

## Files and checks

- reports.html; reports/annual-benefit-2021.html through annual-benefit-2025.html; reports/e-recycling-pdx.html; reports/non-profit-recipients.html; reports/e-recycling-2021.html through e-recycling-2024.html.
- assets/css/reports.css uses existing tokens and responsive reading widths.
- Source links use data-original-source so global URL migration should leave them pointing to the original publication.
- Static paths and source-content checks are performed by tools/qa-reports.mjs. Browser checks to be included in root website-wide QA.
