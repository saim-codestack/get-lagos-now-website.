# Phase 1 — Audit: Eleventy refactor of Get Lagos Now

Date: 28 October 2026 · Baseline commit: `7d9e65d` (V1.0) · Refactor branch work: session branch `arena/6d524fe5-get-lagos-now-website` (branched from `main`; `main` untouched).

> Arena note: this session is bound to `arena/6d524fe5-get-lagos-now-website`, so all refactor phases live on it. To get the literal `refactor/eleventy-templates` name later: `git checkout arena/6d524fe5-get-lagos-now-website && git checkout -b refactor/eleventy-templates`. Nothing is pushed or merged to `main`.

**Phase 1 scope honored:** read-only inspection plus new documentation/tooling under `docs/refactor/` and `tools/refactor/` only. No existing file was modified, moved, or deleted. No Eleventy packages installed.

---

## 1. Current state summary

| Fact | Value |
|---|---|
| Stack | Static HTML5 + CSS3 + vanilla JS. Zero dependencies, no build, no `package.json`, no `.gitignore` |
| Pages | **73 production HTML files** = 13 root + 49 `articles/` + 11 `reports/` |
| HTML weight | 1,664,626 bytes (~1.66 MB) |
| Duplicated shell per page | `head` boilerplate (13 lines) + `site-header`/nav + mobile menu (126 lines) + `footer` + newsletter (79 lines) + closing CTA banner (17 lines) ≈ **235 lines ≈ 14 KB × 73 pages ≈ 17 k duplicated lines** |
| Images | 414 local files, 66 MB (`blogs/` 157, `reports/` 109, `shared/` 57, `nonprofit/` 6, `certifications/` 5, portfolio dirs) |
| CSS | 220 KB across 13 files; JS 52 KB across 3 files |
| External runtime deps | Google Fonts (Inter/Manrope) + Pexels editorial photography; 773 external link references |
| Tooling | `tools/` = migration/QA scripts + `tools/source/` raw WordPress evidence (dev-only, never deployed) |
| QA baseline | `docs/qa/*` — static scan, interactions, responsive (73 pages × 7 widths), external links, accessibility spot checks. **All PASS.** This is the acceptance bar for the refactor. |
| SEO state | Per-page `<title>`+`description` everywhere; `article:published_time`/`modified_time` on all 49 articles; **`noindex` on exactly 2 pages** (`privacy-policy.html`, `articles/5-bcorp...2022.html`); **no canonical tags** (deliberate — domain unconfirmed); theme-color on 72/73 (see §7) |

## 2. HTML file categorization

| # | Group | Files | data-page | CSS bundle | JS bundle |
|---|-------|-------|-----------|------------|-----------|
| A | **Core 7 main pages** | `index`, `about`, `services`, `work`, `contact`, `impact`, `insights` | home/about/services/work/contact/impact/insights | style + responsive + page css (index: none) | main.js (+ blog-library.js on insights) |
| B | **Approved portfolio categories** | `portfolio-energy-efficiency`, `portfolio-nonprofit` | work | + portfolio-category | main.js |
| C | **New portfolio categories** | `portfolio-medical-dental`, `portfolio-gln-projects` | work | + portfolio-category + portfolio-complete | main.js (+ portfolio-library.js on gln) |
| D | **Reports archive** | `reports.html` | reports | + portfolio-category + reports | main.js |
| E | **Report detail** | `reports/*.html` × 11 | reports | + portfolio-category + reports | main.js |
| F | **Articles** | `articles/*.html` × 49 | insights | + insights + articles | main.js |
| G | **Utility** | `privacy-policy.html` (noindex) | privacy | + reading | main.js |

Every page has exactly **one `<h1>`** (asserted by `tools/refactor/phase1-url-inventory.mjs`).

## 3. Duplicated structures → reusable components

All verified by grep counts across all 73 pages:

