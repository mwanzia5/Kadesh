import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Droplets,
  GraduationCap,
  HeartPulse,
  Image as ImageIcon,
  Images,
  Loader2,
  Soup,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import PageTransition from "@/animations/PageTransition";
import SEO from "@/components/ui/SEO";
import Container from "@/components/ui/Container";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useGalleryImages } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";
import { EDUCATION_GALLERY } from "@/lib/education-gallery";

const PROJECTS = [
  {
    key: "lumina-charis",
    title: "Lumina Charis School of Africa",
    shortTitle: "Lumina Charis School",
    description: "See the school grow from planning and construction into a vibrant place for learning, events, and community life.",
    icon: GraduationCap,
    aliases: ["lumina", "lumina charis", "lumina charis school", "lumina charis school of africa", "school"],
    stages: [
      { key: "planning", label: "Land & Planning", description: "The early vision, site preparation, planning, and foundations of the school." },
      { key: "construction", label: "Construction", description: "Step-by-step progress as classrooms and school facilities take shape." },
      { key: "opening", label: "School Opening", description: "Opening, dedication, handover, and the beginning of school life." },
      { key: "classroom", label: "Classroom Activities", description: "Children learning, teachers serving, and everyday classroom moments." },
      { key: "events", label: "Events & Celebrations", description: "School programs, special events, celebrations, and community gatherings." },
      { key: "current", label: "Current School", description: "The school today—its children, facilities, activities, and continuing impact." },
    ],
  },
  {
    key: "child-to-school",
    title: "Child to School",
    shortTitle: "Child to School",
    description: "Moments of learning, practical support, and encouragement from the Child to School project.",
    icon: GraduationCap,
    aliases: ["child to school", "child-to-school", "child education", "child-education", "children education"],
    stages: [
      { key: "support", label: "Learning Support", description: "Learning resources and practical support for children’s educational journeys." },
      { key: "community", label: "Community & Encouragement", description: "Children, families, and project teams connecting through community activities." },
    ],
  },
  {
    key: "ohana-care-clinic",
    title: "Ohana Care Clinic",
    shortTitle: "Ohana Care Clinic",
    description: "A compassionate journey from identifying health needs through clinic care, treatment, practical support, and follow-up.",
    icon: HeartPulse,
    aliases: [
      "ohana care clinic",
      "ohana clinic",
      "ohana care",
      "clinic",
      "health clinic",
      "medical clinic",
    ],
    stages: [
      { key: "assessment", label: "Identification & Assessment", description: "Understanding each person’s circumstances, health needs, and support required." },
      { key: "visits", label: "Clinic Visits", description: "Clinic consultations, assessment, treatment, and compassionate care for patients." },
      { key: "support", label: "Treatment & Support", description: "Medical, nutritional, mobility, or practical assistance provided through the clinic." },
      { key: "followup", label: "Follow-up & Impact", description: "Continuing care, recovery, progress, and stories of improved wellbeing." },
    ],
  },
  {
    key: "home-care",
    title: "Homecare",
    shortTitle: "Homecare",
    description: "Compassionate care brought directly to people in their homes through visits, practical support, ongoing follow-up, and community connection.",
    icon: HeartPulse,
    aliases: [
      "home care",
      "homecare",
      "home-care",
      "home visits",
      "home visit",
      "home support",
      "community home care",
    ],
    stages: [
      { key: "assessment", label: "Needs Assessment", description: "Identifying individual needs, home circumstances, and the support required before care begins." },
      { key: "visits", label: "Home Visits", description: "Compassionate visits providing personal care, companionship, health checks, and encouragement at home." },
      { key: "support", label: "Practical Support", description: "Food, mobility, medical, household, or other practical assistance provided according to each need." },
      { key: "followup", label: "Follow-up & Impact", description: "Ongoing visits, progress, continued support, and stories showing the difference home care makes." },
    ],
  },
  {
    key: "borewell",
    title: "Borewell Project",
    shortTitle: "Borewell Project",
    description: "Follow each clean-water project from the original need through construction, opening, and everyday community use.",
    icon: Droplets,
    aliases: ["borewell", "bore well", "borewell project", "water", "clean water", "cleanwater"],
    stages: [
      { key: "before", label: "Before the Project", description: "The community, existing water conditions, site selection, and the need that began the project." },
      { key: "construction", label: "Construction", description: "Drilling, building, installation, testing, and progress from start to completion." },
      { key: "opening", label: "Opening & Dedication", description: "Opening ceremonies, dedication, handover, and the first days of the completed borewell." },
      { key: "in-use", label: "In Use & Community Impact", description: "Families using clean water and the long-term difference the borewell is making." },
    ],
  },
  {
    key: "bethlehem-bread",
    title: "Bethlehem Bread",
    shortTitle: "Bethlehem Bread",
    description: "From preparation to distribution, follow how food support reaches families and communities with dignity and care.",
    icon: Soup,
    aliases: ["food", "food security", "foodsecurity", "bethlehem", "bethlehem bread", "bread", "nutrition"],
    stages: [
      { key: "preparation", label: "Preparation", description: "Planning, preparing, packing, and organizing food before distribution." },
      { key: "distribution", label: "Distribution", description: "Food being shared with children, families, and communities." },
      { key: "visits", label: "Community Visits", description: "Taking practical support directly to homes and communities." },
      { key: "impact", label: "Impact Stories", description: "Moments and stories showing how food support is making a difference." },
    ],
  },
];

