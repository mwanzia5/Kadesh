import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  HeartPulse,
  Sprout,
  Check,
  Droplets,
  GraduationCap,
  House,
  School,
  Wheat,
} from "lucide-react";
import Container from "@/components/ui/Container";
import SEO from "@/components/ui/SEO";
import { SITE_CONFIG } from "@/constants";
import { PROGRAM_CATEGORIES } from "@/lib/programs";
import {
  ProgramBreadcrumb,
  ProgramReveal,
  ProgramSupport,
} from "./ProgramElements";
import { ProjectContent as LuminaContent } from "./LuminaCharis";
import { ProjectContent as ChildContent } from "./ChildEducation";
import { ProjectContent as OhanaContent } from "./OhanaCare";
import { ProjectContent as HomecareContent } from "./HomeCare";
import { ProjectContent as BreadContent } from "./BethlehemBread";
import { ProjectContent as BorewellContent } from "./Borewell";
import "./education-pages.css";
import "./healthcare-pages.css";
import "./project-category-theme.css";

const CONTENT = {
  "lumina-charis": LuminaContent,
  "child-education": ChildContent,
  "ohana-care": OhanaContent,
  "home-care": HomecareContent,
  "bethlehem-bread": BreadContent,
  borewell: BorewellContent,
};
const DETAILS = {
  education: {
    icon: BookOpen,
    headline: "A place to learn. A future to shape.",
  },
  healthcare: {
    icon: HeartPulse,
    headline: "Compassion in action. Care within reach.",
  },
  "social-development": {
    icon: Sprout,
    headline: "Everyday essentials. Lasting possibility.",
  },
};
const TAB_SUBTITLES = {
  "lumina-charis": "Lumina Charis School of Africa",
  "child-education": "Scholarships, resources & mentorship",
  "ohana-care": "Primary care · Eldoret, Kenya",
  "home-care": "Dignity, wellbeing & companionship",
  "bethlehem-bread": "Bread production & food support",
  borewell: "Clean water & community stewardship",
};
const PROJECT_ICONS = {
  "lumina-charis": School,
  "child-education": GraduationCap,
  "ohana-care": HeartPulse,
  "home-care": House,
  "bethlehem-bread": Wheat,
  borewell: Droplets,
};

