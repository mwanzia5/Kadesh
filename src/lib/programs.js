import { LUMINA_GALLERY_HERO } from "./education-gallery";
import { HOMECARE_HERO, OHANA_HERO } from "./healthcare-gallery";
import { BOREWELL_HERO, BREAD_HERO } from "./social-development-gallery";

// One catalog keeps program pages, homepage cards, and navigation in sync.
// Projects open as tabs on their category page; legacy URLs redirect here.
export const PROGRAM_CATEGORIES = [
  {
    id: "education",
    title: "Education",
    href: "/projects/education",
    description:
      "Opening doors through learning, from the classroom to a brighter future.",
    icon: "School",
    image: LUMINA_GALLERY_HERO,
    projects: [
      {
        slug: "lumina-charis",
        title: "Lumina Charis School of Africa",
        label: "Education Centers",
        description:
          "Christ-centered learning in Kalule, Uganda, nurturing knowledge, character, and a heart for service.",
        image: LUMINA_GALLERY_HERO,
        href: "/projects/education?project=lumina-charis#project-tabs",
      },
      {
        slug: "child-education",
        title: "Child to School",
        label: "Child to School",
        description:
          "Helping children stay in school with the support they need to learn and thrive.",
        image: "/images/child to school/child project_1.jpeg",
        href: "/projects/education?project=child-education#project-tabs",
      },
    ],
  },
  {
    id: "healthcare",
    title: "Healthcare",
    href: "/projects/healthcare",
    description:
      "Bringing compassionate care closer to people, in the clinic and at home.",
    icon: "Heart",
    image: OHANA_HERO,
    projects: [
      {
        slug: "ohana-care",
        title: "Ohana Care Clinic",
        label: "Ohana Care Clinic",
        description:
          "Accessible primary healthcare in Maili Nne, Eldoret, with compassion and dignity at the heart of every encounter.",
        image: OHANA_HERO,
        href: "/projects/healthcare?project=ohana-care#project-tabs",
      },
      {
        slug: "home-care",
        title: "Homecare",
        label: "Homecare",
        description:
          "Home-based care, practical support, and companionship for older people and those in vulnerable circumstances.",
        image: HOMECARE_HERO,
        href: "/projects/healthcare?project=home-care#project-tabs",
      },
    ],
  },
  {
    id: "social-development",
    title: "Social Development",
    href: "/projects/social-development",
    description:
      "Strengthening everyday life through nourishing food and access to clean water.",
    icon: "Users",
    image: BREAD_HERO,
    projects: [
      {
        slug: "bethlehem-bread",
        title: "Bethlehem Bread",
        label: "Bethlehem Bread",
        description:
          "Preparing and sharing bread with people facing food insecurity, connecting daily nourishment with dignity and hope.",
        image: BREAD_HERO,
        href: "/projects/social-development?project=bethlehem-bread#project-tabs",
      },
      {
        slug: "borewell",
        title: "Borewell",
        label: "Borewell",
        description:
          "Bringing water access closer through borewells, hand pumps, and community stewardship of a shared resource.",
        image: BOREWELL_HERO,
        href: "/projects/social-development?project=borewell#project-tabs",
      },
    ],
  },
];

const allProjects = PROGRAM_CATEGORIES.flatMap((category) =>
  category.projects.map((project) => ({
    ...project,
    category: category.title,
    categoryId: category.id,
    categoryHref: category.href,
  })),
);

export const FEATURED_PROJECTS = [
  "lumina-charis",
  "ohana-care",
  "bethlehem-bread",
  "child-education",
].map((slug) => allProjects.find((project) => project.slug === slug));

// Match category links and the selected project tab in both navigation menus.
export function isProgramLinkActive(href, pathname, search = "") {
  const target = new URL(href, "https://kadesh.local");
  if (target.pathname !== pathname) return false;
  const requested = target.searchParams.get("project");
  if (!requested) return true;
  const category = PROGRAM_CATEGORIES.find((item) => item.href === pathname);
  const selected = new URLSearchParams(search).get("project");
  const active =
    category?.projects.find((item) => item.slug === selected) ||
    category?.projects[0];
  return active?.slug === requested;
}
