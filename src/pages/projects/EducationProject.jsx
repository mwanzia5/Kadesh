import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  Compass,
  Download,
  GraduationCap,
  HeartHandshake,
  Images,
  Monitor,
  Music,
  Sprout,
  Trophy,
  Users,
  Wheat,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { EDUCATION_PROJECTS } from "@/lib/education-content";
import { EDUCATION_GALLERY } from "@/lib/education-gallery";
import { ProgramReveal } from "./ProgramElements";
import "./education-pages.css";
import {
  ProjectSurface,
  ProjectMotif,
  ProjectMarquee,
  ProjectDocument,
} from "./ProjectVisuals";

const ICONS = {
  BookOpen,
  Calculator,
  GraduationCap,
  HeartHandshake,
  Monitor,
  Music,
  Sprout,
  Trophy,
  Users,
  Wheat,
};

export default function EducationProject({ projectId }) {
  const project = EDUCATION_PROJECTS[projectId];
  const galleryHref = `/gallery?project=${project.galleryKey}#gallery-content`;

  return (
    <ProjectSurface
      className={`education-project education-project-${projectId}`}
    >
      <section
        className="education-hero"
        aria-labelledby={`education-title-${projectId}`}
      >
        <ProjectMotif />
        <Container>
          <div className="education-hero-grid">
            <div className="education-hero-copy">
              <span className="education-eyebrow">{project.eyebrow}</span>
              <h2 id={`education-title-${projectId}`}>
                {projectId === "lumina-charis" ? (
                  <>
                    Lumina Charis
                    <br />
                    School of Africa
                  </>
                ) : (
                  project.title
                )}
              </h2>
              <p className="education-tagline">{project.tagline}</p>
              <p className="education-hero-description">
                {project.introduction}
              </p>
              <div className="education-actions">
                <Link to={project.supportHref} className="education-button">
                  {project.supportLabel}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
                <Link to={galleryHref} className="education-text-link">
                  View photo gallery
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <div className="education-location">
                <span aria-hidden="true" />
                {project.location}
              </div>
              {project.future && (
                <a href="#school-profile" className="project-document-shortcut">
                  <Download size={15} aria-hidden="true" />
                  Explore the school profile
                </a>
              )}
            </div>
            <figure className="education-hero-photo">
              <img
                src={project.image}
                alt={project.imageAlt}
                fetchPriority="high"
              />
              <figcaption>{project.imageCaption}</figcaption>
            </figure>
          </div>
          <ul className="education-highlights" aria-label="Project focus">
            {project.highlights.map((highlight, index) => (
              <li key={highlight}>
                <span aria-hidden="true">0{index + 1}</span>
                {highlight}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <ProjectMarquee
        items={
          projectId === "lumina-charis"
            ? [
                "Learning changes lives",
                "Knowledge, character, purpose",
                "A future within reach",
              ]
            : [
                "A place in school",
                "Confidence to grow",
                "Opportunity for every child",
              ]
        }
      />

      <section
        className="education-foundation"
        aria-labelledby={`education-purpose-${projectId}`}
      >
        <ProjectMotif side="left" />
        <Container>
          <ProgramReveal className="education-story-grid">
            <div>
              <span className="education-eyebrow">
                The purpose behind our work
              </span>
              <h3 id={`education-purpose-${projectId}`}>
                {project.storyTitle}
              </h3>
            </div>
            <div className="education-story-copy">
              {project.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </ProgramReveal>
          <div className="education-purpose-grid">
            <ProgramReveal className="education-purpose-card education-vision">
              <Compass size={25} strokeWidth={1.5} aria-hidden="true" />
              <span className="education-eyebrow">The future we see</span>
              <h3>Our vision</h3>
              <p>{project.vision}</p>
            </ProgramReveal>
            <ProgramReveal
              className="education-purpose-card education-mission"
              delay={0.08}
            >
              <BookOpen size={25} strokeWidth={1.5} aria-hidden="true" />
              <span className="education-eyebrow">
                The work that takes us there
              </span>
              <h3>Our mission</h3>
              <p>{project.mission}</p>
            </ProgramReveal>
          </div>
          <div className="education-values">
            <span>Our guiding values</span>
            <ul>
              {project.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {project.learning && (
        <section
          className="education-learning"
          aria-labelledby={`education-learning-${projectId}`}
        >
          <Container>
            <ProgramReveal className="education-section-heading">
              <div>
                <span className="education-eyebrow">Learning at Lumina</span>
                <h3 id={`education-learning-${projectId}`}>
                  {project.learningTitle}
                </h3>
              </div>
              <p>{project.learningIntro}</p>
            </ProgramReveal>
            <div className="education-learning-grid">
              {project.learning.map((item, index) => (
                <ProgramReveal
                  className="education-learning-item"
                  key={item.title}
                  delay={index * 0.06}
                >
                  <span className="education-step" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className="education-eyebrow">{item.label}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </ProgramReveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section
        className="education-approach"
        aria-labelledby={`education-approach-${projectId}`}
      >
        <Container>
          <ProgramReveal className="education-section-heading">
            <div>
              <span className="education-eyebrow">
                {project.learning ? "Beyond the classroom" : "How we help"}
              </span>
              <h3 id={`education-approach-${projectId}`}>
                {project.approachTitle}
              </h3>
            </div>
            <p>{project.approachIntro}</p>
          </ProgramReveal>
          <div
            className={`education-approach-grid ${project.approach.length === 4 ? "education-approach-four" : ""}`}
          >
            {project.approach.map((item, index) => {
              const Icon = ICONS[item.icon];
              return (
                <ProgramReveal
                  className="education-approach-item"
                  key={item.title}
                  delay={(index % 3) * 0.06}
                >
                  <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </ProgramReveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section
        className="education-care"
        aria-labelledby={`education-care-${projectId}`}
      >
        <Container>
          <ProgramReveal className="education-care-panel">
            <div className="education-care-intro">
              <span className="education-eyebrow">The whole child matters</span>
              <h3 id={`education-care-${projectId}`}>{project.careTitle}</h3>
              <p>{project.careIntro}</p>
            </div>
            <div className="education-care-list">
              {project.care.map((item, index) => (
                <div key={item.title}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ProgramReveal>
        </Container>
      </section>

      <section
        className="education-gallery"
        aria-labelledby={`education-gallery-${projectId}`}
      >
        <Container>
          <ProgramReveal className="education-section-heading">
            <div>
              <span className="education-eyebrow">Our work in pictures</span>
              <h3 id={`education-gallery-${projectId}`}>
                {project.galleryTitle}
              </h3>
              <p>{project.galleryDescription}</p>
            </div>
            <Link to={galleryHref} className="education-text-link">
              View photo gallery
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </ProgramReveal>
          <div className="education-gallery-grid">
            {EDUCATION_GALLERY[project.galleryKey].map((photo, index) => (
              <ProgramReveal key={photo.src} delay={index * 0.06}>
                <Link
                  to={galleryHref}
                  className="education-gallery-link"
                  aria-label={`${photo.caption} — view ${project.title} photo gallery`}
                >
                  <div>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      decoding="async"
                    />
                    <span>
                      <Images size={19} aria-hidden="true" />
                    </span>
                  </div>
                  <span>
                    {photo.caption}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </span>
                </Link>
              </ProgramReveal>
            ))}
          </div>
        </Container>
      </section>

      {project.future && (
        <section
          className="education-future"
          aria-labelledby="education-future-title"
        >
          <Container>
            <ProgramReveal className="education-future-panel">
              <div>
                <span className="education-eyebrow">Looking ahead</span>
                <h3 id="education-future-title">
                  A vision that reaches further.
                </h3>
                <p>{project.future}</p>
              </div>
              <ProjectDocument
                id="school-profile"
                href="/documents/LUMINA%20SCHOOL%20OF%20AFRICA%20PROFILE.pdf"
                filename="Lumina Charis School Institutional Profile.pdf"
                title="The Lumina school profile"
                description="Explore the vision, learning experience, and plans shaping the school’s future."
                meta="Institutional profile · PDF · 25 MB"
              />
            </ProgramReveal>
          </Container>
        </section>
      )}
    </ProjectSurface>
  );
}
