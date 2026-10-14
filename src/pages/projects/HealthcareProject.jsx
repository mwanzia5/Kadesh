import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Baby,
  Check,
  Compass,
  Download,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  House,
  Images,
  MapPin,
  Microscope,
  Pill,
  Plus,
  Stethoscope,
  Users,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { HEALTHCARE_PROJECTS } from "@/lib/healthcare-content";
import {
  HEALTHCARE_GALLERY,
  HEALTHCARE_GALLERY_HREF,
} from "@/lib/healthcare-gallery";
import { ProgramReveal } from "./ProgramElements";
import "./healthcare-pages.css";
import {
  ProjectSurface,
  ProjectMotif,
  ProjectMarquee,
  ProjectDocument,
} from "./ProjectVisuals";

const ICONS = {
  Baby,
  HandHeart,
  HeartPulse,
  House,
  Microscope,
  Pill,
  Stethoscope,
  Users,
};

export default function HealthcareProject({ projectId }) {
  const project = HEALTHCARE_PROJECTS[projectId];
  const isClinic = projectId === "ohana-care";

  return (
    <ProjectSurface
      className={`healthcare-project healthcare-project-${projectId}`}
    >
      <section
        className="healthcare-hero"
        aria-labelledby={`healthcare-title-${projectId}`}
      >
        <ProjectMotif />
        <Container>
          <div className="healthcare-hero-grid">
            <div className="healthcare-hero-copy">
              <span className="healthcare-eyebrow">{project.eyebrow}</span>
              <h2 id={`healthcare-title-${projectId}`}>
                {isClinic ? (
                  <>
                    Ohana Care
                    <br />
                    Clinic
                  </>
                ) : (
                  project.title
                )}
              </h2>
              <p className="healthcare-tagline">{project.tagline}</p>
              <p className="healthcare-introduction">{project.introduction}</p>
              <div className="healthcare-actions">
                <Link to="/donate" className="healthcare-button">
                  {project.supportLabel}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  to={HEALTHCARE_GALLERY_HREF}
                  className="healthcare-text-link"
                >
                  View photo gallery
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <p className="healthcare-location">
                <MapPin size={16} aria-hidden="true" />
                {project.location}
              </p>
              {isClinic && (
                <a
                  href="#ohana-newsletter"
                  className="project-document-shortcut"
                >
                  <Download size={15} aria-hidden="true" />
                  Explore the clinic newsletter
                </a>
              )}
            </div>
            <figure className="healthcare-hero-photo">
              <img
                src={project.image}
                alt={project.imageAlt}
                fetchPriority="high"
              />
              <figcaption>
                <HeartHandshake
                  size={21}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {project.imageCaption}
              </figcaption>
              <span className="healthcare-photo-mark" aria-hidden="true">
                <Plus size={24} strokeWidth={1.25} />
              </span>
            </figure>
          </div>
          <ul className="healthcare-highlights" aria-label="Project focus">
            {project.highlights.map((item, index) => (
              <li key={item}>
                <span aria-hidden="true">0{index + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <ProjectMarquee items={project.marquee} />

      <section
        className="healthcare-foundation"
        aria-labelledby={`healthcare-purpose-${projectId}`}
      >
        <ProjectMotif side="left" />
        <Container>
          <ProgramReveal className="healthcare-story-grid">
            <div>
              <span className="healthcare-eyebrow">
                The purpose behind our work
              </span>
              <h3 id={`healthcare-purpose-${projectId}`}>
                {project.storyTitle}
              </h3>
              <span className="healthcare-heading-line" aria-hidden="true" />
            </div>
            <div className="healthcare-story-copy">
              {project.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </ProgramReveal>
          <div className="healthcare-purpose-grid">
            <ProgramReveal className="healthcare-purpose-card healthcare-vision">
              <Compass size={27} strokeWidth={1.5} aria-hidden="true" />
              <span className="healthcare-eyebrow">The future we see</span>
              <h3>Our vision</h3>
              <p>{project.vision}</p>
            </ProgramReveal>
            <ProgramReveal
              className="healthcare-purpose-card healthcare-mission"
              delay={0.08}
            >
              <HeartHandshake size={27} strokeWidth={1.5} aria-hidden="true" />
              <span className="healthcare-eyebrow">
                The work that takes us there
              </span>
              <h3>Our mission</h3>
              <p>{project.mission}</p>
            </ProgramReveal>
          </div>
          <div className="healthcare-values">
            <span>Our guiding values</span>
            <ul>
              {project.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section
        className="healthcare-services"
        aria-labelledby={`healthcare-services-${projectId}`}
      >
        <Container>
          <ProgramReveal className="healthcare-section-heading">
            <div>
              <span className="healthcare-eyebrow">
                {project.servicesEyebrow}
              </span>
              <h3 id={`healthcare-services-${projectId}`}>
                {project.servicesTitle}
              </h3>
            </div>
            <p>{project.servicesIntro}</p>
          </ProgramReveal>
          <div
            className={`healthcare-services-grid ${isClinic ? "" : "healthcare-services-four"}`}
          >
            {project.services.map((service, index) => {
              const Icon = ICONS[service.icon];
              return (
                <ProgramReveal
                  className="healthcare-service"
                  key={service.title}
                  delay={index * 0.04}
                >
                  <div className="healthcare-service-top">
                    <Icon size={27} strokeWidth={1.4} aria-hidden="true" />
                    <span aria-hidden="true">0{index + 1}</span>
                  </div>
                  <h4>{service.title}</h4>
                  <p>{service.description}</p>
                </ProgramReveal>
              );
            })}
            {isClinic && (
              <ProgramReveal
                className="healthcare-service healthcare-service-invitation"
                delay={0.2}
              >
                <HeartHandshake
                  size={30}
                  strokeWidth={1.4}
                  aria-hidden="true"
                />
                <h4>
                  Every detail.
                  <br />
                  Every individual.
                </h4>
                <p>
                  Speak with us about the clinic and how you can be part of its
                  work.
                </p>
                <Link to="/contact" className="healthcare-text-link">
                  Get in touch
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </ProgramReveal>
            )}
          </div>
        </Container>
      </section>

      <section
        className="healthcare-person"
        aria-labelledby={`healthcare-person-${projectId}`}
      >
        <Container>
          <ProgramReveal className="healthcare-person-panel">
            <div className="healthcare-person-photo">
              <img
                src={project.careImage}
                alt={project.careImageAlt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="healthcare-person-copy">
              <span className="healthcare-eyebrow">
                {isClinic
                  ? "A place for people"
                  : "A person, never just a need"}
              </span>
              <h3 id={`healthcare-person-${projectId}`}>{project.careTitle}</h3>
              <p>{project.careIntro}</p>
              <ul>
                {project.carePoints.map((point) => (
                  <li key={point}>
                    <Check size={17} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </ProgramReveal>
        </Container>
      </section>

      {project.timeline && (
        <section
          className="healthcare-journey"
          aria-labelledby="healthcare-journey-title"
        >
          <Container>
            <ProgramReveal className="healthcare-section-heading">
              <div>
                <span className="healthcare-eyebrow">
                  Built through partnership
                </span>
                <h3 id="healthcare-journey-title">
                  From a shared vision to open doors.
                </h3>
              </div>
              <p>
                A journey of planning, preparation, and partnership, documented
                in our 2026 newsletter.
              </p>
            </ProgramReveal>
            <ol className="healthcare-timeline">
              {project.timeline.map((step, index) => (
                <li key={step.date}>
                  <ProgramReveal delay={index * 0.08}>
                    <span
                      className="healthcare-timeline-dot"
                      aria-hidden="true"
                    />
                    <span className="healthcare-eyebrow">{step.date}</span>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </ProgramReveal>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      <section
        className="healthcare-gallery"
        aria-labelledby={`healthcare-gallery-${projectId}`}
      >
        <Container>
          <ProgramReveal className="healthcare-section-heading">
            <div>
              <span className="healthcare-eyebrow">Our work in pictures</span>
              <h3 id={`healthcare-gallery-${projectId}`}>
                {project.galleryTitle}
              </h3>
              <p>{project.galleryIntro}</p>
            </div>
            <Link to={HEALTHCARE_GALLERY_HREF} className="healthcare-text-link">
              View photo gallery
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </ProgramReveal>
          <div className="healthcare-gallery-grid">
            {HEALTHCARE_GALLERY[projectId].map((photo, index) => (
              <ProgramReveal key={photo.src} delay={index * 0.06}>
                <Link
                  to={HEALTHCARE_GALLERY_HREF}
                  className="healthcare-gallery-link"
                  aria-label={`${photo.caption} — view healthcare photo gallery`}
                >
                  <div>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      decoding="async"
                    />
                    <span>
                      <Images size={18} aria-hidden="true" />
                    </span>
                  </div>
                  <span>
                    {photo.caption}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </span>
                </Link>
              </ProgramReveal>
            ))}
          </div>
          <p className="healthcare-gallery-note">
            Explore clinic and Homecare photographs together in our Ohana Care
            Clinic gallery.
          </p>
        </Container>
      </section>

      {isClinic && (
        <section
          className="healthcare-future"
          aria-labelledby="healthcare-future-title"
        >
          <Container>
            <ProgramReveal className="healthcare-future-panel">
              <div>
                <span className="healthcare-eyebrow">Looking ahead</span>
                <h3 id="healthcare-future-title">{project.futureTitle}</h3>
                <p>{project.futureDescription}</p>
              </div>
              <ProjectDocument
                id="ohana-newsletter"
                href="/documents/Ohana%20Clinic_Kadesh%20Newsletter%201.pdf"
                filename="Ohana Care Clinic Newsletter 2026.pdf"
                title="Inside Ohana Care"
                description="Discover the clinic’s story, services, and vision for community healthcare."
                meta="2026 newsletter · PDF · 1.9 MB"
              />
            </ProgramReveal>
          </Container>
        </section>
      )}
    </ProjectSurface>
  );
}
