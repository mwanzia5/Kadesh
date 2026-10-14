import { PROGRAM_CATEGORIES } from "./programs";

// Keep the public menu curated. Additional CMS projects remain available through
// their existing detail routes without changing the three program categories.
export function buildProjectCategories() {
  return PROGRAM_CATEGORIES.map(
    ({ id, title, href, icon, description, projects }) => ({
      id,
      category: title,
      href,
      icon,
      description,
      items: projects.map(({ label, href: projectHref }) => ({
        label,
        href: projectHref,
      })),
    }),
  );
}
