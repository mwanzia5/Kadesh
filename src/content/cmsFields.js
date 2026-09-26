// ---------------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH for every editable text field in the admin CMS.
//
// Both sides of the CMS read this file:
//   * the admin UI (src/pages/admin/CMSPage.jsx) renders one editor per entry
//   * the public site (cmsText() in src/hooks/useCMS.js) falls back to the
//     `content` value here whenever an admin has not saved an override
//
// Because the default lives in exactly one place, an admin field can never
// drift away from the text it is supposed to control. `scripts/check-cms-wiring.mjs`
// additionally asserts that every entry below is actually referenced by site
// code, so a field can never be silently dead again.
//
// `content` MUST be the text that is live on the site today — that way wiring a
// page up is a no-op visually and only admin overrides change what visitors see.
// ---------------------------------------------------------------------------

export const CMS_GROUPS = ["Core", "Projects", "Site"];

export const CMS_PAGES = [
  {
    id: "home",
    label: "Home Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Since 2009 \u00b7 DR Congo, Uganda & Kenya" },
      { id: "heroTitle", name: "Hero Title", content: "Hope, restored." },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content: "Education, healthcare, and food security for communities across Africa.",
      },
      { id: "heroCta", name: "Hero CTA Button", content: "Donate Now", type: "single" },
      { id: "heroCta2", name: "Hero Secondary CTA", content: "Learn our story", type: "single" },
      { id: "pillarsHeading", name: "Pillars Heading", content: "Our Foundation" },
      {
        id: "pillarsSub",
        name: "Pillars Subtitle",
        content: "Five pillars driving lasting change across Africa",
      },
      { id: "whoWeAreTitle", name: "Who We Are Title", content: "Who We Are" },
      {
        id: "whoWeAreDesc",
        name: "Who We Are Description",
        content:
          "Founded in 2009, Kadesh Hope Mission began when a group of young people left India for the Democratic Republic of Congo to serve families living in poverty. Today, we work across Africa through education, healthcare, and community development \u2014 restoring hope and building brighter futures.",
      },
      {
        id: "whoWeCheck1",
        name: "Who We Are Check 1",
        content: "Quality education access for every child",
        type: "single",
      },
      {
        id: "whoWeCheck2",
        name: "Who We Are Check 2",
        content: "Healthcare for underserved communities",
        type: "single",
      },
      {
        id: "whoWeCheck3",
        name: "Who We Are Check 3",
        content: "Social development and economic empowerment",
        type: "single",
      },
      { id: "whoWeAreCta", name: "Who We Are CTA", content: "Know More About Us", type: "single" },
      { id: "projectsTitle", name: "Projects Title", content: "Our Projects" },
      {
        id: "projectsSub",
        name: "Projects Subtitle",
        content: "Transforming communities across Africa",
      },
      { id: "projectsCta", name: "Projects CTA Button", content: "View All Projects", type: "single" },
      { id: "galleryTitle", name: "Gallery Title", content: "Moments of Impact" },
      {
        id: "gallerySub",
        name: "Gallery Subtitle",
        content: "A glimpse into the work we do every day",
      },
      { id: "galleryCta", name: "Gallery CTA Button", content: "View Full Gallery", type: "single" },
      { id: "testimonialsTitle", name: "Testimonials Title", content: "Voices of Hope" },
      {
        id: "testimonialsSub",
        name: "Testimonials Subtitle",
        content: "Hear from the people whose lives have been transformed",
      },
      { id: "donateCtaTitle", name: "Donate CTA Title", content: "Make a Difference Today" },
      {
        id: "donateCtaDesc",
        name: "Donate CTA Description",
        content:
          "Every donation helps us provide education, healthcare, food security, and hope to communities across Africa. Your generosity transforms lives and builds futures.",
      },
      { id: "donateCtaBtn", name: "Donate CTA Button", content: "Donate Now", type: "single" },
      {
        id: "donatePartnerBtn",
        name: "Donate Partner Button",
        content: "Become a Partner",
        type: "single",
      },
      { id: "partnersTitle", name: "Partners Title", content: "Trusted Partners" },
      {
        id: "partnersSub",
        name: "Partners Subtitle",
        content: "Organizations that share our vision for a better Africa",
      },
    ],
  },

  {
    id: "about",
    label: "About Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "EST. 2009" },
      { id: "heroTitle", name: "Hero Title", content: "Wisdom guided by empathy" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "In 2009, a group of young people migrated from India to the Democratic Republic of Congo with a bold vision \u2014 to uplift impoverished communities through compassion, education, and holistic development. That journey marked the beginning of Kadesh Hope Mission.",
      },
      { id: "storyTitle", name: "Story Title", content: "Our Story" },
      {
        id: "storySubtitle",
        name: "Story Subtitle",
        content: "From a bold vision to a continent-wide movement of hope",
      },
      {
        id: "storyContent",
        name: "Story Content",
        type: "multiline",
        content:
          "Kadesh Hope Mission was born from a simple yet radical idea \u2014 that young people, driven by faith and empathy, could cross continents to serve communities in need. In 2009, our founders left India for the Democratic Republic of Congo, carrying nothing but a vision for holistic transformation.\n\nToday, that vision has grown into a multi-national movement spanning Uganda, Kenya, and the DRC. Through education, healthcare, food security, and community empowerment, we continue to honor the founding spirit \u2014 meeting people where they are and walking alongside them toward a brighter future.",
      },
      { id: "missionTitle", name: "Mission Title", content: "Mission Statement" },
      {
        id: "missionContent",
        name: "Mission Content",
        content:
          "Our mission is to transform lives and uplift communities in Africa through holistic gospel outreach.",
      },
      { id: "visionTitle", name: "Vision Title", content: "Vision Statement" },
      {
        id: "visionContent",
        name: "Vision Content",
        content:
          "To create thriving, self-sustaining communities in Africa where every individual has access to spiritual as well as physical needs.",
      },
      { id: "ministryTitle", name: "Ministry Areas Title", content: "How We Serve" },
      {
        id: "ministrySub",
        name: "Ministry Areas Subtitle",
        content: "Our ministry areas address the most critical needs",
      },
      { id: "teamTitle", name: "Team Title", content: "Our Team" },
      {
        id: "teamSub",
        name: "Team Subtitle",
        content: "Meet the dedicated leaders driving our mission to transform lives across Africa",
      },
      { id: "timelineTitle", name: "Timeline Title", content: "A Legacy of Persistence" },
      {
        id: "timelineSub",
        name: "Timeline Subtitle",
        content: "Key milestones in our journey of transformation",
      },
      { id: "ctaTitle", name: "CTA Title", content: "Ready to be part of the story?" },
      {
        id: "ctaDesc",
        name: "CTA Description",
        content:
          "Join us in transforming lives across Africa. Whether through your time, skills, generosity, or partnership, every contribution builds a brighter future.",
      },
      { id: "impactTitle", name: "Impact Title", content: "Our Impact" },
      {
        id: "impactSubtitle",
        name: "Impact Subtitle",
        content:
          "Every statistic represents a life transformed, a family strengthened, and a community empowered",
      },
      { id: "impactStat1", name: "Impact Stat 1", content: "10,000+", type: "single" },
      {
        id: "impactLabel1",
        name: "Impact Label 1",
        content: "Empowering Youth & Entrepreneurs",
        type: "single",
      },
      { id: "impactStat2", name: "Impact Stat 2", content: "300+", type: "single" },
      {
        id: "impactLabel2",
        name: "Impact Label 2",
        content: "Eradicating Educational Barriers",
        type: "single",
      },
      { id: "impactStat3", name: "Impact Stat 3", content: "500+", type: "single" },
      {
        id: "impactLabel3",
        name: "Impact Label 3",
        content: "Food Security & Malnutrition",
        type: "single",
      },
    ],
  },

  {
    id: "contact",
    label: "Contact Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Contact Us" },
      { id: "heroTitle", name: "Hero Title", content: "We'd love to hear from you" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Questions about sponsorship, donations, volunteering, or partnerships \u2014 reach out and our team will respond soon.",
      },
      { id: "infoTitle", name: "Info Title", content: "Get in Touch" },
      {
        id: "email",
        name: "Email",
        content: "kadeshhope.africa@gmail.com",
        type: "single",
      },
      { id: "phone", name: "Phone", content: "+254 733 959 383", type: "single" },
      {
        id: "location",
        name: "Service Area",
        content: "Serving communities across Uganda, Kenya, and the Democratic Republic of Congo.",
      },
      { id: "formTitle", name: "Form Title", content: "Send a Message" },
      {
        id: "formSub",
        name: "Form Subtitle",
        content: "Fill out the form and we'll get back to you as soon as possible.",
      },
      {
        id: "successMsg",
        name: "Success Message",
        content: "Thanks for reaching out! We will respond within 2 business days.",
        type: "single",
      },
    ],
  },

  {
    id: "donate",
    label: "Donate Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Make a Difference" },
      { id: "heroTitle", name: "Hero Title", content: "Your Generosity Changes Lives" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Every contribution, no matter the size, helps us bring education, healthcare, and hope to communities across Africa.",
      },
      { id: "sectionTitle", name: "Section Title", content: "Choose your impact level" },
      {
        id: "sectionSub",
        name: "Section Subtitle",
        content: "Your generosity transforms lives across Africa",
      },
      {
        id: "customLabel",
        name: "Custom Amount Label",
        content: "Enter amount (USD)",
        type: "single",
      },
      { id: "bankTitle", name: "Bank Transfer Title", content: "Bank Transfer" },
      {
        id: "bankDetails",
        name: "Bank Details",
        content:
          "Prefer to transfer directly? Contact us and we'll send you our bank details and international wire instructions.",
      },
    ],
  },

  {
    id: "gallery",
    label: "Gallery Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Our Gallery" },
      { id: "heroTitle", name: "Hero Title", content: "Moments of Impact" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content: "A visual journey through our work across Africa",
      },
    ],
  },

  {
    id: "videos",
    label: "Videos Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Watch & Learn" },
      { id: "heroTitle", name: "Hero Title", content: "Stories Worth Watching" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content: "Watch how we're transforming lives across Africa",
      },
      {
        id: "searchPlaceholder",
        name: "Search Placeholder",
        content: "Search videos...",
        type: "single",
      },
    ],
  },

  {
    id: "sponsor",
    label: "Sponsor a Child",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Sponsor a Child" },
      { id: "heroTitle", name: "Hero Title", content: "Change a Child's Future" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Your sponsorship provides education, nutrition, healthcare, and hope to a child in need",
      },
      {
        id: "searchPlaceholder",
        name: "Search Placeholder",
        content: "Search by name or location...",
        type: "single",
      },
      { id: "howItWorksTitle", name: "How It Works Title", content: "How Sponsorship Works" },
      {
        id: "benefitsTitle",
        name: "Benefits Title",
        content: "What Your Sponsorship Provides",
      },
    ],
  },

  {
    id: "news",
    label: "News Page",
    group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Latest Updates" },
      { id: "heroTitle", name: "Hero Title", content: "News & Updates" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content: "Stay informed about our programs, events, and community impact across Africa",
      },
      {
        id: "searchPlaceholder",
        name: "Search Placeholder",
        content: "Search articles...",
        type: "single",
      },
      { id: "emptyTitle", name: "Empty State Title", content: "No articles found", type: "single" },
      {
        id: "emptyDesc",
        name: "Empty State Description",
        content: "Check back soon for news and updates from our programs.",
      },
    ],
  },

  {
    id: "childEducation",
    label: "Child Education",
    group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Child to School" },
      { id: "heroTitle", name: "Hero Title", content: "Children Education Project" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Nurturing young minds by addressing their most pressing educational and developmental needs",
      },
      { id: "storyTitle", name: "Story Title", content: "Children Education Projects" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      {
        id: "gallerySub",
        name: "Gallery Subtitle",
        content: "Moments captured from our Child Education Project",
      },
      { id: "ctaTitle", name: "CTA Title", content: "Help a Child Stay in School" },
      {
        id: "ctaDesc",
        name: "CTA Description",
        content:
          "Your donation helps provide scholarships, school supplies, and educational resources to children who need them most. Together, we can ensure every child has the opportunity to learn and grow.",
      },
    ],
  },

  {
    id: "homeCare",
    label: "Home Care",
    group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Health & Wellness" },
      { id: "heroTitle", name: "Hero Title", content: "Home Care" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Transforming lives by providing compassionate home care for the elderly and vulnerable",
      },
      { id: "storyTitle", name: "Story Title", content: "Home Care" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "Moments from our Home Care program" },
    ],
  },

  {
    id: "luminaCharis",
    label: "Lumina Charis School",
    group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Education" },
      { id: "heroTitle", name: "Hero Title", content: "Lumina Charis School of Africa" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Providing transformative education to illuminate young minds with knowledge, inspire hearts with love and values, and empower compassionate leaders",
      },
      { id: "storyTitle", name: "Story Title", content: "Lumina Charis School of Africa" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "A glimpse into Lumina Charis School" },
    ],
  },

  {
    id: "borewell",
    label: "Borewell Project",
    group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Social Development" },
      { id: "heroTitle", name: "Hero Title", content: "Borewell Project" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Water is life, and our Borewell Project ensures communities can access clean and safe drinking water",
      },
      { id: "storyTitle", name: "Story Title", content: "Borewell Project" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "Moments from our Borewell Project" },
    ],
  },

  {
    id: "bethlehemBread",
    label: "Bethlehem Bread",
    group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Food Security" },
      { id: "heroTitle", name: "Hero Title", content: "Bethlehem Bread" },
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content:
          "Manufacturing and distributing bread to feed people experiencing poverty and food insecurity",
      },
      { id: "storyTitle", name: "Story Title", content: "Bethlehem Bread" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      {
        id: "gallerySub",
        name: "Gallery Subtitle",
        content: "Moments from our Bethlehem Bread Project",
      },
    ],
  },

  {
    id: "footer",
    label: "Footer",
    group: "Site",
    sections: [
      {
        id: "tagline",
        name: "Tagline",
        content:
          "Transforming lives through education, healthcare, food security, and social development since 2009.",
      },
      {
        id: "copyright",
        name: "Copyright",
        content: "\u00a9 2026 Kadesh Hope Mission. All rights reserved.",
        type: "single",
      },
      { id: "quickLinksTitle", name: "Explore Column Title", content: "Explore", type: "single" },
      { id: "programsTitle", name: "Organization Column Title", content: "Organization", type: "single" },
      { id: "connectTitle", name: "Connect Column Title", content: "Connect", type: "single" },
    ],
  },
];

// "pageId:sectionId" -> default content, built once at module load so
// cmsText() stays a cheap map lookup on every render.
const FIELD_DEFAULTS = new Map();
for (const page of CMS_PAGES) {
  for (const section of page.sections) {
    FIELD_DEFAULTS.set(`${page.id}:${section.id}`, section.content);
  }
}

export function cmsDefault(pageId, sectionId) {
  return FIELD_DEFAULTS.get(`${pageId}:${sectionId}`) ?? "";
}