| Component | Pages | Notes for template extraction |
|---|---|---|
| `<head>` boilerplate (charset, viewport, title, description, theme-color, favicon, fonts preconnect+stylesheet, css links) | 73 | Parameterize: title, description, robots (2 pages noindex), article times (49), favicon prefix `assets/` vs `../assets/`, page css list |
| `site-header` desktop nav (nav-pill + Portfolio dropdown + Reports grouped dropdown) | 73 | One template; active state comes from `data-page` already handled by main.js |
| Mobile menu w/ accordion submenus | 73 | One template |
| Header actions ("Have a project?" + Let's Talk + hamburger) | 73 | One template |
| Footer (brand col, 3 nav cols, newsletter form, bottom bar w/ year) | 73 | One template; social placeholders are text, not links — keep |
| Closing `cta__banner` ("Let's Talk." + Start a project) | 73 | Present on **every** page incl. articles (`journal-cta`) & reports (`pc-cta`) — one component with variant class |
| `skip-link` | 73 | In base layout |
| Article shell: `article-heading` (back link, eyebrow, h1, meta) + `article-featured` + `article-reading` > `article-archive-note` + `article-body` + `article-source` + `article-related` | 49 | Layout `article.njk`; 48/49 have featured image (the BCorp review record has none) |
| Report shell: `report-heading` + `report-source` + `report-reading` > `report-body` + `report-next` prev/next nav | 10/11 | `e-recycling-pdx.html`-style variants differ slightly — model per record |
| Reports archive: `report-feature` + `report-library-row` × 5 + `report-community-grid` × 6 | 1 | Data-driven list from `reports.json` |
| Inner-page hero (`inner-page-hero`) | insights + portfolio pages | Shared partial |
| Work-page filter bar (`#workFilters` buttons) + `work-card` grid | work.html | Data-driven from `portfolio.json` |
| GLN grid filter (`data-gln-*`) + `pc-project` cards × 39 | gln-projects | Data-driven from `gln-projects` data |
| Blog library (filter chips + `journal-card` × latest + `journal-row` list + Load More) | insights | Data-driven from `articles.json` — **cards+rows must exist in static HTML** (JS only toggles) |
| Inquiry form `#inquiryForm`, contact form `#projectInquiryForm`, newsletter `#newsletterForm`, FAQ accordion, testimonial carousel | page-specific | Components in page templates or partials |

### Data schemas implied by existing markup (Phase 3–5 `_data/*.json`)

- **articles.json** (49): slug, title, categories[], label, date, modified, author, excerpt, featuredImage+alt, bodyHtml (verbatim), sourceUrl, related[], robots, archiveNoteText
- **reports.json** (11): slug, title, year, kind (annual/event/overview), heading, deck, sourceUrl, bodyHtml, prev/next
- **glnProjects.json** (39): id, title, categories[] (graphics/marketing/tech/websites), description, image, originalUrl
- **medicalClients.json** (6) + work-grid entries; **testimonials.json** (5 homepage slides), **navigation.json** (header/footer/report menus)

## 4. URL inventory (authoritative)

`tools/refactor/phase1-url-inventory.mjs` → `docs/refactor/url-inventory.json` + `.csv`. Per page: url path, file, group, title, meta description, robots, OG times, data-page, css/js bundles, h1, link/image counts, byte size, word count, sha256 hashes of full source and normalized visible text.

Phase 6 compares the built `_site/` against this inventory: **same 73 paths, same titles/descriptions/h1, same link targets, same robots flags, h1 count = 1**, then hashText/word-count tolerance check (verbatim bodies → near-exact match) plus the existing `tools/qa-*.mjs` suites re-run on the output.

## 5. Recommended folder structure (Eleventy)

Keep every existing file in place until Phase 6. New tree added alongside:

```
├── package.json               # NEW — devDependency: @11ty/eleventy (pinned), scripts: build/serve
├── .gitignore                 # NEW — node_modules/, _site/
├── eleventy.config.js         # NEW — input: src/, output: _site/, passthrough assets/, Nunjucks
├── src/
│   ├── _data/
│   │   ├── site.json          # name, legal entity, location, logo, footer columns, social placeholders
│   │   ├── navigation.json    # header menu, portfolio/reports dropdowns, footer columns
│   │   ├── layout.js          # pathPrefix helper (root vs ../ prefixing) — see risk R2
│   │   ├── articles.json      # Phase 3
│   │   ├── reports.json       # Phase 4
│   │   ├── glnProjects.json   # Phase 5
│   │   └── portfolio.json     # Phase 5 (work grid, medical clients)
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk       # html shell: head + header + <main> slot + cta + footer + scripts
│   │   │   ├── article.njk    # extends base — Phase 3
│   │   │   └── report.njk     # extends base — Phase 4
│   │   └── components/
│   │       ├── head-meta.njk  site-header.njk  mobile-menu.njk  site-footer.njk
│   │       ├── newsletter-form.njk  cta-banner.njk  inner-page-hero.njk
│   │       ├── inquiry-form.njk  contact-form.njk  faq-accordion.njk  testimonial-carousel.njk
│   ├── articles/  (49 *.njk, front matter + verbatim body HTML)      # Phase 3
│   ├── reports/   (11 *.njk)                                         # Phase 4
│   ├── *.njk      (13 root pages: index, about, services, work,      # Phase 2 + 5
│   │              contact, impact, insights, reports, privacy-policy,
│   │              portfolio-{energy-efficiency,nonprofit,medical-dental,gln-projects})
├── _site/      # build output (gitignored) — Phase 6 Netlify publish dir
├── (existing 73 HTML files — untouched until Phase 6 cutover deletion, after review)
├── assets/  docs/  tools/   # unchanged; tools/, docs/, tools/source stay OUT of _site
└── netlify.toml # Phase 6 — build: "npx @11ty/eleventy", publish: "_site"
```

**URL preservation strategy:** Eleventy's default permalink would turn `articles/foo.njk` into `/articles/foo/index.html` — **that breaks URLs**. Global fix in config/computed data: `permalink: "/{{ page.filePathStem }}.html"` → outputs `/about.html`, `/articles/foo.html`, `/reports/annual-benefit-2025.html`, `/index.html` = byte-identical paths to today.

## 6. Migration plan, Phases 2–6

| Phase | Scope | Deliverables / exit check |
|---|---|---|
| **2** | Scaffold + layouts + core pages | `package.json` (11ty pinned), `.gitignore`, `eleventy.config.js`, `src/_data/site.json` + `navigation.json`, base layout + all shared components, 7 main pages + privacy-policy migrated as templates. Build emits 8 pages to `_site/`; DOM-diff vs originals (whitespace-tolerant) shows zero content/attribute drift; existing files untouched. |
| **3** | Blogs | `articles.json` (49 records, verbatim bodies as HTML — **not Markdown**, see R1), `article.njk`, insights.html data-driven (library grid + rows stay static HTML), blog-library.js contract preserved. Build emits 50 pages; hashText match per inventory. |
| **4** | Reports | `reports.json` (11 records), `report.njk`, reports.html archive from data. 61 pages; prev/next nav + headings verified per inventory. |
| **5** | Portfolio | `glnProjects.json` (39) + portfolio.json; work.html grid, 2 approved category pages, medical-dental, gln-projects data-driven; portfolio-library.js + main.js filter contracts preserved. All 73 pages build. |
| **6** | QA + SEO + Netlify | URL diff vs `url-inventory.json` (73/73), titles/descriptions/robots identical, re-run `tools/qa-static.mjs` + interaction/QA suites on `_site/`, link check, `netlify.toml`, Netlify build test, **then** review-approved deletion of old root HTML + cutover; update HANDOFF. |

## 7. Migration risks (R#) & mitigations

- **R1 — Markdown/HTML body corruption.** Archived bodies contain tab-indented WordPress HTML (e.g., ada article). Feeding them through Markdown would turn indents into code blocks and alter text. → Use `.njk` files with raw HTML content and `{{ bodyHtml | safe }}` (or raw `.html` templates), never `.md`.
- **R2 — Relative-path prefixing.** Root pages reference `assets/...`; articles/reports use `../assets/...`. Templates must emit the **same relative strings** per depth (helper that prefixes per page depth) so output HTML is identical; do not convert to root-relative mid-refactor (risk of subtle breakage + diff noise).
- **R3 — Auto-escaping.** Nunjucks `{{ }}` escapes HTML → all content fields output with `| safe`; use `{% verbatim %}` where needed in bodies containing `{{`/`{%` sequences (check bodies for template-syntax collisions in Phase 3 — any hits get escaped or stored uninterpreted).
- **R4 — JS DOM contracts.** `main.js`, `blog-library.js`, `portfolio-library.js` depend on exact ids/classes/attrs: `#blogLibraryGrid` card+row children (progressive enhancement — all 49 links present without JS), `data-gln-*`, `#workFilters`/`data-slot` pattern, testimonial `data-img`, form field ids (`fName`, `ctName`…), honeypot `#ctRole`, newsletter ids. Templates reproduce markup verbatim; Phase 6 re-runs browser QA suites.
- **R5 — SEO drift.** Titles/descriptions truncated mid-word on some articles (source behavior) must stay identical — inventory hashes enforce. Keep `article:published/modified_time`, keep the 2 noindex flags, keep zero canonicals (domain unconfirmed), keep theme-color per page — note `privacy-policy.html` currently has **no** theme-color (preserve as-is, do not "fix").
- **R6 — Divergent duplicate markup.** Generated pages differ from hand-authored ones: header logo `width/height` 190×40 vs 330×84 (CSS fixes render at 34px height → normalization invisible), aria-label `-` vs `—`, stray trailing class space on reports toggles, `©` vs `&copy;`, footer word-order variants. Shared template normalizes these; each is render-neutral — logged in `normalization-log` (below) so reviewers can verify "visually unchanged".
- **R7 — Orphaned JS paths.** `main.js` contains dormant journal code (`#journalFilters` — 0 pages use it now; articles/insights use blog-library instead). Preserve file as-is in Phase 2–6; flag optional cleanup post-refactor with user approval only.
- **R8 — Asset volume in build.** 66 MB / 414 images passthrough each build — fine locally; keep passthrough copy (not symlink) for Netlify reproducibility; consider `setServerPassthroughCopyBehavior` irrelevant (no dev server dependency).
- **R9 — Repo directory name ends with `.` (`get-lagos-now-website.`).** Works on Linux/Node 22; `package.json` `name` must be a clean slug (`get-lagos-now-website`); no tooling should derive names from `basename(process.cwd())`.
- **R10 — Content integrity declarations.** Archived bodies include recorded exclusions/review notes (HANDOFF §D/E). Data extraction must reproduce **public HTML only**, never re-introduce excluded fragments from `tools/source/`. Source of truth = current HTML files, not `tools/source/*.json`.
- **R11 — Getting data wrong by scraping templates.** Extraction scripts pull per-article fields from current HTML (authoritative), cross-check counts against `docs/blog-inventory.json` (49 posts) — mismatch = stop and review.
- **R12 — Netlify/build reproducibility.** Pin Eleventy version, commit `package-lock.json`, set `NODE_VERSION=22` in netlify.toml, publish `_site`, build cmd `npx @11ty/eleventy`. Old root HTML must not be inside Eleventy's input dir (input = `src/` only) so the build can't ingest the legacy files.
- **R13 — Dev-preview parity.** Existing `tools/preview.mjs` serves repo root; after cutover it should serve `_site/` (Phase 6 config note, not Phase 2).

### Normalization log (intentional, render-neutral markups unified by shared templates)
1. Header logo attrs → single `width="190" height="40"` (CSS `.header__logo img { height:34px; width:auto }` already dictates display size).
2. Logo aria-label → single `Get Lagos Now — home` (em-dash; screen-reader-only text).
3. Remove trailing space in `class="nav-dropdown__toggle "` on 14 report pages (no selector impact).
4. Footer `©` vs `&copy;` → `&copy;` (identical glyph).
5. Keep as-is (intentionally **not** normalized): privacy-policy absent theme-color, 2 noindex tags, missing featured image on the certification-review article, `is-active` dropdown toggle state baked on portfolio pages (must be reproduced per page via `data-page` logic — verify visuals per page in Phase 6).

## 8. Exact file changes in Phase 2 (preview, not executed)

**Created (16):**
- `package.json` — `{ "name": "get-lagos-now-website", devDependencies: { "@11ty/eleventy": "<pinned>" }, scripts: { build, serve } }`
- `package-lock.json` (npm install artifact)
- `.gitignore` — `node_modules/`, `_site/`
- `eleventy.config.js` — input `src/`, output `_site/`, Nunjucks, passthrough `assets/`, global `.html` permalink, `article:published_time`… passthrough meta support via front matter
- `src/_data/site.json`, `src/_data/navigation.json`
- `src/_includes/layouts/base.njk`
- `src/_includes/components/head-meta.njk`, `site-header.njk`, `mobile-menu.njk`, `site-footer.njk`, `newsletter-form.njk`, `cta-banner.njk`
- `src/index.njk`, `src/about.njk`, `src/services.njk`, `src/work.njk`, `src/contact.njk`, `src/impact.njk`, `src/insights.njk`(+ blog data placeholder), `src/privacy-policy.njk` (8 page templates; insights gets its library wiring in Phase 3)
- `tools/refactor/phase2-dom-diff.mjs` (whitespace-tolerant equivalence check vs originals)

**Modified:** none. **Deleted:** none. Existing 73 HTML pages remain byte-identical and served from root until Phase 6 cutover review.

**Phase 2 exit check:** `npx @11ty/eleventy` builds; `_site/` contains 8 pages at identical URLs; DOM-diff passes; `git status` shows only new files; `main` untouched; no design/content deltas.

## 9. Phase 1 artifacts

- This document — `docs/refactor/phase-1-audit.md`
- URL inventory — `docs/refactor/url-inventory.json` / `url-inventory.csv` (73 pages, hashes for Phase 6 comparison)
- Generator (re-runnable, read-only) — `tools/refactor/phase1-url-inventory.mjs`

**Status: Phase 1 complete — awaiting your review before Phase 2 begins.**
