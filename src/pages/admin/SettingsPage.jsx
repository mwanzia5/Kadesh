import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Check, Globe, Search as SearchIcon, Share2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "general",
    label: "General",
    icon: Globe,
    fields: [
      { key: "siteName", label: "Site Name", type: "text", placeholder: "Kadesh Hope Mission" },
      { key: "tagline", label: "Tagline", type: "text", placeholder: "Fostering hope and healing through compassionate action" },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    icon: SearchIcon,
    fields: [
      { key: "metaTitle", label: "Default Meta Title", type: "text", placeholder: "Kadesh Hope Mission | Hope and Healing for Africa" },
      { key: "metaDescription", label: "Default Meta Description", type: "textarea", placeholder: "Transforming lives through education, healthcare, food security..." },
    ],
  },
  {
    id: "social",
    label: "Social Media",
    icon: Share2,
    fields: [
      { key: "facebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/..." },
      { key: "twitter", label: "Twitter URL", type: "url", placeholder: "https://twitter.com/..." },
      { key: "youtube", label: "YouTube URL", type: "url", placeholder: "https://youtube.com/..." },
      { key: "linkedin", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/..." },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    icon: Phone,
    fields: [
      { key: "email", label: "Email Address", type: "email", placeholder: "info@kadeshhopemission.org" },
      { key: "phone", label: "Phone Number", type: "tel", placeholder: "+254 700 000 000" },
      { key: "address", label: "Address", type: "textarea", placeholder: "Nairobi, Kenya" },
    ],
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [settings, setSettings] = useState({
    siteName: "Kadesh Hope Mission",
    tagline: "Fostering hope and healing through compassionate action",
    metaTitle: "Kadesh Hope Mission | Hope and Healing for Africa",
    metaDescription: "Transforming lives through education, healthcare, food security, and social development since 2009.",
    facebook: "https://facebook.com/kadeshhopemission",
    twitter: "https://twitter.com/kadeshhope",
    youtube: "https://youtube.com/@kadeshhopemission",
    linkedin: "",
    email: "info@kadeshhopemission.org",
    phone: "+254 700 000 000",
    address: "Nairobi, Kenya",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-semibold text-deep-navy">
          Settings
        </h2>
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-body text-sm">
          <Check className="h-4 w-4" />
          Settings saved successfully.
        </div>
      )}

      <div className="flex gap-6">
        {/* Section nav */}
        <div className="hidden md:block w-56 shrink-0">
          <nav className="space-y-1 bg-white rounded-xl border border-gray-200 p-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors text-left",
                  activeSection === section.id
                    ? "bg-vibrant-blue/10 text-vibrant-blue font-medium"
                    : "text-on-surface-variant hover:bg-gray-50 hover:text-deep-navy"
                )}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile section tabs */}
        <div className="md:hidden flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 overflow-x-auto w-full">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors whitespace-nowrap",
                activeSection === section.id
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-on-surface-variant"
              )}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-display text-lg font-semibold text-deep-navy mb-6">
            {currentSection?.label} Settings
          </h3>

          <div className="space-y-5">
            {currentSection?.fields.map((field) => (
              <div key={field.key}>
                <label className="block font-body text-sm font-medium text-deep-navy mb-1.5">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm text-deep-navy placeholder-on-surface-variant resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm text-deep-navy placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-body text-sm font-semibold text-white transition-colors",
                saving
                  ? "bg-vibrant-blue/60 cursor-not-allowed"
                  : "bg-vibrant-blue hover:bg-vibrant-blue/90"
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
