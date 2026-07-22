import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  Eye,
  Loader2,
  Sparkles,
  ImageIcon,
  Layers,
  TrendingUp,
  Heart as HeartIcon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_ICONS, ICON_OPTIONS } from "@/lib/projectIcons";
import {
  ProjectHero,
  ProjectStory,
  ProjectGallery,
  ProjectImpact,
  ProjectCTA,
} from "@/components/projects/ProjectSections";

const CATEGORIES = ["Education", "Healthcare", "Community", "Water", "Food", "Women"];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyContent = {
  hero: {
    badge: "",
    heroTitle: "",
    subtitle: "",
    image: "",
    buttonText: "Support This Project",
    buttonLink: "/donate",
  },
  story: {
    icon: "Heart",
    eyebrow: "Our Mission",
    heading: "",
    paragraphs: [""],
    tags: [],
  },
  gallery: [],
  impact: [],
  cta: {
    heading: "",
    text: "",
    buttonText: "Donate Now",
    buttonLink: "/donate",
  },
};

const STEPS = [
  { id: "basics", label: "Basics", icon: FileText },
  { id: "hero", label: "Hero", icon: ImageIcon },
  { id: "story", label: "Story", icon: Layers },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "impact", label: "Impact", icon: TrendingUp },
  { id: "cta", label: "Call to Action", icon: HeartIcon },
  { id: "review", label: "Review", icon: Check },
];

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue";

