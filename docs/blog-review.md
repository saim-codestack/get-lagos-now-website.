# Blog migration review

49 public posts retrieved through the WordPress API on 28 October 2026. The API reports one page at per_page=100; all published post records are included, including six client showcases. Original API responses remain in tools/source/blog-posts.json; categories and publishing account records are alongside them.

48 full legitimate article bodies migrated; one certification recognition article (ID 3331) retains its title, original publication date, author account, source link, and a visible review notice while its conflicting B Lab/BCFG claim is withheld. No AI-written replacement body was generated.

## Source integrity

- Two exact adult-spam anchors were removed from Strategic IT (2655) and Going More Green (1154). Full excluded HTML is recorded in blog-content-review.json. Legitimate surrounding article content is retained. Source owner should clean the originals.
- ID 3331 claims 2022 top-5% BCorp computer-company recognition and B Corp certification. Evidence and distinction from BCFG registration/certification are required before republishing.
- ID 3223 discusses B Lab certification generically and explicitly distinguishes it from Benefit Corporation registration. It is retained as a dated article, not a GLN credential; statistics, fees, renewal intervals, and historic badge usage require client review.
- Accessibility and privacy articles contain legal interpretations and statistics requiring legal verification. Dates and source statements are retained with archival notices.
- The March 2026 ChatGPT article includes broad security and model claims requiring technical review. The dated source text is preserved and visibly marked for review, without silently rewriting its meaning.
- Pre-2024 technical, marketing, and statistical material is preserved as history and flagged for freshness review.
- Distinct ADA articles (2019, 2024, 2026) and similar marketing posts are retained as separate URL records; they were not deduplicated merely for similar titles.
- Third-party inline image licensing is unverified; those images remain explicit original-image links rather than copied assets. Failed source assets are recorded in blog-assets.json.
- Where explicit body bylines exist they take precedence; otherwise the verified API publishing account mlagos is displayed transparently. No author identity inferred from the account name.

## Implementation

The approved Insights hero, featured layout, dark editorial feature, topic navigation, asymmetrical grid, CTA, and footer are preserved. All 49 records exist as static links without JavaScript. New blogLibrary IDs avoid the old fixed-list script; blog-library.js adds accessible filters and Load More. Source categories are retained verbatim in inventory and labels; broader archive topic groupings are recorded separately. Every article has an independent HTML URL, source citation, original date metadata, and related links.

Global navigation integration and comprehensive browser QA are managed by the main implementation agent.

## Verification updates

- Corrected four source email anchors that lacked the mailto: scheme; visible text and destinations are retained.
- Scanned migrated HTML bodies and metadata for the known injected adult spam: no matches remain. Meta descriptions use cleaned body text, with factual title/date fallback for image/video-only source posts.
- Seven representative pages (archive and six article variants) passed all seven specified viewport widths with no overflow, broken images, or JavaScript errors; all-article sweep is recorded separately.
- All 49 article local href/src targets exist after normalizing bare source email anchors.
- Browser filter check:49 records, Client Showcase exactly 6, Load More 12 to 20.
- Body integrity: 48 legitimate bodies checked against source after exact spam removal;41 exact text matches and 7 with spacing or added unavailable-image/video link labels; no missing source-word cases.

All 49article pages also passed 343 viewport checks (1920,1440,1280,1024,768,390,360):zero horizontal overflow, zero broken image elements, zero JavaScript exceptions, one H1 each. See docs/qa/responsive-all-articles.json.
