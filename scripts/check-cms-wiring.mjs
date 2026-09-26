#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Guards the admin CMS against dead fields.
//
// The admin CMS (src/pages/admin/CMSPage.jsx) renders an editor for every entry
// in src/content/cmsFields.js. If a page in that registry is never read by the
// public site, an admin can edit the field, hit Save, see the green "Custom"
// badge — and nothing changes for visitors. That is the exact failure this
// script exists to prevent.
//
// For every registered field it asserts that site code (never the admin page,
// never this script) references it via cmsText()/cmsParagraphs()/
// getCMSContent(). It also flags a page slug that nothing reads at all, and a
// cmsText() call naming a field that isn't in the registry (a typo, or a field
// someone deleted without removing its usage).
//
// Run: npm run verify:cms
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryFile = path.join(root, "src/content/cmsFields.js");
const srcDir = path.join(root, "src");

// Files that legitimately mention field ids but do not render them.
const IGNORED = [
  "src/content/cmsFields.js",
  "src/hooks/useCMS.js",
  "src/pages/admin/CMSPage.jsx",
  "scripts/check-cms-wiring.mjs",
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.jsx?$/.test(entry.name) && !entry.name.includes(".bak.")) {
      acc.push(path.relative(root, full));
    }
  }
  return acc;
}

const siteFiles = walk(srcDir).filter((f) => !IGNORED.includes(f));
const siteCode = siteFiles.map((f) => ({ file: f, code: fs.readFileSync(path.join(root, f), "utf8") }));

// ---------------------------------------------------------------------------
// Read the registry without importing it (it is ESM with a "@/" alias that only
// Vite resolves). Pulls page slugs and section ids straight out of the source.
// ---------------------------------------------------------------------------
const registry = fs.readFileSync(registryFile, "utf8");
const pagesStart = registry.indexOf("export const CMS_PAGES");
const pagesEnd = registry.indexOf("const FIELD_DEFAULTS");
if (pagesStart < 0 || pagesEnd < 0 || pagesEnd < pagesStart) {
  console.error("Could not locate CMS_PAGES in src/content/cmsFields.js");
  process.exit(1);
}
const pagesBlock = registry.slice(pagesStart, pagesEnd);

const PAGES = [];
const pageRe =
  /id:\s*"([^"]+)",\s*\n\s*label:\s*"[^"]*",\s*\n\s*group:\s*"[^"]+",\s*\n\s*sections:\s*\[([\s\S]*?)\n\s{4}\],/g;
let pageMatch;
while ((pageMatch = pageRe.exec(pagesBlock)) !== null) {
  const sections = [];
  const sectionRe = /\{\s*id:\s*"([^"]+)",\s*name:\s*"[^"]*"/g;
  let sectionMatch;
  while ((sectionMatch = sectionRe.exec(pageMatch[2])) !== null) {
    sections.push(sectionMatch[1]);
  }
  PAGES.push({ id: pageMatch[1], sections });
}

// ---------------------------------------------------------------------------
// Collect every cmsText() / cmsParagraphs() / getCMSContent() call site.
// ---------------------------------------------------------------------------
const CALL_RE =
  /(?:cmsText|cmsParagraphs|getCMSContent)\(\s*(?:"([^"]+)"|'([^']+)')\s*,\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))/g;

const used = new Set();
const calls = [];
const seenInFile = new Map();

for (const { file, code } of siteCode) {
  let m;
  CALL_RE.lastIndex = 0;
  while ((m = CALL_RE.exec(code)) !== null) {
    const pageId = m[1] ?? m[2];
    const sectionId = m[3] ?? m[4] ?? m[5];
    calls.push({ file, pageId, sectionId, dynamic: !(m[3] || m[4]) });
    if (!m[5]) {
      const key = `${pageId}:${sectionId}`;
      used.add(key);
      if (!seenInFile.has(key)) seenInFile.set(key, file);
    }
  }
}

const known = new Set();
for (const page of PAGES) {
  for (const section of page.sections) known.add(`${page.id}:${section}`);
}

const problems = [];
let total = 0;

// 1. Every registered field must be read by site code.
for (const page of PAGES) {
  const missing = page.sections.filter((s) => !used.has(`${page.id}:${s}`));
  total += page.sections.length;
  if (missing.length) {
    problems.push(
      `DEAD FIELD(S) on "${page.id}": ${missing.join(", ")}\n` +
        `    The admin lets you edit these, but no page renders them.`
    );
  }
}

// 2. Every cmsText() page slug must exist in the registry.
for (const pageId of new Set(calls.map((c) => c.pageId))) {
  if (!PAGES.some((p) => p.id === pageId)) {
    problems.push(
      `UNKNOWN PAGE SLUG "${pageId}" — cmsText() is called with a page that is not in src/content/cmsFields.js. It will always fall back to "" (empty).`
    );
  }
}

// 3. Every literal cmsText() section id must exist in the registry.
for (const call of calls) {
  if (call.dynamic) continue;
  const key = `${call.pageId}:${call.sectionId}`;
  if (known.has(key)) continue;
  if (PAGES.some((p) => p.id === call.pageId)) {
    problems.push(
      `UNKNOWN FIELD "${key}" referenced in ${call.file} — no such section in the registry, so it renders as empty.`
    );
  }
}

// 4. A page slug that is never read at all.
const readPages = new Set(calls.map((c) => c.pageId));
for (const page of PAGES) {
  if (!readPages.has(page.id)) {
    problems.push(`NO USAGE: the entire "${page.id}" page (${page.sections.length} fields) is never read.`);
  }
}

// 5. Any file that reads CMS text must also subscribe to CMS updates, otherwise
//    it renders the fallback once and silently ignores every later save.
const SELF_SUBSCRIBING = new Set(["src/hooks/useCMS.js", "src/content/cmsFields.js"]);
for (const { file, code } of siteCode) {
  if (SELF_SUBSCRIBING.has(file)) continue;
  CALL_RE.lastIndex = 0;
  const readsCms = CALL_RE.test(code);
  CALL_RE.lastIndex = 0;
  if (!readsCms) continue;
  // Match a real call, not just the identifier in the import statement.
  if (!/\buseCMSReady\s*\(/.test(code)) {
    problems.push(
      `NO LIVE UPDATES: ${file} calls cmsText()/getCMSContent() but never calls useCMSReady(). ` +
        `It will render the default text and ignore anything an admin saves.`
    );
  }
}

// ---------------------------------------------------------------------------
const dynamic = calls.filter((c) => c.dynamic);
if (dynamic.length) {
  console.log(
    `note: ${dynamic.length} call site(s) build their section key at runtime (e.g. About impactStat1..3) — checked by hand.`
  );
}

if (problems.length) {
  console.error(`\nCMS wiring check FAILED — ${problems.length} problem(s):\n`);
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
  console.error(
    "\nEvery field in src/content/cmsFields.js must be rendered by the public site.\n" +
      "Either wire it into the relevant page with cmsText(\"<page>\", \"<field>\"),\n" +
      "or delete it from the registry so the admin stops advertising it.\n"
  );
  process.exit(1);
}

console.log(
  `CMS wiring OK — all ${total} fields across ${PAGES.length} pages are read by the site.`
);
