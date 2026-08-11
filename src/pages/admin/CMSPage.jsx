import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, Check, RotateCcw, Search, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAllPageContent,
  useUpdatePageContent,
  useResetPageContent,
} from "@/hooks/usePageContent";
import { primeCMSCache } from "@/hooks/useCMS";

const PAGES = [
  { id: "home", label: "Home Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Since 2009 \u00b7 DR Congo, Uganda & Kenya" },
      { id: "heroTitle", name: "Hero Title", content: "Hope, restored." },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Education, healthcare, and food security for communities across Africa." },
      { id: "heroCta", name: "Hero CTA Button", content: "Donate Now", type: "single" },
      { id: "heroCta2", name: "Hero Secondary CTA", content: "Learn our story", type: "single" },
      { id: "pillarsHeading", name: "Pillars Heading", content: "Our Foundation" },
      { id: "pillarsSub", name: "Pillars Subtitle", content: "Five pillars driving lasting change across Africa" },
      { id: "whoWeAreTitle", name: "Who We Are Title", content: "Who We Are" },
      { id: "whoWeAreDesc", name: "Who We Are Description", content: "Founded in 2009, Kadesh Hope Mission began with a bold vision \u2014 a group of young people migrated from India to the Democratic Republic of Congo with a mission to uplift impoverished communities. Today, we continue transforming lives across multiple African nations through holistic development programs." },
      { id: "whoWeCheck1", name: "Who We Are Check 1", content: "Quality education access for every child", type: "single" },
      { id: "whoWeCheck2", name: "Who We Are Check 2", content: "Healthcare for underserved communities", type: "single" },
      { id: "whoWeCheck3", name: "Who We Are Check 3", content: "Social development and economic empowerment", type: "single" },
      { id: "whoWeAreCta", name: "Who We Are CTA", content: "Know More About Us", type: "single" },
      { id: "projectsTitle", name: "Projects Title", content: "Our Projects" },
      { id: "projectsSub", name: "Projects Subtitle", content: "Transforming communities across Africa" },
      { id: "projectsCta", name: "Projects CTA Button", content: "View All Projects", type: "single" },
      { id: "galleryTitle", name: "Gallery Title", content: "Moments of Impact" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "A glimpse into the work we do every day" },
      { id: "galleryCta", name: "Gallery CTA Button", content: "View Full Gallery", type: "single" },
      { id: "testimonialsTitle", name: "Testimonials Title", content: "Voices of Hope" },
      { id: "testimonialsSub", name: "Testimonials Subtitle", content: "Hear from the people whose lives have been transformed" },
      { id: "donateCtaTitle", name: "Donate CTA Title", content: "Make a Difference Today" },
      { id: "donateCtaDesc", name: "Donate CTA Description", content: "Every donation helps us provide education, healthcare, food security, and hope to communities across Africa. Your generosity transforms lives and builds futures." },
      { id: "donateCtaBtn", name: "Donate CTA Button", content: "Donate Now", type: "single" },
      { id: "donatePartnerBtn", name: "Donate Partner Button", content: "Become a Partner", type: "single" },
      { id: "partnersTitle", name: "Partners Title", content: "Trusted Partners" },
      { id: "partnersSub", name: "Partners Subtitle", content: "Organizations that share our vision for a better Africa" },
    ]
  },
  { id: "about", label: "About Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Our Story" },
      { id: "heroTitle", name: "Hero Title", content: "Wisdom guided by empathy" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "In 2009, a group of young people migrated from India to the Democratic Republic of Congo with a vision to bring hope and healing to impoverished communities." },
      { id: "storyTitle", name: "Story Title", content: "Our Story" },
      { id: "storySubtitle", name: "Story Subtitle", content: "From a bold vision to a continent-wide movement of hope" },
      { id: "storyContent", name: "Story Content", type: "multiline", content: `Founded in 2009, Kadesh Hope Mission began when a group of passionate young people left their homes in India and traveled to the Democratic Republic of Congo. What started as a small community outreach has grown into a multi-country organization serving thousands across DR Congo, Uganda, and Kenya.

Our approach combines practical aid with lasting solutions — building schools, drilling boreholes, providing healthcare, and feeding communities while empowering local leaders to sustain the change.` },
      { id: "missionTitle", name: "Mission Title", content: "Our Mission" },
      { id: "missionContent", name: "Mission Content", content: "To uplift impoverished communities through holistic development programs including education, healthcare, food security, and social empowerment, guided by compassion and faith." },
      { id: "visionTitle", name: "Vision Title", content: "Our Vision" },
      { id: "visionContent", name: "Vision Content", content: "A thriving Africa where every community has access to quality education, healthcare, clean water, and economic opportunity — where hope is restored and futures are transformed." },
      { id: "ministryTitle", name: "Ministry Areas Title", content: "Ministry Areas" },
      { id: "ministrySub", name: "Ministry Areas Subtitle", content: "Our holistic approach addresses the physical, educational, and spiritual needs of communities" },
      { id: "teamTitle", name: "Team Title", content: "Leadership Team" },
      { id: "teamSub", name: "Team Subtitle", content: "The dedicated people behind our mission" },
      { id: "timelineTitle", name: "Timeline Title", content: "Our Journey" },
      { id: "timelineSub", name: "Timeline Subtitle", content: "Key milestones in our 17-year journey of impact" },
      { id: "ctaTitle", name: "CTA Title", content: "Join Our Mission" },
      { id: "ctaDesc", name: "CTA Description", content: "Be part of the story. Your support transforms lives across Africa." },
      { id: "impactTitle", name: "Impact Title", content: "Our Impact in Numbers" },
      { id: "impactStat1", name: "Impact Stat 1", content: "10,000+", type: "single" },
      { id: "impactLabel1", name: "Impact Label 1", content: "Youth Inspired & Mentored", type: "single" },
      { id: "impactStat2", name: "Impact Stat 2", content: "300+", type: "single" },
      { id: "impactLabel2", name: "Impact Label 2", content: "Children Kept in School", type: "single" },
      { id: "impactStat3", name: "Impact Stat 3", content: "500+", type: "single" },
      { id: "impactLabel3", name: "Impact Label 3", content: "Families Fed Weekly", type: "single" },
    ]
  },
  { id: "contact", label: "Contact Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Get In Touch" },
      { id: "heroTitle", name: "Hero Title", content: "We'd love to hear from you" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Whether you have questions, want to partner, or are ready to make a difference — reach out." },
      { id: "infoTitle", name: "Info Title", content: "Contact Information" },
      { id: "email", name: "Email", content: "info@kadeshhopemission.org", type: "single" },
      { id: "phone", name: "Phone", content: "+243 978 514 377", type: "single" },
      { id: "location", name: "Location", content: "DR Congo / Uganda / Kenya", type: "single" },
      { id: "formTitle", name: "Form Title", content: "Send a Message" },
      { id: "formSub", name: "Form Subtitle", content: "Fill out the form and we'll get back to you as soon as possible." },
      { id: "successMsg", name: "Success Message", content: "Message sent successfully! We'll get back to you soon." },
    ]
  },
  { id: "donate", label: "Donate Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Make a Difference" },
      { id: "heroTitle", name: "Hero Title", content: "Your Generosity Changes Lives" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Every contribution, no matter the size, helps us bring education, healthcare, and hope to communities across Africa." },
      { id: "sectionTitle", name: "Section Title", content: "Choose Your Impact" },
      { id: "sectionSub", name: "Section Subtitle", content: "Select an amount and make a secure donation via Paystack" },
      { id: "customLabel", name: "Custom Amount Label", content: "Or enter a custom amount", type: "single" },
      { id: "bankTitle", name: "Bank Transfer Title", content: "Bank Transfer" },
      { id: "bankDetails", name: "Bank Details", content: "Contact us for bank transfer details and international wire instructions." },
    ]
  },
  { id: "gallery", label: "Gallery Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Our Gallery" },
      { id: "heroTitle", name: "Hero Title", content: "Moments of Impact" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "A visual journey through our work across Africa" },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search photos...", type: "single" },
    ]
  },
  { id: "videos", label: "Videos Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Watch & Learn" },
      { id: "heroTitle", name: "Hero Title", content: "Our Stories in Motion" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Experience the impact of our work through video — stories of transformation, hope, and community." },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search videos...", type: "single" },
    ]
  },
  { id: "sponsor", label: "Sponsor a Child", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Sponsor a Child" },
      { id: "heroTitle", name: "Hero Title", content: "Change a Child's Future" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Your sponsorship provides education, nutrition, healthcare, and hope for a child in need." },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search by name or location...", type: "single" },
      { id: "howItWorksTitle", name: "How It Works Title", content: "How Sponsorship Works" },
      { id: "benefitsTitle", name: "Benefits Title", content: "What Your Sponsorship Provides" },
    ]
  },
  { id: "news", label: "News Page", group: "Core",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Latest Updates" },
      { id: "heroTitle", name: "Hero Title", content: "News & Updates" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Stay informed about our programs, events, and community impact across Africa" },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search articles...", type: "single" },
      { id: "emptyTitle", name: "Empty State Title", content: "No articles found", type: "single" },
      { id: "emptyDesc", name: "Empty State Description", content: "Check back soon for news and updates from our programs." },
    ]
  },
  { id: "childEducation", label: "Child Education", group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Education" },
      { id: "heroTitle", name: "Hero Title", content: "Child Education Project" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Keeping children in school and empowering them to compete globally" },
      { id: "storyTitle", name: "Story Title", content: "The Challenge" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "Moments captured from this project" },
      { id: "ctaTitle", name: "CTA Title", content: "Support Education" },
      { id: "ctaDesc", name: "CTA Description", content: "Your donation keeps a child in school and gives them a future full of possibilities." },
    ]
  },
  { id: "homeCare", label: "Home Care", group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Healthcare" },
      { id: "heroTitle", name: "Hero Title", content: "Home Care" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Home-based healthcare programs reaching underserved populations" },
      { id: "storyTitle", name: "Story Title", content: "The Need" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "Moments captured from this project" },
    ]
  },
  { id: "luminaCharis", label: "Lumina Charis School", group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Education" },
      { id: "heroTitle", name: "Hero Title", content: "Lumina Charis School of Africa" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Constructing schools and learning centers for African youth" },
      { id: "storyTitle", name: "Story Title", content: "Our Vision for Education" },
      { id: "galleryTitle", name: "Gallery Title", content: "School Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "A look inside Lumina Charis School" },
    ]
  },
  { id: "borewell", label: "Borewell Project", group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Water Access" },
      { id: "heroTitle", name: "Hero Title", content: "Borewell Project" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Providing clean water access to communities in need" },
      { id: "storyTitle", name: "Story Title", content: "Water is Life" },
    ]
  },
  { id: "bethlehemBread", label: "Bethlehem Bread", group: "Projects",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Food Security" },
      { id: "heroTitle", name: "Hero Title", content: "Bethlehem Bread" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Providing daily meals and food security for vulnerable communities" },
      { id: "storyTitle", name: "Story Title", content: "Feeding the Hungry" },
    ]
  },
  { id: "footer", label: "Footer", group: "Site",
    sections: [
      { id: "tagline", name: "Tagline", content: "Transforming lives through education, healthcare, food security, and social development since 2009." },
      { id: "copyright", name: "Copyright", content: "Kadesh Hope Mission. All rights reserved.", type: "single" },
      { id: "quickLinksTitle", name: "Quick Links Title", content: "Quick Links", type: "single" },
      { id: "programsTitle", name: "Programs Title", content: "Programs", type: "single" },
      { id: "connectTitle", name: "Connect Title", content: "Connect With Us", type: "single" },
    ]
  },
];

