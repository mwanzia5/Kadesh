export const SUPABASE_IMAGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`
  : "";

export const SITE_CONFIG = {
  name: "Kadesh Hope Mission",
  fullName: "Kadesh Hope Mission of Africa",
  tagline: "Fostering hope and healing through compassionate action",
  description:
    "Transforming lives through education, healthcare, food security, and social development since 2009.",
  founded: 2009,
  regions: ["Democratic Republic of Congo", "Uganda"],
  email: "info@kadeshhopemission.org",
  phone: "+243 000 000 000",
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
    children: [
      {
        category: "Child to School",
        items: [
          { label: "Child Education Project", href: "/projects/child-education" },
        ],
      },
      {
        category: "Health & Wellness",
        items: [{ label: "Home Care", href: "/projects/home-care" }],
      },
      {
        category: "Education",
        items: [
          { label: "Lumina Charis School of Africa", href: "/projects/lumina-charis" },
        ],
      },
      {
        category: "Social Development",
        items: [
          { label: "Borewell Project", href: "/projects/borewell" },
        ],
      },
      {
        category: "Food Security",
        items: [{ label: "Bethlehem Bread", href: "/projects/bethlehem-bread" }],
      },
    ],
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
    title: "Combating Hunger",
    description:
      "Launching the Bethlehem Bread Project to provide daily meals and food security for vulnerable communities.",
    icon: "UtensilsCrossed",
  },
  {
    title: "Entrepreneurial Programs",
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

export const PROJECTS = [
  {
    slug: "child-education",
    title: "Child Education Project",
    category: "Child to School",
    shortDescription: "Keeping children in school and empowering them to compete globally.",
    image: "/images/child to school/child project_1.jpeg",
  },
  {
    slug: "home-care",
    title: "Home Care",
    category: "Health & Wellness",
    shortDescription: "Home-based healthcare programs reaching underserved populations.",
    image: "/images/healthcare/healthcare_1.jpg",
  },
  {
    slug: "lumina-charis",
    title: "Lumina Charis School of Africa",
    category: "Education",
    shortDescription: "Constructing schools and learning centers for African youth.",
    image: "/images/Lumina School/Lumina School_01.jpeg",
  },
  {
    slug: "borewell",
    title: "Borewell Project",
    category: "Social Development",
    shortDescription: "Providing clean water access to communities in need.",
    image: "/images/borewell project/borewell project_1.jpg",
  },
  {
    slug: "bethlehem-bread",
    title: "Bethlehem Bread",
    category: "Food Security",
    shortDescription: "Providing daily meals and food security for vulnerable communities.",
    image: "/images/Breadproject/Breadproject_1.png",
  },
];

export const PROGRAM_PILLARS = [
  {
    title: "Education",
    icon: "School",
    description: "Ensuring access to education for every child.",
    color: "vibrant-blue",
  },
  {
    title: "Health",
    icon: "Heart",
    description: "Home-based healthcare for underserved populations.",
    color: "hope-orange",
  },
  {
    title: "Food Security",
    icon: "UtensilsCrossed",
    description: "Daily meals through the Bethlehem Bread Project.",
    color: "vibrant-blue",
  },
  {
    title: "Entrepreneurial Programs",
    icon: "Rocket",
    description: "Skills training and mentorship for youth.",
    color: "hope-orange",
  },
  {
    title: "Social Development",
    icon: "Users",
    description: "Micro-financing for women's empowerment.",
    color: "vibrant-blue",
  },
];

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
