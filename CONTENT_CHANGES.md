# Site Content Updates — July 26, 2026

## Summary
Content, UI, and bug-fix changes across the Kadesh Hope Mission site.

---

## 1. About Page (`src/pages/About.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Mission statement (line 317) | "transform lives and uplift communities in Uganda and Kenya" | "transform lives and uplift communities in Africa" |
| Impact stat title (line 69) | "Combating Hunger & Malnutrition" | "Food Security & Malnutrition" |

---

## 2. Constants (`src/constants/index.js`)
| Change | Before | After |
|--------|--------|-------|
| Ministry area title (line 92) | "Combating Hunger" | "Food Security" |

---

## 3. Child Education Project (`src/pages/projects/ChildEducation.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Key fact (line 53) | `value: "5", label: "Schools Built"` | `value: "1", label: "School Built"` |

---

## 4. Home Care Project (`src/pages/projects/HomeCare.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Gallery image (line 53) | `"/Egypt/IMG-20250205-WA0007.jpg"` (Egypt health outreach) | `"/images/healthcare/healthcare_1.jpg"` (Health outreach) |

---

## 5. Borewell Project (`src/pages/projects/Borewell.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Key fact (line 52) | `value: "25+", label: "Borewells Installed"` | `value: "1", label: "Borewell Installed"` |

---

## 6. Lumina Charis School (`src/pages/projects/LuminaCharis.jsx`)
Added two new paragraphs after the objectives section (lines 219-224):
- Extra skills taught: abacus, mental maths, music, sports, agriculture activities
- Facilities: boarding facilities, transport, school garden, playground

---

## 7. Sponsor a Child (`src/pages/SponsorAChild.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Card image aspect ratio (line 234) | `aspect-[3/4]` | `aspect-square` |
| Sponsor button text (line 280) | `Sponsor {child.first_name}` | `Sponsor` |
| Gender filter (line 56) | `child.gender === genderFilter.toLowerCase()` | `(child.gender \|\| "").toLowerCase() === genderFilter.toLowerCase()` (null-safe + case-insensitive) |

---

## 8. Admin — Children Manager (`src/pages/admin/ChildrenManager.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Uploaded image aspect ratio (line 55) | `aspect-[3/4]` | `aspect-square` |

---

## 9. Contact Page (`src/pages/Contact.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Get in Touch card (lines 240-246) | Had REGIONS entry (DR Congo · Uganda) | REMOVED — regions section deleted entirely |

---

## 10. Navbar (`src/components/layout/Navbar.jsx`)
| Change | Before | After |
|--------|--------|-------|
| Project dropdown links (line 108) | No whitespace control | Added `whitespace-nowrap` class — "Lumina Charis School of Africa" stays on one line |

---

## Verification
`npm run build` succeeds without errors.