export default function ProjectBuilder({ project, onSave, onCancel, isSaving }) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState(() => {
    if (!project) {
      return {
        title: "",
        slug: "",
        category: "Education",
        short_description: "",
        is_featured: false,
        content: emptyContent,
      };
    }
    return {
      title: project.title || "",
      slug: project.slug || "",
      category: project.category || "Education",
      short_description: project.short_description || "",
      is_featured: project.is_featured || false,
      content: {
        hero: { ...emptyContent.hero, ...(project.content?.hero || {}) },
        story: {
          ...emptyContent.story,
          ...(project.content?.story || {}),
          paragraphs: project.content?.story?.paragraphs?.length
            ? project.content.story.paragraphs
            : [""],
        },
        gallery: project.content?.gallery || [],
        impact: project.content?.impact || [],
        cta: { ...emptyContent.cta, ...(project.content?.cta || {}) },
      },
    };
  });

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !project) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const updateContent = (section, value) => {
    setForm((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: typeof value === "function" ? value(prev.content[section]) : value,
      },
    }));
  };

  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;
  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const handlePublish = () => onSave(form);

  const isStepComplete = (id) => {
    switch (id) {
      case "basics":
        return Boolean(form.title && form.category);
      case "hero":
        return Boolean(form.content.hero.image);
      case "story":
        return Boolean(form.content.story.heading) && form.content.story.paragraphs.some((p) => p.trim());
      case "gallery":
        return form.content.gallery.length > 0;
      case "impact":
        return form.content.impact.length > 0;
      case "cta":
        return Boolean(form.content.cta.heading);
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-vibrant-blue/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-vibrant-blue" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-deep-navy truncate">
              {project ? "Edit Project" : "Build a New Project"}
            </p>
            <p className="font-body text-xs text-on-surface-variant truncate">
              {form.title || "Untitled project"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-sm text-vibrant-blue hover:bg-vibrant-blue/5 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-on-surface-variant hover:text-deep-navy hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 px-4 sm:px-6 py-3 overflow-x-auto border-b border-gray-100 bg-gray-50">
        {STEPS.map((s, i) => {
          const complete = isStepComplete(s.id);
          const active = i === step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-body text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                active
                  ? "bg-white text-deep-navy shadow-sm border border-gray-200"
                  : "text-on-surface-variant hover:text-deep-navy"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold",
                  complete
                    ? "bg-vibrant-blue text-white"
                    : active
                      ? "bg-vibrant-blue/10 text-vibrant-blue"
                      : "bg-gray-200 text-gray-500"
                )}
              >
                {complete ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[step].id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {STEPS[step].id === "basics" && <BasicsStep form={form} updateField={updateField} />}
              {STEPS[step].id === "hero" && (
                <HeroStep hero={form.content.hero} title={form.title} onChange={(v) => updateContent("hero", v)} />
              )}
              {STEPS[step].id === "story" && (
                <StoryStep
                  story={form.content.story}
                  onChange={(v) => updateContent("story", v)}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                />
              )}
              {STEPS[step].id === "gallery" && (
                <GalleryStep gallery={form.content.gallery} onChange={(v) => updateContent("gallery", v)} />
              )}
              {STEPS[step].id === "impact" && (
                <ImpactStep impact={form.content.impact} onChange={(v) => updateContent("impact", v)} />
              )}
              {STEPS[step].id === "cta" && (
                <CTAStep cta={form.content.cta} onChange={(v) => updateContent("cta", v)} />
              )}
              {STEPS[step].id === "review" && (
                <ReviewStep isStepComplete={isStepComplete} onPreview={() => setShowPreview(true)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={goBack}
          disabled={isFirstStep}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm text-on-surface-variant hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={handlePublish}
            disabled={isSaving || !form.title}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isSaving ? "Publishing..." : project ? "Save Changes" : "Publish Project"}
          </button>
        ) : (
          <button
            onClick={goNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Live preview overlay */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-6xl my-4 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                <p className="font-body text-sm font-semibold text-deep-navy">
                  Live Preview — this is how visitors will see it
                </p>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 text-on-surface-variant hover:text-deep-navy hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <ProjectHero title={form.title} hero={form.content.hero} />
                <ProjectStory story={form.content.story} />
                <ProjectGallery gallery={form.content.gallery} />
                <ProjectImpact impact={form.content.impact} />
                <ProjectCTA cta={form.content.cta} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- shared field bits ---------------- */

function StepIntro({ title, description }) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-xl font-semibold text-deep-navy mb-1">{title}</h3>
      <p className="font-body text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-2">
      <label className="font-body text-sm font-semibold text-deep-navy">{children}</label>
      {hint && <p className="font-body text-xs text-on-surface-variant mt-0.5">{hint}</p>}
    </div>
  );
}

function ImageField({ label, hint, value, onChange }) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
          {value && (
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/your-project/hero.jpg"
          className={cn(inputClass, "flex-1")}
        />
      </div>
    </div>
  );
}

/* ---------------- steps ---------------- */

function BasicsStep({ form, updateField }) {
  return (
    <div className="space-y-6">
      <StepIntro
        title="Let's start with the basics"
        description="This is what shows up in your projects grid and the admin list."
      />
      <div>
        <FieldLabel>Project Title</FieldLabel>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Children Education Project"
          className={inputClass}
        />
      </div>
      <div>
        <FieldLabel hint="Used in the page URL. Auto-generated from the title, but you can customize it.">
          URL Slug
        </FieldLabel>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => updateField("slug", slugify(e.target.value))}
          placeholder="children-education-project"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Category</FieldLabel>
          <select
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <span
              onClick={() => updateField("is_featured", !form.is_featured)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                form.is_featured ? "bg-vibrant-blue" : "bg-gray-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.is_featured ? "translate-x-6" : "translate-x-1"
                )}
              />
            </span>
            <span className="font-body text-sm text-deep-navy">Feature this project</span>
          </label>
        </div>
      </div>
      <div>
        <FieldLabel hint="A one or two sentence summary shown on project cards.">Short Description</FieldLabel>
        <textarea
          rows={3}
          value={form.short_description}
          onChange={(e) => updateField("short_description", e.target.value)}
          placeholder="A brief summary of what this project does..."
          className={cn(inputClass, "resize-y")}
        />
      </div>
    </div>
  );
}

function HeroStep({ hero, title, onChange }) {
  const set = (field, value) => onChange({ ...hero, [field]: value });
  return (
    <div className="space-y-6">
      <StepIntro title="Build the hero" description="The big banner at the top of the page — first thing visitors see." />
      <div>
        <FieldLabel hint="Small pill above the headline, e.g. 'Child to School'">Badge Text</FieldLabel>
        <input
          type="text"
          value={hero.badge}
          onChange={(e) => set("badge", e.target.value)}
          placeholder="Child to School"
          className={inputClass}
        />
      </div>
      <div>
        <FieldLabel hint={`Leave blank to reuse the project title ("${title || "your title"}")`}>Headline</FieldLabel>
        <input
          type="text"
          value={hero.heroTitle}
          onChange={(e) => set("heroTitle", e.target.value)}
          placeholder={title || "Children Education Project"}
          className={inputClass}
        />
      </div>
      <div>
        <FieldLabel>Subtitle</FieldLabel>
        <textarea
          rows={2}
          value={hero.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="Nurturing young minds by addressing their most pressing needs"
          className={cn(inputClass, "resize-y")}
        />
      </div>
      <ImageField
        label="Background Image URL"
        hint="Paste an image URL from your media library or an uploaded file's link."
        value={hero.image}
        onChange={(v) => set("image", v)}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Button Text</FieldLabel>
          <input type="text" value={hero.buttonText} onChange={(e) => set("buttonText", e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Button Link</FieldLabel>
          <input type="text" value={hero.buttonLink} onChange={(e) => set("buttonLink", e.target.value)} className={inputClass} />
        </div>
      </div>
    </div>
  );
}

function StoryStep({ story, onChange, tagInput, setTagInput }) {
  const set = (field, value) => onChange({ ...story, [field]: value });

  const updateParagraph = (i, value) => {
    const next = [...story.paragraphs];
    next[i] = value;
    set("paragraphs", next);
  };
  const addParagraph = () => set("paragraphs", [...story.paragraphs, ""]);
  const removeParagraph = (i) => set("paragraphs", story.paragraphs.filter((_, idx) => idx !== i));

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !story.tags.includes(value)) set("tags", [...story.tags, value]);
    setTagInput("");
  };
  const removeTag = (tag) => set("tags", story.tags.filter((t) => t !== tag));

  return (
    <div className="space-y-6">
      <StepIntro title="Tell the story" description="The mission narrative that explains why this project matters." />

      <div>
        <FieldLabel>Icon</FieldLabel>
        <div className="grid grid-cols-8 gap-2">
          {ICON_OPTIONS.map((name) => {
            const Icon = PROJECT_ICONS[name];
            const selected = story.icon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => set("icon", name)}
                title={name}
                className={cn(
                  "flex items-center justify-center aspect-square rounded-lg border transition-colors",
                  selected
                    ? "bg-vibrant-blue text-white border-vibrant-blue"
                    : "bg-gray-50 text-on-surface-variant border-gray-200 hover:border-vibrant-blue/40"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Eyebrow Label</FieldLabel>
          <input type="text" value={story.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="Our Mission" className={inputClass} />
        </div>
        <div>
          <FieldLabel>Heading</FieldLabel>
          <input
            type="text"
            value={story.heading}
            onChange={(e) => set("heading", e.target.value)}
            placeholder="Children Education Projects"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <FieldLabel hint="Each box becomes one paragraph of the story.">Paragraphs</FieldLabel>
        <div className="space-y-3">
          {story.paragraphs.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                rows={3}
                value={p}
                onChange={(e) => updateParagraph(i, e.target.value)}
                placeholder={`Paragraph ${i + 1}...`}
                className={cn(inputClass, "resize-y flex-1")}
              />
              <button
                onClick={() => removeParagraph(i)}
                disabled={story.paragraphs.length === 1}
                className="p-2 mt-1 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addParagraph} className="mt-3 inline-flex items-center gap-1.5 font-body text-sm text-vibrant-blue hover:text-vibrant-blue/80 transition-colors">
          <Plus className="h-4 w-4" />
          Add paragraph
        </button>
      </div>

      <div>
        <FieldLabel hint="Short highlights shown as chips, e.g. 'Scholarships', 'Mentorship'">Tags</FieldLabel>
        <div className="flex flex-wrap gap-2 mb-3">
          {story.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-vibrant-blue/10 pl-3 pr-2 py-1.5 font-body text-xs font-medium text-vibrant-blue">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Type a tag and press Enter"
            className={inputClass}
          />
          <button onClick={addTag} className="px-4 py-2.5 bg-gray-100 text-deep-navy rounded-lg font-body text-sm font-medium hover:bg-gray-200 transition-colors shrink-0">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryStep({ gallery, onChange }) {
  const addImage = () => onChange([...gallery, { src: "", alt: "" }]);
  const updateImage = (i, field, value) => {
    const next = [...gallery];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const removeImage = (i) => onChange(gallery.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= gallery.length) return;
    const next = [...gallery];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <StepIntro title="Add gallery photos" description="The first image displays larger than the rest — pick your best shot for it." />

      {gallery.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="font-body text-sm text-on-surface-variant">No photos yet. Add your first one below.</p>
        </div>
      )}

      <div className="space-y-4">
        {gallery.map((img, i) => (
          <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
              {img.src && (
                <img src={img.src} alt="" className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input type="text" value={img.src} onChange={(e) => updateImage(i, "src", e.target.value)} placeholder="Image URL" className={inputClass} />
              <input
                type="text"
                value={img.alt}
                onChange={(e) => updateImage(i, "alt", e.target.value)}
                placeholder="Alt text (for accessibility)"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-on-surface-variant hover:text-deep-navy hover:bg-gray-100 rounded disabled:opacity-30">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === gallery.length - 1}
                className="p-1.5 text-on-surface-variant hover:text-deep-navy hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button onClick={() => removeImage(i)} className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addImage} className="inline-flex items-center gap-1.5 font-body text-sm text-vibrant-blue hover:text-vibrant-blue/80 transition-colors">
        <Plus className="h-4 w-4" />
        Add photo
      </button>
    </div>
  );
}

function ImpactStep({ impact, onChange }) {
  const addStat = () => onChange([...impact, { icon: "TrendingUp", value: "", label: "" }]);
  const updateStat = (i, field, value) => {
    const next = [...impact];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const removeStat = (i) => onChange(impact.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <StepIntro title="Show the impact" description="Three punchy numbers work best, e.g. '300+ Children Supported'." />

      {impact.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="font-body text-sm text-on-surface-variant">No stats yet. Add your first one below.</p>
        </div>
      )}

      <div className="space-y-3">
        {impact.map((stat, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <select value={stat.icon} onChange={(e) => updateStat(i, "icon", e.target.value)} className={cn(inputClass, "w-32 shrink-0")}>
              {ICON_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input type="text" value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="300+" className={cn(inputClass, "w-24 shrink-0")} />
            <input
              type="text"
              value={stat.label}
              onChange={(e) => updateStat(i, "label", e.target.value)}
              placeholder="Children Supported"
              className={inputClass}
            />
            <button onClick={() => removeStat(i)} className="p-2 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addStat} className="inline-flex items-center gap-1.5 font-body text-sm text-vibrant-blue hover:text-vibrant-blue/80 transition-colors">
        <Plus className="h-4 w-4" />
        Add stat
      </button>
    </div>
  );
}

function CTAStep({ cta, onChange }) {
  const set = (field, value) => onChange({ ...cta, [field]: value });
  return (
    <div className="space-y-6">
      <StepIntro title="End with a call to action" description="The closing section that turns interest into a donation." />
      <div>
        <FieldLabel>Heading</FieldLabel>
        <input type="text" value={cta.heading} onChange={(e) => set("heading", e.target.value)} placeholder="Help a Child Stay in School" className={inputClass} />
      </div>
      <div>
        <FieldLabel>Supporting Text</FieldLabel>
        <textarea
          rows={3}
          value={cta.text}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Your donation helps provide..."
          className={cn(inputClass, "resize-y")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Button Text</FieldLabel>
          <input type="text" value={cta.buttonText} onChange={(e) => set("buttonText", e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Button Link</FieldLabel>
          <input type="text" value={cta.buttonLink} onChange={(e) => set("buttonLink", e.target.value)} className={inputClass} />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ isStepComplete, onPreview }) {
  const checklist = STEPS.filter((s) => s.id !== "review");
  return (
    <div className="space-y-6">
      <StepIntro title="Review & publish" description="Here's everything you've built. Take one more look before it goes live." />

      <div className="space-y-2">
        {checklist.map((s) => {
          const complete = isStepComplete(s.id);
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <span
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                  complete ? "bg-vibrant-blue text-white" : "bg-gray-200 text-gray-400"
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="font-body text-sm text-deep-navy">{s.label}</span>
              {!complete && <span className="ml-auto font-body text-xs text-on-surface-variant">Not filled in yet</span>}
            </div>
          );
        })}
      </div>

      <button
        onClick={onPreview}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm font-semibold text-deep-navy hover:bg-gray-50 transition-colors"
      >
        <Eye className="h-4 w-4" />
        Preview the full page
      </button>
    </div>
  );
}
