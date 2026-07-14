import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGES = [
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

  const currentPage = PAGES.find((p) => p.id === selectedPage);

  const handleEdit = (section) => {
    setEditingSection(section.id);
    setEditContent(section.content);
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setEditingSection(null);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditContent("");
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-semibold text-deep-navy">
          Content Management
        </h2>

        {/* Page selector */}
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

      {/* Sections */}
      {saved && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-body text-sm">
          <Check className="h-4 w-4" />
          Changes saved successfully.
        </div>
      )}

      <div className="space-y-4">
        {currentPage?.sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-display text-base font-semibold text-deep-navy">
                {section.name}
              </h3>
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
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm text-deep-navy placeholder-on-surface-variant resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                />
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
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
                <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                  {section.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
