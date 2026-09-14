// Merges the hardcoded Projects dropdown categories (NAV_LINKS) with the
// projects stored in the database, so projects created in the admin appear
// in the nav without a code change.
//
// DB projects are grouped by their `category` (falling back to "More
// Projects") and appended after the built-in categories. Any project whose
// href is already present in the hardcoded list is skipped, so a built-in
// project can never be duplicated.
export function buildProjectCategories(baseCategories, dbProjects) {
  const categories = (baseCategories || []).map((cat) => ({
    category: cat.category,
    items: [...cat.items],
  }));

  const seen = new Set(
    categories.flatMap((cat) => cat.items.map((item) => item.href))
  );

  for (const project of dbProjects || []) {
    if (!project?.slug) continue;

    const href = `/projects/${project.slug}`;
    if (seen.has(href)) continue;
    seen.add(href);

    const category = (project.category || "").trim() || "More Projects";
    let group = categories.find((cat) => cat.category === category);
    if (!group) {
      group = { category, items: [] };
      categories.push(group);
    }

    group.items.push({
      label: (project.title || project.slug).trim(),
      href,
    });
  }

  return categories;
}