export default function ProgramCategory({ categoryId }) {
  const category = PROGRAM_CATEGORIES.find((item) => item.id === categoryId);
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef([]);
  const tabsRef = useRef(null);
  const selectedSlug = new URLSearchParams(location.search).get("project");
  const activeProject =
    category.projects.find((project) => project.slug === selectedSlug) ||
    category.projects[0];
  const Icon = DETAILS[categoryId].icon;

  // Deep links, tab switches and browser Back/Forward all reveal the same tab area.
  useEffect(() => {
    if (location.hash !== "#project-tabs") return;
    const frame = requestAnimationFrame(() =>
      tabsRef.current?.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash]);

  function selectProject(project) {
    if (project.slug === activeProject.slug) return;
    const search = new URLSearchParams(location.search);
    search.set("project", project.slug);
    navigate({
      pathname: category.href,
      search: `?${search}`,
      hash: "#project-tabs",
    });
  }

  function handleTabKey(event, index) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    let next;
    if (event.key === "ArrowRight")
      next = (index + 1) % category.projects.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + category.projects.length) % category.projects.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = category.projects.length - 1;
    else return;
    event.preventDefault();
    tabRefs.current[next]?.focus();
    selectProject(category.projects[next]);
  }

  return (
    <div
      className={`program-page program-tabbed-page program-page-${categoryId}`}
    >
      <SEO
        title={`${category.title} — ${activeProject.title}`}
        description={category.description}
        image={activeProject.image}
        url={`${SITE_CONFIG.url}${category.href}`}
      />
      <header className="program-category-intro">
        <div className="program-category-orbit" aria-hidden="true" />
        <Container className="relative">
          <ProgramBreadcrumb current={category.title} />
          <ProgramReveal className="program-category-heading">
            <div>
              <span className="program-eyebrow">
                <Icon size={17} aria-hidden="true" />
                {categoryId === "education"
                  ? "Learning changes lives"
                  : categoryId === "healthcare"
                    ? "Compassion changes lives"
                    : "Everyday needs. Lasting opportunity."}
              </span>
              <h1>{category.title}</h1>
              <p className="program-category-tagline">
                {DETAILS[categoryId].headline}
              </p>
            </div>
            <p className="program-category-description">
              {categoryId === "education"
                ? "Through our education centers and Child to School initiative, we connect quality teaching with the practical support children need to learn, grow, and shape their future."
                : categoryId === "healthcare"
                  ? "Through Ohana Care Clinic and Homecare, we connect essential healthcare with personal support, bringing dignity, comfort, and hope closer to the people who need them."
                  : "Through Bethlehem Bread and Borewell, we connect food support and water access with dignity, community participation, and the foundations of a more secure future."}
            </p>
          </ProgramReveal>
        </Container>
      </header>

      <div
        id="project-tabs"
        ref={tabsRef}
        className="program-project-tabs-anchor"
        aria-hidden="true"
      />
      <div className="program-project-tabs-bar">
        <Container>
          <div
            role="tablist"
            aria-label={`${category.title} projects`}
            className="program-project-tabs"
          >
            {category.projects.map((project, index) => {
              const ProjectIcon = PROJECT_ICONS[project.slug];
              return (
                <button
                  key={project.slug}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`tab-${project.slug}`}
                  type="button"
                  role="tab"
                  aria-selected={activeProject.slug === project.slug}
                  aria-controls={`panel-${project.slug}`}
                  tabIndex={activeProject.slug === project.slug ? 0 : -1}
                  onClick={() => selectProject(project)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  className="program-project-tab"
                >
                  <span className="program-tab-thumbnail" aria-hidden="true">
                    <img src={project.image} alt="" />
                    <span>
                      <ProjectIcon size={15} strokeWidth={1.7} />
                    </span>
                  </span>
                  <span className="program-tab-label">
                    <strong>{project.label}</strong>
                    <small>{TAB_SUBTITLES[project.slug]}</small>
                  </span>
                  <span className="program-tab-state" aria-hidden="true">
                    {activeProject.slug === project.slug ? (
                      <Check size={15} />
                    ) : (
                      <ArrowUpRight size={19} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      {category.projects.map((project) => {
        const isActive = project.slug === activeProject.slug;
        const Content = CONTENT[project.slug];
        return (
          <div
            key={project.slug}
            id={`panel-${project.slug}`}
            role="tabpanel"
            aria-labelledby={`tab-${project.slug}`}
            hidden={!isActive}
            tabIndex={0}
            className="program-tab-panel"
          >
            {isActive && (
              <motion.div
                key={project.slug}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3 }}
              >
                <div className="program-project-details">
                  <Content />
                </div>
              </motion.div>
            )}
          </div>
        );
      })}

      <section className="program-other-project">
        <Container>
          {category.projects
            .filter((project) => project.slug !== activeProject.slug)
            .map((project) => (
              <button
                key={project.slug}
                type="button"
                onClick={() => {
                  selectProject(project);
                  tabRefs.current[category.projects.indexOf(project)]?.focus({
                    preventScroll: true,
                  });
                }}
              >
                <span>
                  <small>Also in {category.title.toLowerCase()}</small>
                  <strong>
                    Explore{" "}
                    {project.slug === "lumina-charis"
                      ? "Lumina Charis School"
                      : project.title}
                  </strong>
                </span>
                <ArrowRight size={22} aria-hidden="true" />
              </button>
            ))}
        </Container>
      </section>
      <ProgramSupport
        {...(categoryId === "education"
          ? {
              title: "Help a child’s future take shape.",
              description:
                "Your support helps create opportunities to learn, build confidence, and grow with dignity. Be part of the next chapter in a child’s education.",
            }
          : categoryId === "healthcare"
            ? {
                title: "Help compassionate care reach further.",
                description:
                  "Stand with the people bringing healthcare and everyday support to communities. Your generosity helps sustain care, strengthen dignity, and make room for hope.",
              }
            : {
                title: "Help everyday essentials reach further.",
                description:
                  "Your support helps share bread, bring water closer, and strengthen the foundations of community life. Join us in turning compassion into practical opportunity.",
              })}
      />
    </div>
  );
}