const GROUPS = ["Core", "Projects", "Site"];

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CMSPage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].id);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: allContent, isLoading } = useAllPageContent();
  const updateContent = useUpdatePageContent();
  const resetContent = useResetPageContent();

  // Build { pageSlug: { sectionKey: content } } from the flat Supabase rows
  const contentMap = useMemo(() => {
    const rows = allContent?.data ?? [];
    const map = {};
    for (const row of rows) {
      if (!map[row.page_slug]) map[row.page_slug] = {};
      map[row.page_slug][row.section_key] = row.content;
    }
    return map;
  }, [allContent]);

  const currentPage = PAGES.find((p) => p.id === selectedPage);

  const getValue = (pageId, sectionId, defaultValue) => {
    const override = contentMap[pageId]?.[sectionId];
    return override !== undefined ? override : defaultValue;
  };

  const isEdited = (pageId, sectionId) => contentMap[pageId]?.[sectionId] !== undefined;

  const handleEdit = (section) => {
    setEditingSection(section.id);
    setEditContent(getValue(selectedPage, section.id, section.content));
    setErrorMsg(null);
  };

  const handleSave = async (sectionId) => {
    setErrorMsg(null);
    try {
      const { error } = await updateContent.mutateAsync({
        pageSlug: selectedPage,
        sectionKey: sectionId,
        content: editContent,
      });
      if (error) throw error;
      primeCMSCache(true); // refresh the cache the public pages read from
      setEditingSection(null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save this field.");
    }
  };

  const handleReset = async (pageId) => {
    setErrorMsg(null);
    try {
      const { error } = await resetContent.mutateAsync(pageId);
      if (error) throw error;
      primeCMSCache(true); // refresh the cache the public pages read from
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset this page.");
    }
  };

  const filteredSections = currentPage?.sections.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase())
  );

  const pageHasOverrides = (pageId) => contentMap[pageId] && Object.keys(contentMap[pageId]).length > 0;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">Content Management</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Edit any text across the entire site — changes save live and are shared with every admin
          </p>
        </div>
      </div>

      {/* Page selector, grouped, with search alongside */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 space-y-3">
          {GROUPS.map((group) => {
            const pagesInGroup = PAGES.filter((p) => p.group === group);
            if (pagesInGroup.length === 0) return null;
            return (
              <div key={group} className="flex items-start gap-3">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-gray-400 pt-1.5 w-16 shrink-0">
                  {group}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pagesInGroup.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => { setSelectedPage(page.id); setEditingSection(null); setErrorMsg(null); }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all duration-200 border inline-flex items-center gap-1.5",
                        selectedPage === page.id
                          ? "bg-vibrant-blue text-white border-vibrant-blue shadow-md shadow-vibrant-blue/20 scale-[1.02]"
                          : "bg-white text-on-surface-variant border-gray-200 hover:border-vibrant-blue/30 hover:text-deep-navy hover:shadow-sm"
                      )}
                    >
                      {page.label}
                      {pageHasOverrides(page.id) && (
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full",
                          selectedPage === page.id ? "bg-white/80" : "bg-emerald-400 animate-pulse"
                        )} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search field — icon and input are flex siblings inside one bordered
            box, not an absolutely-positioned overlay, so they can never drift
            apart on wrap/resize. */}
        <div className="flex items-center gap-2 w-full lg:w-64 shrink-0 px-3 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-vibrant-blue/30 focus-within:border-vibrant-blue transition-all h-fit">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-body text-sm focus:outline-none min-w-0"
          />
          {search && (
            <button onClick={() => setSearch("")} className="shrink-0 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-vibrant-blue animate-spin" />
        </div>
      ) : (
        <>
          {pageHasOverrides(selectedPage) && (
            <div className="mb-4">
              <button
                onClick={() => handleReset(selectedPage)}
                disabled={resetContent.isPending}
                className="inline-flex items-center gap-1.5 font-body text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetContent.isPending ? "Resetting…" : `Reset ${currentPage?.label} to defaults`}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {filteredSections?.map((section) => {
              const currentValue = getValue(selectedPage, section.id, section.content);
              const edited = isEdited(selectedPage, section.id);
              const isMultiline = section.type === "multiline";
              const isThisSaving = updateContent.isPending && editingSection === section.id;

              return (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-display text-sm font-semibold text-deep-navy truncate">{section.name}</h3>
                      {edited && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-body text-caption text-emerald-600 shrink-0">
                          <Check className="h-2.5 w-2.5" /> Custom
                        </span>
                      )}
                    </div>
                    {editingSection !== section.id && (
                      <button onClick={() => handleEdit(section)} className="font-body text-sm font-medium text-vibrant-blue hover:text-vibrant-blue/80 transition-colors shrink-0 ml-3">
                        Edit
                      </button>
                    )}
                  </div>

                  {editingSection === section.id ? (
                    <div className="p-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={isMultiline ? 6 : 4}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20"
                      />
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleSave(section.id)}
                          disabled={isThisSaving}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm font-semibold text-white transition-colors",
                            isThisSaving ? "bg-vibrant-blue/60 cursor-not-allowed" : "bg-vibrant-blue hover:bg-vibrant-blue/90"
                          )}
                        >
                          {isThisSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {isThisSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2 rounded-lg font-body text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-3.5">
                      <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                        {String(currentValue).slice(0, 200)}{String(currentValue).length > 200 ? "…" : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}