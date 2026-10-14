import { PROGRAM_CATEGORIES } from "@/lib/programs";

export const SUPABASE_IMAGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`
  : "";

// Only these emails are allowed to access the admin area.
// Enforced client-side (login + layout guards) AND server-side via the
// is_admin() SQL function (see supabase/migrations.sql).
export const ADMIN_EMAILS = [
  "masooshem@gmail.com",
  "kadeshhope.africa@gmail.com",
];

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || "").trim().toLowerCase());
}

export const SITE_CONFIG = {
  name: "Kadesh Hope Mission",
  fullName: "Kadesh Hope Mission of Africa",
  tagline: "Fostering hope and healing through compassionate action",
  description:
    "Transforming lives through education, healthcare, food security, and social development since 2009.",
  founded: 2009,
  regions: ["Democratic Republic of Congo", "Uganda"],
  address: [
    "Kadesh Hope Mission of Africa",
    "Bulemezi Block 30, Plot No. 106,",
    "Nakaseta (Mpande), Kalule, Uganda.",
  ],
  email: "kadeshhope.africa@gmail.com",
  phone: "+254 733 959 383",
  whatsapp: "https://wa.me/254733959383",
  url: "https://kadeshhopemission.org",
  social: {
    facebook: "#",
    twitter: "#",
    youtube: "#",
    linkedin: "#",
  },
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Projects",
    href: "/projects",
    children: PROGRAM_CATEGORIES.map((category) => ({
      id: category.id,
      category: category.title,
      href: category.href,
      items: category.projects.map(({ label, href }) => ({ label, href })),
    })),
  },
  { label: "Sponsor a Child", href: "/sponsor-a-child" },
  {
    label: "Media",
    href: "/media",
    children: [
      { label: "Gallery", href: "/gallery" },
      { label: "Videos", href: "/videos" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export const IMPACT_STATS = [
  { label: "Youth Inspired & Mentored", value: 10000, suffix: "+" },
  { label: "Children Kept in School", value: 300, suffix: "+" },
  { label: "Families Fed Weekly", value: 500, suffix: "+" },
];

export const MINISTRY_AREAS = [
  {
    title: "Education",
    description:
      "Ensuring access to education for every child by constructing schools and learning centers, equipping African youth to compete globally.",
    icon: "School",
  },
  {
    title: "Health",
    description:
      "Implementing home-based healthcare programs to reach underserved populations.",
    icon: "Heart",
  },
  {
    title: "Food Security",
    description:
      "Launching the Bethlehem Bread Project to provide daily meals and food security for vulnerable communities.",
    icon: "UtensilsCrossed",
  },
  {
    title: "Enterprise Programs",
    description:
      "Offering skills training, mentorship, and motivational workshops to empower Africa's next generation of innovators.",
    icon: "Rocket",
  },
  {
    title: "Social Development",
    description:
      "Advancing gender equality through micro-financing initiatives that enable women to start businesses and achieve financial independence.",
    icon: "Users",
  },
];

export const PROJECTS = PROGRAM_CATEGORIES.flatMap((category) =>
  category.projects.map((project) => ({
    ...project,
    category: category.title,
    shortDescription: project.description,
  })),
);

export const PROGRAM_PILLARS = PROGRAM_CATEGORIES.map((category) => ({
  ...category,
  color: category.id === "healthcare" ? "hope-orange" : "vibrant-blue",
}));

export const TIMELINE = [
  {
    year: 2009,
    title: "The Seed is Planted",
    description:
      "A group of young people migrated from India to DR Congo, inspired by a vision to uplift impoverished communities.",
  },
  {
    year: 2014,
    title: "Scaling Impact",
    description:
      "Expanded programs across education and healthcare, reaching more communities in the region.",
  },
  {
    year: 2019,
    title: "Reaching Further",
    description:
      "Extended operations to Uganda and Kenya, launching the Bethlehem Bread Project and Women's Empowerment initiatives.",
  },
  {
    year: 2026,
    title: "The Future Unfolds",
    description:
      "Continuing to build thriving, self-sustaining communities across Africa through holistic development.",
  },
];

export const GALLERY_CATEGORIES = [
  "All",
  "Education",
  "Health",
  "Food Security",
  "Women & Youth",
  "Community",
];

export const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Partner Organization",
    content:
      "Kadesh Hope Mission has been an incredible partner. Their dedication to transforming lives in Africa is truly inspiring.",
    avatar: null,
  },
  {
    name: "David Mukasa",
    role: "Community Leader, Uganda",
    content:
      "The borewell project changed everything for our village. Clean water means life, health, and hope for our children.",
    avatar: null,
  },
  {
    name: "Grace Wanjiku",
    role: "Women's Project Beneficiary",
    content:
      "Thanks to the micro-financing program, I started my own business and can now provide for my family independently.",
    avatar: null,
  },
];