const FALLBACK_PROJECT = {
  key: "unassigned",
  title: "Unassigned Photos",
  shortTitle: "Unassigned",
  description: "Legacy photos that have not yet been assigned to a project and journey stage.",
  icon: ImageIcon,
  aliases: [],
  stages: [
    { key: "unassigned", label: "Unassigned Photos", description: "Assign these photos from Admin → Media Library to place them in the correct project journey." },
  ],
};

const GENERIC_CATEGORIES = new Set(["gallery", "general", "photo", "photos", "image", "images", ""]);
const PHOTOS_PER_BATCH = 12;
const ALL_PROJECT_PHOTOS_KEY = "__all-project-photos__";

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveProject(category, title) {
  const categoryValue = normalize(category);
  const titleValue = normalize(title);

  for (const project of PROJECTS) {
    if (project.aliases.some((alias) => normalize(alias) === categoryValue)) return project;
  }

  for (const project of PROJECTS) {
    if (
      project.aliases.some((alias) => {
        const normalizedAlias = normalize(alias);
        return normalizedAlias.length > 3 && titleValue.includes(normalizedAlias);
      })
    ) {
      return project;
    }
  }

  if (GENERIC_CATEGORIES.has(categoryValue)) return FALLBACK_PROJECT;

  return {
    ...FALLBACK_PROJECT,
    key: `unassigned-${categoryValue.replace(/\s+/g, "-")}`,
    title: String(category || "Unassigned Photos").trim(),
    shortTitle: String(category || "Unassigned").trim(),
  };
}

function parseGalleryMeta(description) {
  if (!description) return { stageKey: "", date: "", caption: "" };

  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === "object" && (parsed.__khmGallery || parsed.stageKey || parsed.stage || parsed.date)) {
      return {
        stageKey: String(parsed.stageKey || parsed.stage || ""),
        date: String(parsed.date || ""),
        caption: String(parsed.caption || ""),
      };
    }
  } catch {
    // Older descriptions were plain text. Keep them as a caption without changing the photo.
  }

  return { stageKey: "", date: "", caption: String(description) };
}

function resolveStage(project, rawStageKey) {
  if (!project || !Array.isArray(project.stages)) return FALLBACK_PROJECT.stages[0];
  const normalized = normalize(rawStageKey);
  const stage = project.stages.find(
    (item) => normalize(item.key) === normalized || normalize(item.label) === normalized
  );
  return stage || null;
}

