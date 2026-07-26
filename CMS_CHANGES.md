# useCMSReady Migration — July 26, 2026

## Summary
Added `useCMSReady()` to page components that call `getCMSContent(...)` directly in JSX,
ensuring they re-render when CMS content updates via the `cms:updated` event.

## Files Changed

### 1. `src/pages/Home.jsx`
- **Line 18**: Updated import from `{ getCMSContent }` to `{ getCMSContent, useCMSReady }`
- **Line 74**: Added `useCMSReady();` as first line in `Home()` component
- **27 `getCMSContent` call sites** across hero, pillars, who-we-are, projects, gallery, testimonials, donate, and partners sections

### 2. `src/pages/About.jsx`
- **Line 34**: Updated import from `{ getCMSContent }` to `{ getCMSContent, useCMSReady }`
- **Line 138**: Added `useCMSReady();` as first line in `AboutUs()` component
- **1 `getCMSContent` call site** in the `HeroSection` sub-component (heroSubtitle)

## Files Skipped

| File | Reason |
|------|--------|
| `src/pages/admin/CMSPage.jsx` | Imports `primeCMSCache`, not `getCMSContent`. Admin page updates the cache, doesn't read it. |
| All other 34 .jsx files under `src/pages/` | Do not import or call `getCMSContent` directly. |

## No files use `useCMSReady()` yet

Prior to this change, zero files imported or called `useCMSReady` — it was defined
and exported from `src/hooks/useCMS.js` but never used.

## Verification

Build succeeds without errors: `npm run build` ✓
