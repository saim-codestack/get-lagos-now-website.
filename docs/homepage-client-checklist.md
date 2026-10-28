# Homepage client checklist and source integrity

Reviewed 28 October 2026 against the **current local** `index.html` and the original public homepage snapshot `tools/source/homepage.html` (https://getlagosnow.com/). This is a read-only evidence review, not a redesign. Extracted source/local quotes and badge metadata are recorded in `homepage-source-evidence.json`; the reproducible DOM extraction is `tools/audit-homepage.mjs`.

## All 13 previous client requirements

| # | Requirement | Current implementation evidence | Result / boundary |
|---|---|---|---|
| 1 | Portfolio dropdown | `#navDropdownPortfolio` and `#mobileSubPortfolio`; original five destination labels retained. `assets/js/main.js` supplies click, hover, ArrowDown, Escape, focus-out, and `aria-expanded` handling. | Present. Destination integration and interaction results belong to website-wide QA; this review does not claim to retest them. |
| 2 | Reports dropdown | `#navDropdownReports` and `#mobileSubReports`; Annual Benefit Reports and Community & Environment groups. | Present. All five annual periods and six community destinations represented. |
| 3 | Blogs label and archive | Desktop/mobile/header/footer use `Blogs` with `insights.html`; navigation `data-nav="insights"`. | Present; no competing Insights label introduced. |
| 4 | Privacy Policy footer link | Footer `Privacy Policy` retains `https://getlagosnow.com/privacy-policy/`. | Present and intentionally original until legal approval; local review page is not an invented replacement policy. |
| 5 | Positioning statement | `#about-title.about__positioning` contains `STRATEGIC INNOVATION.`, `HIGH TOUCH.`, `HUMAN-CENTERED.` | Present; exact phrases appear in source homepage headings. |
| 6 | Certification/recognition badges | `.cert-grid` contains People and Planet First, Benefit Corporations for Good, Women Business Enterprise, Emerging Small Business, Green Business Leaders. | Four match current source homepage badge assets. WBE No. 11991 appears in source footer. People/Planet March 2026 is explicitly reported in 2025 report. Green Business Leaders is an original-hosted asset but absent from current source homepage; current recognition and all issuer validity remain client verification items. No B Lab certification asserted by current local homepage. |
| 7 | Company intro/purpose | `.about__copy-stack` states PDX-based purpose-driven Benefit Company, accessible/inclusive digital work, since 2010; shared footer repeats short company identity. | Present; source homepage says purpose-driven Benefit Company and 360 inclusive approach since 2010. |
| 8 | Visible AI Policy | `#ai-policy` with `.ai-policy__body`, headed `Thoughtful technology. Transparent decisions.` | Present as visible content, not solely a footer link. Full-disclosure/agreement requirement is retained. |
| 9 | Consulting/budget decisions | `.ai-policy__consulting`: consulting to make best budget decisions for marketing, technology, advertising. | Present; source homepage directly corroborates that statement. |
| 10 | Registered Benefit Company | `.about__reg-note` distinguishes Oregon registration from BCFG certification; `#benefit-title` and `.benefit-statement__copy` explain state registration and BCFG. | Present. Current wording avoids conflating Oregon registration, BCFG, and B Lab. Historical source contradictions are separately logged. Registry status was not independently verified in this review. |
| 11 | Annual 5%+ commitment | Benefit statement, `5%+` figure and text identify annual commitment; source homepage states 5%+ in-cash/in-kind profits donations yearly. | Present as commitment, not presented as a newly achieved annual outcome. Historical annual results remain attached to their report periods. |
| 12 | 2025 Annual Benefit Report CTA | `.benefit-statement__report` / nearby link text `Read the 2025 Annual Benefit Report`, plus Reports navigation. | Present. Global integration supplies local report destination; source homepage has corresponding 2025 CTA. |
| 13 | Authentic homepage client testimonials | `#testi` has Scott Thompson/Lexicon Solutions, Lisa Cline/Wallace, Rafael Otto/Children's Institute, Anthony Bellotti/White Coat Waste, Medical Teams International. | All five names/organizations and endorsement substance corroborated by original homepage. Four quoted texts match after surrounding quotation/apostrophe normalization; Children’s Institute has the minor editorial differences below. |

## Testimonial coverage and precise differences

- **Scott Thompson / Lexicon Solutions:** complete local endorsement matches the source paragraph word-for-word after removing the source inline domain link and surrounding typographic quotation marks. Local uses an editorial workspace image, accurately labelled as such; it is not identified as a portrait of Scott.
- **Lisa Cline / Wallace Medical & Dental:** complete endorsement matches source words (`It’s` uses a straight apostrophe locally); CEO, organization and 2025 multilingual/ADA rebuild context appear in the source attribution. Clinic image is authentic original-hosted imagery, not stock represented as staff.
- **Anthony Bellotti / White Coat Waste:** complete endorsement matches source words. Local expands organization display to `White Coat Waste Project — Public Policy DC`; source identifies `White Coat Waste - Public Policy DC` and links the same organization. Editorial wireframe image is not presented as Bellotti’s portrait.
- **Medical Teams International:** complete endorsement matches source words. Original homepage attributes it to the organization, not a named individual. Local retains that distinction.
- **Rafael Otto / Children’s Institute:** source says `This work happens behinds the scenes` and ends `Thank you, GLN!`; local corrects `behinds` to `behind` and omits the closing thanks. This is an authentic endorsement with minor pre-existing editorial alteration, not an invented quote. Exact preservation or explicit excerpt/editorial notation is recommended if the client requires verbatim quotations. Attribution is supported by source homepage text (`Rafael Otto//Children’s Institute in Portland, Oregon`). Building Futures artwork is authentic Children’s Institute source material.

## Badge provenance and approval limits

Current source homepage contains these exact original assets:

- `/wp-content/uploads/2025/02/ESB-Small-300x266.png`
- `/wp-content/uploads/2025/02/WBE-Small-1.png`
- `/wp-content/uploads/2026/02/people-planet-logo-227x300.png`
- `/wp-content/uploads/2023/05/bcfg-logo-outline.png` (local uses the same published 300px variant)

Local `Washington-County-Green-Business-Leaders.png` is an original-hosted historical asset, but was not present in this current homepage snapshot. It should not be treated as independently verified current recognition solely because that image downloads. The source homepage contains no B Lab badge or B Lab certification statement. The existing local homepage distinguishes Benefit Company registration and BCFG certification, while historical reports contain a different claim. Issuer/registry verification is not established merely by the company’s own published badge.

## Report content integrity coverage

`reports-content-integrity.json` records **all 11 report/community pages**, not a sample. For each, the audit parses original `content.rendered` and the local `.report-body`, decodes entities with the browser DOM, normalizes whitespace/Unicode, removes exact logged exclusions, ignores builder styles/scripts/iframes and duplicate title/decorative motto text, and compares ordered words using longest common subsequence. All 11 retained **100% of meaningful normalized source words after those documented exclusions**, with zero removed words. Generated review explanations and original-video/image fallback link labels are explicitly accounted for; no summary was substituted for full source content.

The excluded exact HTML remains in `reports-content-review.json` and raw API snapshots. Four historical “B Corp Certified” paragraphs and five associated badge instances are withheld pending approval; two obvious unrelated injected anchors are removed. Original financial numbers, volunteer hours/miles, recipients, testimony, source publication periods, and conflicting event dates remain unchanged. The 2025 report’s explicit 2026 passages remain present and labelled in context.

## Final integration notes

The root agent has now labelled Green Business Leaders as **Historical recognition · 2020** and changed the badge-section introduction from “Verified” to “Published” credentials. This resolves the implication of independently established current standing; issuer validity remains a client review item. The approved Children’s Institute quote remains unchanged as an excerpt with an editorial typo correction. It should not be described as an exact transcription of the entire original paragraph.

All five homepage blockquotes can cite `https://getlagosnow.com/`, where each complete source quotation and attribution was directly verified in `tools/source/homepage.html`. Children’s Institute also has the verified client-showcase source `https://getlagosnow.com/2024/12/19/2025-client-showcase-the-childrens-institute/`; the homepage is the direct evidence for Rafael Otto’s personal attribution.

## Open decisions

- Confirm current certification/recognition validity with issuers; especially Green Business Leaders provenance/current standing and historical B Lab wording.
- Approved testimonial excerpts retain their current body; the client may request exact original spelling/full transcription if desired.
- Keep the original published privacy policy linked until legal approves corrected responsible-entity wording.
- Record client-facing AI-assisted implementation disclosure/agreement before launch; this review does not infer third-party client approval from the site policy.
- Configure real contact/newsletter endpoints and approved social-account links before public launch; no live submissions were made here.