function formatJourneyDate(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})(?:-(\d{2}))?/);
  if (!match) return value;
  if (!match[2]) return match[1];
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function stageDateRange(images) {
  const values = images.map((image) => image.journeyDate).filter(Boolean).sort();
  if (!values.length) return "";
  const first = formatJourneyDate(values[0]);
  const last = formatJourneyDate(values[values.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

function CoverCollage({ images, alt }) {
  const preview = images.slice(0, 3);

  if (!preview.length) {
    return (
      <div className="flex h-full min-h-[210px] items-center justify-center bg-[linear-gradient(135deg,#f9edcf,#f1e3c8)]">
        <ImageIcon className="h-12 w-12 text-[#c7ad72]" />
      </div>
    );
  }

  if (preview.length === 1) {
    return <OptimizedImage src={preview[0].src} alt={alt} className="h-full w-full object-cover" />;
  }

  return (
    <div className="grid h-full min-h-[210px] grid-cols-[1.45fr_0.75fr] gap-1 bg-[#efe5d2]">
      <OptimizedImage src={preview[0].src} alt={alt} className="h-full w-full object-cover" />
      <div className="grid grid-rows-2 gap-1">
        <OptimizedImage src={preview[1].src} alt={alt} className="h-full w-full object-cover" />
        {preview[2] ? (
          <OptimizedImage src={preview[2].src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex items-center justify-center bg-[#f4ead7]">
            <Images className="h-8 w-8 text-[#c3a561]" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery() {
  const { data: dbImages, isLoading } = useGalleryImages();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const requestedProject = searchParams.get("project");
  const activeProjectKey = PROJECTS.some((project) => project.key === requestedProject)
    ? requestedProject
    : "all";
  const [activeStageKey, setActiveStageKey] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PHOTOS_PER_BATCH);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const allImages = useMemo(() => {
    const dbList = dbImages?.data;
    const publishedImages = (Array.isArray(dbList) ? dbList : [])
      .filter((img) => img?.image_url)
      .map((img) => {
        const project = resolveProject(img.category, img.title);
        const meta = parseGalleryMeta(img.description);
        const stage = resolveStage(project, meta.stageKey);

        // Public gallery rule: only show photos that belong to a recognised
        // project AND a recognised journey stage. Unassigned/legacy photos
        // remain in Admin/database but are not rendered on the website.
        const isOfficialProject = PROJECTS.some((item) => item.key === project.key);
        if (!isOfficialProject || !stage) return null;

        return {
          id: img.id,
          src: img.image_url,
          project,
          stageKey: stage.key,
          stageLabel: stage.label,
          journeyDate: meta.date,
          caption: meta.caption,
        };
      })
      .filter(Boolean);

    // Keep published CMS albums authoritative. Existing project photographs
    // fill an education album only until its first CMS photos are published.
    const initialAlbums = Object.entries(EDUCATION_GALLERY).flatMap(([key, photos]) => {
      if (publishedImages.some((image) => image.project.key === key)) return [];
      const project = PROJECTS.find((item) => item.key === key);
      return photos.map((photo, index) => ({
        ...photo,
        id: `education-${key}-${index}`,
        project,
        stageLabel: resolveStage(project, photo.stageKey).label,
        journeyDate: "",
      }));
    });
    return [...publishedImages, ...initialAlbums];
  }, [dbImages]);

  useEffect(() => {
    setActiveStageKey(null);
    setVisibleCount(PHOTOS_PER_BATCH);
    setLightboxIndex(null);
  }, [activeProjectKey]);

  useEffect(() => {
    if (isLoading || location.hash !== "#gallery-content") return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("gallery-content")?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isLoading, location.key, location.hash]);

  const projectSummaries = useMemo(() => {
    return PROJECTS.map((project) => {
      const images = allImages.filter((image) => image.project.key === project.key);
      const populatedStageCount = project.stages.filter((stage) =>
        images.some((image) => image.stageKey === stage.key)
      ).length;
      return { project, images, populatedStageCount };
    });
  }, [allImages]);

  const activeSummary = useMemo(
    () => projectSummaries.find(({ project }) => project.key === activeProjectKey) || null,
    [activeProjectKey, projectSummaries]
  );

  const stageAlbums = useMemo(() => {
    if (!activeSummary) return [];
    const { project, images } = activeSummary;

    // Only render stages that actually contain assigned public photos.
    return project.stages
      .map((stage) => ({
        ...stage,
        images: images.filter((image) => image.stageKey === stage.key),
      }))
      .filter((stage) => stage.images.length > 0);
  }, [activeSummary]);

  const activeStage = useMemo(() => {
    if (!activeSummary || !activeStageKey) return null;

    if (activeStageKey === ALL_PROJECT_PHOTOS_KEY) {
      return {
        key: ALL_PROJECT_PHOTOS_KEY,
        label: "All Project Photos",
        description: `See every photo from ${activeSummary.project.title} together in one gallery, across all journey stages.`,
        images: activeSummary.images,
      };
    }

    return stageAlbums.find((stage) => stage.key === activeStageKey) || null;
  }, [activeSummary, activeStageKey, stageAlbums]);

  const stageImages = activeStage?.images || [];
  const visibleStageImages = stageImages.slice(0, visibleCount);
  const lightboxImage = lightboxIndex !== null ? stageImages[lightboxIndex] : null;

  const chooseProject = (projectKey) => {
    const nextParams = new URLSearchParams(searchParams);
    if (projectKey === "all") nextParams.delete("project");
    else nextParams.set("project", projectKey);
    setSearchParams(nextParams);
    setActiveStageKey(null);
    setVisibleCount(PHOTOS_PER_BATCH);
    setLightboxIndex(null);
    window.requestAnimationFrame(() => {
      document.getElementById("gallery-content")?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    });
  };

  const chooseStage = (stageKey) => {
    setActiveStageKey(stageKey);
    setVisibleCount(PHOTOS_PER_BATCH);
    setLightboxIndex(null);
    window.requestAnimationFrame(() => {
      document.getElementById("stage-gallery")?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    });
  };

  const showPrevious = () => {
    if (!stageImages.length) return;
    setLightboxIndex((current) => (current === null ? 0 : (current - 1 + stageImages.length) % stageImages.length));
  };

  const showNext = () => {
    if (!stageImages.length) return;
    setLightboxIndex((current) => (current === null ? 0 : (current + 1) % stageImages.length));
  };

  return (
    <PageTransition>
      <SEO title="Gallery" description="Photo stories from Kadesh Hope Mission projects in education, healthcare, food security, and clean water across Africa." />
      <main className="overflow-hidden bg-[#fffdf8]">
        <HeroSection />

        <section className="border-b border-[#eee4d2] bg-white py-9 sm:py-11">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <ScrollReveal>
                <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">Explore by project</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-deep-navy sm:text-4xl">Every project has a journey</h2>
                <p className="mt-3 font-body text-sm leading-6 text-[#6c6458] sm:text-base">
                  Instead of one long photo wall, explore each project through meaningful stages—from the beginning to the impact it creates.
                </p>
              </ScrollReveal>
            </div>

            {!isLoading && (
              <div className="mt-7 flex flex-wrap justify-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => chooseProject("all")}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 font-body text-[13px] font-bold transition-all sm:px-4 sm:py-2 sm:text-sm",
                    activeProjectKey === "all"
                      ? "border-[#b8840a] bg-[#b8840a] text-white shadow-sm"
                      : "border-[#e4d9c5] bg-[#fffaf0] text-deep-navy hover:border-[#b8840a] hover:text-[#946b09]"
                  )}
                >
                  All Projects
                </button>
                {PROJECTS.map((project) => {
                  const count = projectSummaries.find((summary) => summary.project.key === project.key)?.images.length || 0;
                  return (
                    <button
                      key={project.key}
                      type="button"
                      onClick={() => chooseProject(project.key)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 font-body text-[13px] font-bold transition-all sm:px-4 sm:py-2 sm:text-sm",
                        activeProjectKey === project.key
                          ? "border-[#b8840a] bg-[#b8840a] text-white shadow-sm"
                          : "border-[#e4d9c5] bg-[#fffaf0] text-deep-navy hover:border-[#b8840a] hover:text-[#946b09]"
                      )}
                    >
                      {project.shortTitle} {count > 0 ? `(${count})` : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </Container>
        </section>

        <section id="gallery-content" className="scroll-mt-24 py-12 sm:py-16 lg:py-20">
          <Container>
            {isLoading ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#b8840a]" />
                <p className="font-body text-sm font-semibold text-[#6c6458]">Loading project stories...</p>
              </div>
            ) : activeProjectKey === "all" ? (
              <ProjectOverview summaries={projectSummaries} onOpen={chooseProject} />
            ) : activeSummary ? (
              <ProjectJourney
                summary={activeSummary}
                stages={stageAlbums}
                activeStageKey={activeStageKey}
                onBack={() => chooseProject("all")}
                onChooseStage={chooseStage}
                onChooseAll={() => chooseStage(ALL_PROJECT_PHOTOS_KEY)}
              />
            ) : null}

            {activeSummary && activeStage && (
              <section id="stage-gallery" className="scroll-mt-24 mt-12 rounded-[2rem] border border-[#eadfc8] bg-white p-5 shadow-[0_18px_52px_rgba(55,43,20,0.08)] sm:p-7 lg:p-8">
                <div className="flex flex-col gap-4 border-b border-[#eee3cf] pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveStageKey(null)}
                      className="mb-3 inline-flex items-center gap-1.5 font-body text-xs font-bold text-[#9a710e] transition hover:text-[#775508]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {activeStage.key === ALL_PROJECT_PHOTOS_KEY ? "Back to project journey" : "Back to journey stages"}
                    </button>
                    <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">{activeSummary.project.shortTitle}</p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-deep-navy sm:text-3xl">{activeStage.label}</h3>
                    <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-[#6c6458]">{activeStage.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stageDateRange(stageImages) && (
                      <span className="rounded-full bg-[#fff6dc] px-3 py-1.5 font-body text-xs font-bold text-[#8c6912]">{stageDateRange(stageImages)}</span>
                    )}
                    <span className="rounded-full border border-[#e4d8c1] bg-[#fffdf8] px-3 py-1.5 font-body text-xs font-bold text-[#6f6554]">
                      {stageImages.length} {stageImages.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                </div>

                {stageImages.length === 0 ? (
                  <div className="py-14 text-center">
                    <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[#c9b991]" />
                    <p className="font-display text-lg font-bold text-deep-navy">No photos in this stage yet</p>
                    <p className="mt-1 font-body text-sm text-[#746b5d]">Add photos from Admin → Media Library and choose this project and stage.</p>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                      {visibleStageImages.map((image, index) => (
                        <motion.button
                          key={image.id || `${activeStage.key}-${index}`}
                          type="button"
                          onClick={() => setLightboxIndex(index)}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.12 }}
                          transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                          className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#eadfc8] bg-[#f3eadb] shadow-[0_8px_22px_rgba(55,43,20,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8840a]/50"
                          aria-label={`Open photo from ${activeStage.label}`}
                        >
                          <OptimizedImage
                            src={image.src}
                            alt={`Photo from ${activeSummary.project.title} – ${activeStage.label}`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                          />
                        </motion.button>
                      ))}
                    </div>

                    {visibleCount < stageImages.length && (
                      <div className="mt-7 text-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((count) => count + PHOTOS_PER_BATCH)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#d7c39a] bg-[#fffaf0] px-5 py-2.5 font-body text-sm font-bold text-deep-navy transition hover:border-[#b8840a] hover:text-[#946b09]"
                        >
                          Show more photos
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#8a6a1a]">{stageImages.length - visibleCount} more</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </Container>
        </section>

        <AnimatePresence>
          {lightboxImage && activeSummary && activeStage && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07172a]/95 px-4 py-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxIndex(null)}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-7 sm:top-7"
                aria-label="Close image"
              >
                <X className="h-5 w-5" />
              </button>

              {stageImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); showPrevious(); }}
                    className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-7"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); showNext(); }}
                    className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-7"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="relative flex max-h-[90vh] w-full max-w-6xl flex-col items-center"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative flex max-h-[78vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/20">
                  <OptimizedImage
                    src={lightboxImage.src}
                    alt={`Photo from ${activeSummary.project.title} – ${activeStage.label}`}
                    className="max-h-[78vh] w-auto max-w-full object-contain"
                  />
                </div>
                <div className="mt-4 text-center text-white">
                  <p className="font-display text-xl font-bold sm:text-2xl">{activeStage.label}</p>
                  <p className="mt-1 font-body text-xs text-white/65 sm:text-sm">
                    {activeSummary.project.title} · {(lightboxIndex || 0) + 1} of {stageImages.length}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}

function ProjectOverview({ summaries, onOpen }) {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">Project stories</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-deep-navy sm:text-4xl">Choose a project to explore</h2>
        </div>
        <p className="max-w-lg font-body text-sm leading-6 text-[#6c6458] sm:text-right">
          Each project opens into a shorter visual journey, so even large photo collections stay easy to browse.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaries.map(({ project, images, populatedStageCount }) => {
          const Icon = project.icon || ImageIcon;
          return (
            <motion.button
              key={project.key}
              type="button"
              onClick={() => onOpen(project.key)}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="group overflow-hidden rounded-[1.7rem] border border-[#eadfc8] bg-white text-left shadow-[0_12px_38px_rgba(55,43,20,0.08)] transition-shadow hover:shadow-[0_22px_52px_rgba(55,43,20,0.16)]"
            >
              <div className="relative h-[230px] overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  whileHover={{ scale: 1.035 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <CoverCollage images={images} alt={`Photos from ${project.title}`} />
                </motion.div>

                {/* Stronger overlay so the project name stays readable on every photo */}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,24,42,0.96)_0%,rgba(5,24,42,0.78)_24%,rgba(5,24,42,0.24)_55%,rgba(5,24,42,0.04)_100%)]" />

                <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/95 text-[#9a710e] shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
                  <Icon className="h-5 w-5" />
                </span>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: 0.08 }}
                    className="rounded-2xl border border-white/15 bg-[#071d32]/82 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md"
                  >
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <motion.p
                          className="font-display text-[1.55rem] font-bold leading-[1.08] tracking-[-0.02em] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)] sm:text-2xl"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: 0.15 }}
                        >
                          {project.title}
                        </motion.p>

                        <motion.div
                          className="mt-2 h-[2px] w-12 rounded-full bg-[#e4b334]"
                          initial={{ width: 0 }}
                          whileInView={{ width: 48 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.45, delay: 0.22 }}
                        />

                        <p className="mt-2 font-body text-xs font-semibold text-white/90">
                          {images.length} {images.length === 1 ? "photo" : "photos"} · {populatedStageCount || 0} active {populatedStageCount === 1 ? "stage" : "stages"}
                        </p>
                      </div>

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-navy shadow-md transition-all duration-300 group-hover:translate-x-1 group-hover:scale-105">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="p-5">
                <p className="line-clamp-2 font-body text-sm leading-6 text-[#6c6458]">{project.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.12em] text-[#9a710e]">
                  Explore journey
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectJourney({ summary, stages, activeStageKey, onBack, onChooseStage, onChooseAll }) {
  const { project, images } = summary;
  const Icon = project.icon || ImageIcon;
  const projectDateRange = stageDateRange(images);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e0d2b8] bg-white px-4 py-2 font-body text-xs font-bold text-deep-navy transition hover:border-[#b8840a] hover:text-[#946b09]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </button>

      {/* Combined project introduction + complete gallery action */}
      <div
        className={cn(
          "group overflow-hidden rounded-[2rem] border bg-[linear-gradient(125deg,#fff9ea,#ffffff_52%,#f9efd9)] shadow-[0_14px_44px_rgba(55,43,20,0.07)]",
          activeStageKey === ALL_PROJECT_PHOTOS_KEY
            ? "border-[#b8840a] ring-2 ring-[#b8840a]/10"
            : "border-[#eadfc8]"
        )}
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-9">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f6e7bd] text-[#9a710e]">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">Project journey</p>
                <h2 className="mt-1 font-display text-3xl font-bold text-deep-navy sm:text-4xl">{project.title}</h2>
                <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-[#6c6458] sm:text-base">{project.description}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#e4d8c1] bg-white px-4 py-2 font-body text-xs font-bold text-[#6f6554] shadow-sm">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </span>
              {projectDateRange && (
                <span className="rounded-full border border-[#e6dcc8] bg-white/80 px-4 py-2 font-body text-xs font-bold text-[#6f6554]">
                  {projectDateRange}
                </span>
              )}
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={onChooseAll}
                  className="inline-flex items-center gap-2 rounded-full bg-[#b8840a] px-5 py-2.5 font-body text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#986d08]"
                >
                  View all project images
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onChooseAll}
            disabled={images.length === 0}
            className="relative min-h-[220px] overflow-hidden border-t border-[#eadfc8] text-left lg:min-h-[260px] lg:border-l lg:border-t-0 disabled:cursor-default"
            aria-label={`View all ${project.title} photos`}
          >
            <CoverCollage images={images} alt={`All ${project.title} photos`} />
            {images.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-t from-[#071d32]/58 via-transparent to-transparent" />
            )}
            {images.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
                <div>
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Complete gallery</p>
                  <p className="mt-1 font-display text-xl font-bold">See all images</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-navy transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* One stage layout only — no repeated album cards */}
      {stages.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage, index) => {
            const dateRange = stageDateRange(stage.images);
            const isActive = activeStageKey === stage.key;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => onChooseStage(stage.key)}
                className={cn(
                  "group overflow-hidden rounded-[1.7rem] border bg-white text-left shadow-[0_10px_32px_rgba(55,43,20,0.07)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(55,43,20,0.12)]",
                  isActive
                    ? "border-[#b8840a] ring-2 ring-[#b8840a]/10"
                    : "border-[#eadfc8] hover:border-[#d6bf8a]"
                )}
              >
                <div className="relative h-[190px] overflow-hidden">
                  <CoverCollage images={stage.images} alt={`${stage.label} photos`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071d32]/38 via-transparent to-transparent" />
                  <span
                    className={cn(
                      "absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white/90 font-display text-sm font-bold shadow-sm",
                      isActive ? "bg-[#b8840a] text-white" : "bg-[#fff8e6] text-[#9a710e]"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#9a710e] shadow-sm transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 font-body text-[11px] font-semibold text-[#7a705f]">
                    <span className="rounded-full bg-[#fff6dc] px-2.5 py-1 text-[#8c6912]">
                      {stage.images.length} {stage.images.length === 1 ? "photo" : "photos"}
                    </span>
                    {dateRange && <span>{dateRange}</span>}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold text-deep-navy">{stage.label}</h3>
                  <p className="mt-2 line-clamp-2 font-body text-sm leading-6 text-[#6c6458]">{stage.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.12em] text-[#9a710e]">
                    View photos <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#d9cdb6] bg-white px-5 py-12 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[#c9b991]" />
          <p className="font-display text-lg font-bold text-deep-navy">Photos coming soon</p>
          <p className="mx-auto mt-1 max-w-lg font-body text-sm leading-6 text-[#746b5d]">
            We're preparing photos of this project. Please check back soon.
          </p>
        </div>
      )}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-[42vh] items-center justify-center overflow-hidden sm:min-h-[48vh]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#07233b_0%,#0d4161_52%,#102f48_100%)]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-12 top-16 h-64 w-64 rounded-full bg-[#d7a82f] blur-3xl" />
          <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-[#4c96ad] blur-3xl" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col items-center py-20 text-center text-white sm:py-24">
            <ScrollReveal>
              <span className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 font-body text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">Our Gallery</span>
            </ScrollReveal>
            <SectionHeading
              title="Stories Told Through Every Stage"
              subtitle="Explore Kadesh Hope Mission project journeys—from the first need and construction to opening, service, and lasting community impact."
              light
            />
          </div>
        </Container>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="relative block h-[54px] w-[calc(100%+1.3px)] sm:h-[76px] md:h-[96px]">
          <path d="M0 68L80 61C160 54 320 40 480 42C640 44 800 62 960 64C1120 66 1280 52 1360 45L1440 38V120H1360C1280 120 1120 120 960 120C800 120 640 120 480 120C320 120 160 120 80 120H0V68Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  );
}
