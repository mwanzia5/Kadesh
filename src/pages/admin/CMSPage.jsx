import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Save, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "khm_cms_content";

function loadContent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveContent(content) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

const PAGES = [
  {
    id: "impact",
    label: "Impact Statistics",
    sections: [
      {
        id: "heroSubtitle",
        name: "Hero Subtitle",
        content: "These initiatives have not only transformed individual lives but also strengthened entire communities.",
      },
      {
        id: "introTitle",
        name: "Intro Title",
        content: "Our Numbers Speak for Themselves",
      },
      {
        id: "introDescription",
        name: "Intro Description",
        content: "Every statistic represents a life transformed, a family strengthened, and a community empowered. Our programs create lasting change across education, healthcare, food security, and economic development.",
      },
      {
        id: "timelineStartYear",
        name: "Timeline Start Year",
        content: "2009",
        type: "single",
      },
      {
        id: "timelineEndYear",
        name: "Timeline End Year",
        content: "2026",
        type: "single",
      },
      {
        id: "timelineYearsLabel",
        name: "Timeline Label",
        content: "17 Years of Persistence",
      },
      {
        id: "timelinePillars",
        name: "Timeline Pillars (one per line: icon|label|color)",
        content: "BookOpen|Education|vibrant-blue\nActivity|Health|hope-orange\nApple|Hunger|vibrant-blue\nBriefcase|Empowerment|hope-orange",
        type: "multiline",
      },
      {
        id: "impactItems",
        name: "Impact Items (JSON array)",
        content: JSON.stringify(
          [
            {
              icon: "Rocket",
              title: "Empowering Youth & Entrepreneurs",
              stat: 10000,
              suffix: "+",
              color: "vibrant-blue",
              description:
                "Over 10,000 students were directly and indirectly inspired through motivational workshops and entrepreneurial training programs, fostering innovation and leadership across colleges and institutes.",
              progress: 85,
            },
            {
              icon: "GraduationCap",
              title: "Eradicating Educational Barriers",
              stat: 300,
              suffix: "+",
              color: "hope-orange",
              description:
                "The Child School Program ensured 300 children from marginalized communities stayed in school, eliminating financial barriers and reducing dropout rates through sustained scholarships and support.",
              progress: 72,
            },
            {
              icon: "UtensilsCrossed",
              title: "Combating Hunger & Malnutrition",
              stat: 500,
              suffix: "+",
              color: "vibrant-blue",
              description:
                "The Bethlehem Bread Project provided 300–500 families weekly with daily nutritional meals, significantly improving food security and health outcomes in vulnerable households.",
              progress: 90,
            },
            {
              icon: "Stethoscope",
              title: "Healthcare Access for Vulnerable Families",
              stat: 100,
              suffix: "+",
              color: "hope-orange",
              description:
                "The Home Care Program delivered critical medical support to 100+ families managing chronic illnesses or disabilities, ensuring consistent care for those with underlying health conditions.",
              progress: 65,
            },
          ],
          null,
          2
        ),
        type: "json",
      },
      {
        id: "summaryTitle",
        name: "Summary Title",
        content: "Combined Impact",
      },
      {
        id: "summaryDescription",
        name: "Summary Description",
        content: "Together, our programs create a comprehensive approach to community transformation",
      },
      {
        id: "summaryStats",
        name: "Summary Stats (JSON array)",
        content: JSON.stringify(
          [
            { value: "10,900+", label: "Lives Impacted" },
            { value: "4", label: "Active Programs" },
            { value: "78%", label: "Average Success Rate" },
          ],
          null,
          2
        ),
        type: "json",
      },
      {
        id: "ctaTitle",
        name: "CTA Title",
        content: "Help Us Reach More Communities",
      },
      {
        id: "ctaDescription",
        name: "CTA Description",
        content: "Your contribution directly impacts thousands of lives across Africa. Join us in creating lasting change through education, healthcare, and community development.",
      },
    ],
  },
  {
    id: "home",
    label: "Home",
    sections: [
      { id: "hero", name: "Hero Section", content: "Fostering hope and healing through compassionate action. Transforming lives through education, healthcare, food security, and social development since 2009." },
      { id: "pillars", name: "Program Pillars", content: "Our foundation is built on five key pillars: Education, Healthcare, Food Security, Innovation, and Community Development." },
      { id: "impact", name: "Impact Stats", content: "Over 5,000 students educated, 10,000+ patients treated, 20+ communities served across Africa." },
    ],
  },
  {
    id: "about",
    label: "About",
    sections: [
      { id: "story", name: "Our Story", content: "Founded in 2009, Kadesh Hope Mission began with a bold vision — a group of young people migrated from India to the Democratic Republic of Congo." },
      { id: "mission", name: "Mission & Vision", content: "To uplift impoverished communities through holistic development programs including education, healthcare, and social empowerment." },
    ],
  },
  {
    id: "partners",
    label: "Partners",
    sections: [
      { id: "intro", name: "Partners Intro", content: "Organizations that share our vision for a better Africa." },
      { id: "list", name: "Partner List", content: "Partner Organization, Global Impact Fund, Hope Alliance, Africa Rising." },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    sections: [
      { id: "info", name: "Contact Information", content: "Email: info@kadeshhopemission.org | Phone: +254 700 000 000" },
      { id: "form", name: "Contact Form Settings", content: "Form enabled. Auto-reply enabled. Notification email: admin@kadeshhopemission.org" },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    sections: [
      { id: "links", name: "Footer Links", content: "About, Projects, Gallery, Partners, Donate, Contact" },
      { id: "social", name: "Social Media Links", content: "Facebook, Twitter, YouTube, LinkedIn" },
    ],
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CMSPage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].id);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedFields, setSavedFields] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [storedContent, setStoredContent] = useState({});

  useEffect(() => {
    setStoredContent(loadContent());
  }, []);

  const currentPage = PAGES.find((p) => p.id === selectedPage);

  const getFieldValue = (pageId, sectionId, defaultValue) => {
    if (storedContent[pageId] && storedContent[pageId][sectionId] !== undefined) {
      return storedContent[pageId][sectionId];
    }
    return defaultValue;
  };

  const handleEdit = (section) => {
    setEditingSection(section.id);
    setEditContent(getFieldValue(selectedPage, section.id, section.content));
    setSaved(false);
  };

  const handleSave = (sectionId) => {
    setSaving(true);
    const pageContent = { ...(storedContent[selectedPage] || {}), [sectionId]: editContent };
    const allContent = { ...storedContent, [selectedPage]: pageContent };
    saveContent(allContent);
    setStoredContent(allContent);

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setSavedFields((prev) => ({ ...prev, [sectionId]: true }));
      setEditingSection(null);
      setTimeout(() => {
        setSaved(false);
        setSavedFields((prev) => ({ ...prev, [sectionId]: false }));
      }, 2000);
    }, 500);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditContent("");
  };

  const handleReset = (pageId) => {
    const allContent = { ...storedContent };
    delete allContent[pageId];
    saveContent(allContent);
    setStoredContent(allContent);
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">
            Content Management
          </h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Changes save to browser storage and update the live page
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm font-medium transition-colors",
              showPreview
                ? "bg-vibrant-blue/10 text-vibrant-blue"
                : "bg-gray-100 text-on-surface-variant hover:bg-gray-200"
            )}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </button>

          <div className="relative">
            <select
              value={selectedPage}
              onChange={(e) => {
                setSelectedPage(e.target.value);
                setEditingSection(null);
              }}
              className="appearance-none w-full sm:w-56 bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 font-body text-sm text-deep-navy focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue cursor-pointer"
            >
              {PAGES.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Preview bar */}
      {showPreview && selectedPage === "impact" && (
        <div className="mb-4 px-4 py-3 bg-vibrant-blue/5 border border-vibrant-blue/20 rounded-lg">
          <a
            href="/impact"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-vibrant-blue hover:underline"
          >
            Open Impact Statistics page in new tab →
          </a>
        </div>
      )}

      {/* Success banner */}
      {saved && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-body text-sm">
          <Check className="h-4 w-4" />
          Changes saved successfully. Refresh the page to see updates.
        </div>
      )}

      {/* Reset button */}
      {storedContent[selectedPage] && Object.keys(storedContent[selectedPage]).length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => handleReset(selectedPage)}
            className="font-body text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Reset {currentPage.label} to defaults
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {currentPage?.sections.map((section) => {
          const currentValue = getFieldValue(selectedPage, section.id, section.content);
          const isEdited = storedContent[selectedPage]?.[section.id] !== undefined;
          const isJson = section.type === "json";
          const isSingle = section.type === "single";
          const isMultiline = section.type === "multiline";

          return (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-deep-navy">
                    {section.name}
                  </h3>
                  {isEdited && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-body text-caption text-emerald-600">
                      <Check className="h-3 w-3" />
                      Custom
                    </span>
                  )}
                </div>
                {editingSection !== section.id && (
                  <button
                    onClick={() => handleEdit(section)}
                    className="font-body text-sm font-medium text-vibrant-blue hover:text-vibrant-blue/80 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingSection === section.id ? (
                <div className="p-5">
                  {isJson ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={10}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-xs text-deep-navy placeholder-on-surface-variant resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                        placeholder="Enter valid JSON..."
                      />
                      {(() => {
                        try {
                          JSON.parse(editContent);
                          return null;
                        } catch (e) {
                          return (
                            <p className="mt-2 font-body text-caption text-red-500">
                              Invalid JSON: {e.message}
                            </p>
                          );
                        }
                      })()}
                    </div>
                  ) : isMultiline ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm text-deep-navy placeholder-on-surface-variant resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                    />
                  ) : isSingle ? (
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm text-deep-navy placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                    />
                  ) : (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm text-deep-navy placeholder-on-surface-variant resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                    />
                  )}

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => handleSave(section.id)}
                      disabled={saving || (isJson && (() => { try { JSON.parse(editContent); return false; } catch { return true; } })())}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-semibold text-white transition-colors",
                        saving
                          ? "bg-vibrant-blue/60 cursor-not-allowed"
                          : "bg-vibrant-blue hover:bg-vibrant-blue/90"
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-lg font-body text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4">
                  {isJson ? (
                    <pre className="font-mono text-xs text-on-surface-variant bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-32">
                      {currentValue}
                    </pre>
                  ) : isMultiline ? (
                    <div className="space-y-1">
                      {String(currentValue).split("\n").map((line, i) => (
                        <p key={i} className="font-body text-sm text-on-surface-variant">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                      {currentValue}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
