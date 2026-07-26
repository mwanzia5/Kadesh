import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Save, Check, Eye, EyeOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "khm_cms_content";

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("storage"));
}

const PAGES = [
  { id: "home", label: "Home Page", color: "vibrant-blue",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Transforming lives across Africa" },
      { id: "heroTitle", name: "Hero Title", content: "Hope, restored." },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Education, healthcare, and food security for communities across Africa." },
      { id: "heroCta", name: "Hero CTA Button", content: "Our Programs" },
      { id: "heroCta2", name: "Hero Secondary CTA", content: "Donate Now" },
      { id: "pillarsHeading", name: "Pillars Heading", content: "Our Impact Areas" },
      { id: "pillarsSub", name: "Pillars Subtitle", content: "We focus on five key areas of community transformation" },
      { id: "whoWeAreTitle", name: "Who We Are Title", content: "We are led by faith and guided by wisdom and empathy" },
      { id: "whoWeAreDesc", name: "Who We Are Description", content: "Kadesh Hope Mission is a faith-based organization committed to transforming lives through holistic community development across Africa." },
      { id: "whoWeAreCta", name: "Who We Are CTA", content: "Learn Our Story" },
      { id: "impactTitle", name: "Impact Title", content: "Our Impact in Numbers" },
      { id: "impactStat1", name: "Impact Stat 1", content: "10,000+", type: "single" },
      { id: "impactLabel1", name: "Impact Label 1", content: "Lives Impacted", type: "single" },
      { id: "impactStat2", name: "Impact Stat 2", content: "4", type: "single" },
      { id: "impactLabel2", name: "Impact Label 2", content: "Active Programs", type: "single" },
      { id: "impactStat3", name: "Impact Stat 3", content: "17+", type: "single" },
      { id: "impactLabel3", name: "Impact Label 3", content: "Years of Service", type: "single" },
      { id: "projectsTitle", name: "Projects Title", content: "Our Programs" },
      { id: "projectsSub", name: "Projects Subtitle", content: "Discover how we are making a difference across Africa" },
      { id: "galleryTitle", name: "Gallery Title", content: "Moments of Impact" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "A glimpse into our work across communities" },
      { id: "testimonialsTitle", name: "Testimonials Title", content: "Voices of Change" },
      { id: "donateCtaTitle", name: "Donate CTA Title", content: "Be the Change Today" },
      { id: "donateCtaDesc", name: "Donate CTA Description", content: "Your support helps us reach more communities with education, healthcare, and hope." },
      { id: "donateCtaBtn", name: "Donate CTA Button", content: "Make a Donation", type: "single" },
    ]
  },
  { id: "about", label: "About Page", color: "hope-orange",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Our Story" },
      { id: "heroTitle", name: "Hero Title", content: "Wisdom guided by empathy" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "In 2009, a group of young people migrated from India to the Democratic Republic of Congo with a vision to bring hope and healing to impoverished communities." },
      { id: "storyTitle", name: "Story Title", content: "Our Story" },
      { id: "storySubtitle", name: "Story Subtitle", content: "From a bold vision to a continent-wide movement of hope" },
      { id: "storyContent", name: "Story Content", content: `Founded in 2009, Kadesh Hope Mission began when a group of passionate young people left their homes in India and traveled to the Democratic Republic of Congo. What started as a small community outreach has grown into a multi-country organization serving thousands across DR Congo, Uganda, and Kenya.

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
    ]
  },
  { id: "contact", label: "Contact Page", color: "green",
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
  { id: "donate", label: "Donate Page", color: "hope-orange",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Make a Difference" },
      { id: "heroTitle", name: "Hero Title", content: "Your Generosity Changes Lives" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Every contribution, no matter the size, helps us bring education, healthcare, and hope to communities across Africa." },
      { id: "sectionTitle", name: "Section Title", content: "Choose Your Impact" },
      { id: "sectionSub", name: "Section Subtitle", content: "Select an amount and make a secure donation via Paystack" },
      { id: "customLabel", name: "Custom Amount Label", content: "Or enter a custom amount", type: "single" },
      { id: "ctaTitle", name: "CTA Title", content: "Other Ways to Give" },
      { id: "bankTitle", name: "Bank Transfer Title", content: "Bank Transfer" },
      { id: "bankDetails", name: "Bank Details", content: "Contact us for bank transfer details and international wire instructions." },
    ]
  },
  { id: "gallery", label: "Gallery Page", color: "vibrant-blue",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Our Gallery" },
      { id: "heroTitle", name: "Hero Title", content: "Moments of Impact" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "A visual journey through our work across Africa" },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search photos...", type: "single" },
    ]
  },
  { id: "videos", label: "Videos Page", color: "red",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Watch & Learn" },
      { id: "heroTitle", name: "Hero Title", content: "Our Stories in Motion" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Experience the impact of our work through video — stories of transformation, hope, and community." },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search videos...", type: "single" },
    ]
  },
  { id: "sponsor", label: "Sponsor a Child", color: "hope-orange",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Sponsor a Child" },
      { id: "heroTitle", name: "Hero Title", content: "Change a Child's Future" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Your sponsorship provides education, nutrition, healthcare, and hope for a child in need." },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search by name or location...", type: "single" },
      { id: "howItWorksTitle", name: "How It Works Title", content: "How Sponsorship Works" },
      { id: "benefitsTitle", name: "Benefits Title", content: "What Your Sponsorship Provides" },
    ]
  },
  { id: "news", label: "News Page", color: "vibrant-blue",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Latest Updates" },
      { id: "heroTitle", name: "Hero Title", content: "News & Updates" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Stay informed about our programs, events, and community impact across Africa" },
      { id: "searchPlaceholder", name: "Search Placeholder", content: "Search articles...", type: "single" },
      { id: "emptyTitle", name: "Empty State Title", content: "No articles found", type: "single" },
      { id: "emptyDesc", name: "Empty State Description", content: "Check back soon for news and updates from our programs." },
    ]
  },
  { id: "childEducation", label: "Child Education Project", color: "vibrant-blue",
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
  { id: "homeCare", label: "Home Care Project", color: "green",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Healthcare" },
      { id: "heroTitle", name: "Hero Title", content: "Home Care" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Home-based healthcare programs reaching underserved populations" },
      { id: "storyTitle", name: "Story Title", content: "The Need" },
      { id: "galleryTitle", name: "Gallery Title", content: "Project Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "Moments captured from this project" },
    ]
  },
  { id: "luminaCharis", label: "Lumina Charis School", color: "vibrant-blue",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Education" },
      { id: "heroTitle", name: "Hero Title", content: "Lumina Charis School of Africa" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Constructing schools and learning centers for African youth" },
      { id: "storyTitle", name: "Story Title", content: "Our Vision for Education" },
      { id: "galleryTitle", name: "Gallery Title", content: "School Gallery" },
      { id: "gallerySub", name: "Gallery Subtitle", content: "A look inside Lumina Charis School" },
    ]
  },
  { id: "borewell", label: "Borewell Project", color: "vibrant-blue",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Water Access" },
      { id: "heroTitle", name: "Hero Title", content: "Borewell Project" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Providing clean water access to communities in need" },
      { id: "storyTitle", name: "Story Title", content: "Water is Life" },
    ]
  },
  { id: "bethlehemBread", label: "Bethlehem Bread", color: "hope-orange",
    sections: [
      { id: "heroBadge", name: "Hero Badge", content: "Food Security" },
      { id: "heroTitle", name: "Hero Title", content: "Bethlehem Bread" },
      { id: "heroSubtitle", name: "Hero Subtitle", content: "Providing daily meals and food security for vulnerable communities" },
      { id: "storyTitle", name: "Story Title", content: "Feeding the Hungry" },
    ]
  },
  { id: "impact", label: "Impact Statistics", color: "vibrant-blue",
    sections: [
      { id: "heroSubtitle", name: "Hero Subtitle", content: "These initiatives have transformed individual lives and strengthened entire communities." },
      { id: "introTitle", name: "Intro Title", content: "Our Numbers Speak for Themselves" },
      { id: "introDescription", name: "Intro Description", content: "Every statistic represents a life transformed, a family strengthened, and a community empowered." },
      { id: "summaryTitle", name: "Summary Title", content: "Combined Impact" },
      { id: "summaryDescription", name: "Summary Description", content: "Together, our programs create a comprehensive approach to community transformation" },
      { id: "ctaTitle", name: "CTA Title", content: "Help Us Reach More Communities" },
      { id: "ctaDescription", name: "CTA Description", content: "Your contribution directly impacts thousands of lives across Africa." },
    ]
  },
  { id: "footer", label: "Footer", color: "gray",
    sections: [
      { id: "tagline", name: "Tagline", content: "Transforming lives through education, healthcare, food security, and social development since 2009." },
      { id: "copyright", name: "Copyright", content: "Kadesh Hope Mission. All rights reserved.", type: "single" },
      { id: "quickLinksTitle", name: "Quick Links Title", content: "Quick Links", type: "single" },
      { id: "programsTitle", name: "Programs Title", content: "Programs", type: "single" },
      { id: "connectTitle", name: "Connect Title", content: "Connect With Us", type: "single" },
    ]
  },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CMSPage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].id);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedFields, setSavedFields] = useState({});
  const [storedContent, setStoredContent] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => { setStoredContent(loadAll()); }, []);

  const currentPage = PAGES.find((p) => p.id === selectedPage);

  const getValue = (pageId, sectionId, defaultValue) => {
    if (storedContent[pageId]?.[sectionId] !== undefined) return storedContent[pageId][sectionId];
    return defaultValue;
  };

  const handleEdit = (section) => {
    setEditingSection(section.id);
    setEditContent(getValue(selectedPage, section.id, section.content));
    setSaved(false);
  };

  const handleSave = (sectionId) => {
    setSaving(true);
    const pageContent = { ...(storedContent[selectedPage] || {}), [sectionId]: editContent };
    const all = { ...storedContent, [selectedPage]: pageContent };
    saveAll(all);
    setStoredContent(all);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setSavedFields((prev) => ({ ...prev, [sectionId]: true }));
      setEditingSection(null);
      setTimeout(() => setSaved(false), 2000);
    }, 300);
  };

  const handleReset = (pageId) => {
    const all = { ...storedContent };
    delete all[pageId];
    saveAll(all);
    setStoredContent(all);
  };

  const filteredSections = currentPage?.sections.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">Content Management</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">Edit any text across the entire site — changes save to browser storage instantly</p>
        </div>
      </div>

      {/* Page selector + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => { setSelectedPage(page.id); setEditingSection(null); }}
              className={cn(
                "px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-colors",
                selectedPage === page.id
                  ? "bg-vibrant-blue text-white shadow-sm"
                  : "bg-gray-100 text-on-surface-variant hover:bg-gray-200"
              )}
            >
              {page.label}
              {storedContent[page.id] && Object.keys(storedContent[page.id]).length > 0 && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20"
        />
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-body text-sm">
          <Check className="h-4 w-4" /> Changes saved — refresh pages to see updates
        </div>
      )}

      {storedContent[selectedPage] && Object.keys(storedContent[selectedPage]).length > 0 && (
        <div className="mb-4">
          <button onClick={() => handleReset(selectedPage)} className="inline-flex items-center gap-1.5 font-body text-sm text-red-500 hover:text-red-700 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset {currentPage?.label} to defaults
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filteredSections?.map((section) => {
          const currentValue = getValue(selectedPage, section.id, section.content);
          const isEdited = storedContent[selectedPage]?.[section.id] !== undefined;
          const isJson = section.type === "json";
          const isMultiline = section.type === "multiline";

          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-display text-sm font-semibold text-deep-navy truncate">{section.name}</h3>
                  {isEdited && (
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
                  {isJson ? (
                    <div>
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={10}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20" />
                      {(() => { try { JSON.parse(editContent); return null; } catch (e) { return <p className="mt-2 font-body text-caption text-red-500">Invalid JSON: {e.message}</p>; } })()}
                    </div>
                  ) : isMultiline ? (
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20" />
                  ) : (
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20" />
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => handleSave(section.id)} disabled={saving}
                      className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm font-semibold text-white transition-colors",
                        saving ? "bg-vibrant-blue/60 cursor-not-allowed" : "bg-vibrant-blue hover:bg-vibrant-blue/90")}>
                      <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditingSection(null)}
                      className="px-4 py-2 rounded-lg font-body text-sm text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3.5">
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">{String(currentValue).slice(0, 200)}{String(currentValue).length > 200 ? "…" : ""}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
