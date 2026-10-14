# Kadesh website — projects in tabs

This package includes the requested corrections to the previous website ZIP.

## Three category pages

- **Education:** Lumina Charis (Education Centers) and Child to School.
- **Healthcare:** Ohana Care Clinic and Homecare.
- **Social Development:** Bethlehem Bread and Borewell.

Each page shows only its own two project tabs. The extra Education / Healthcare / Social Development selector has been removed from the category-page content. Selecting a tab displays that project's descriptions, gallery, impact information, and available downloads on the same page. The tab bar stays available while scrolling. There is one shared page heading and no repeated project-page navigation inside a tab.

The projects overview now presents only the three category choices. The homepage still has three foundation cards and the four requested featured projects. Navbar subcategories, foundation project links, and featured cards open the relevant category with its matching project tab selected.

## URLs and saved links

The three category pages are:

- `/projects/education`
- `/projects/healthcare`
- `/projects/social-development`

A selected project can be linked directly, for example:

`/projects/education?project=child-education#project-tabs`

Refreshing, using Back/Forward, or sharing this link preserves the selected project. Old standalone project URLs redirect to the matching tab. No separate public page is rendered for those six projects. Existing CMS-created projects retain their original functionality.

Tabs support keyboard arrows, Home, End, and visible focus. Both project tabs remain visible on small screens, and animations respect reduced-motion preferences.

## Run the updated website

1. Extract this package into a new folder.
2. Copy your existing `.env.local` into that folder. Local credentials are intentionally omitted; `.env.example` is provided as a reference.
3. Use Node.js 22.12 or newer. Run `npm ci`, then `npm run dev`.
4. Run `npm run build` to generate `dist` for deployment.

The included Vercel configuration supports direct category links. Other hosts need the usual single-page-app fallback to `index.html`.

## Main changed files

- `src/lib/programs.js`: category/project catalog and tab links.
- `src/pages/projects/ProgramCategory.jsx`: tab state, accessible controls, project content.
- `src/pages/projects/ProjectsOverview.jsx`: three category choices.
- `src/pages/projects/program-pages.css`: responsive tab and content styling.
- Existing project modules: reusable content sections.
- `src/App.jsx`: redirects old project URLs to category tabs.
- Desktop/mobile menus: correct selected-tab highlighting.
- `public/sitemap.xml`: category pages as the canonical project destinations.

## Verification

The tabbed implementation passed its production build, 627 browser checks, and 12 normal-motion checks. This correction was rebuilt and received focused desktop/mobile checks for removal of the extra category row and continued project-tab operation. Coverage includes both tabs of every category, full content, retained galleries/impact/download links, exact tab counts, desktop/mobile menu links, old-URL redirects, refresh, Back/Forward, keyboard controls, and 1440/1024/390/320-pixel layouts. No browser JavaScript errors or local HTTP errors were detected.

Checks use built-in site content with external services blocked; payments, form submissions, and account operations were not exercised. The original project still lacks an ESLint 9 configuration; its existing ambiguous Tailwind easing warning does not prevent building.

Source, public images and PDFs, configuration, and the dependency lockfile are included. Local credentials, installed dependencies, generated builds, repository history, and old backup files are omitted. Previous ZIP files remain unchanged.
