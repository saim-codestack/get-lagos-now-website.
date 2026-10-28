# Development helpers

Production consists only of root HTML, reports/, articles/ and assets/. No Node runtime, package manager, CMS or build is needed in production.

- preview.mjs: optional static local HTTP server (127.0.0.1:5180).
- qa-static.mjs: local links, anchors, IDs, metadata and alt-attribute checks.
- browser.mjs and qa-*.mjs: executed browser checks; require an authorized Chrome debugging endpoint. Do not run responsive checks unless requested; the user accepted responsiveness and requested no further checks.
- fetch-*.mjs and source/: migration-time retrieval tools/raw evidence. They may require network authorization and are not a production dependency.
- build-*.mjs: one-time source preparation helpers. They are not a repeatable production build: review before use because current HTML includes later integration/manual corrections.
- integrate.mjs then finalize-inventory.mjs: URL integration/inventory preparation, to review before rerunning after manual edits.
- create-sitemap.mjs: use only after confirming the actual production HTTPS base. It does not guess a domain.

Do not publish tools/ or raw source artifacts. Current HTML and runtime assets are the final source of truth.
