import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Droplets,
  HandHeart,
  Images,
  Package,
  Sprout,
  Users,
  Wheat,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { SOCIAL_PROJECTS } from "@/lib/social-development-content";
import { SOCIAL_GALLERY } from "@/lib/social-development-gallery";
import { ProgramReveal } from "./ProgramElements";
import { ProjectMarquee, ProjectMotif, ProjectSurface } from "./ProjectVisuals";
import "./social-development-pages.css";

const ICONS = { Droplets, HandHeart, Package, Sprout, Users, Wheat };

export default function SocialDevelopmentProject({ projectId }) {
  const project = SOCIAL_PROJECTS[projectId];
  const galleryHref = `/gallery?project=${projectId}#gallery-content`;
  const ProjectIcon = projectId === "borewell" ? Droplets : Wheat;
  return (
    <ProjectSurface className={`social-project social-project-${projectId}`}>
      <section
        className="social-hero"
        aria-labelledby={`social-title-${projectId}`}
      >
        <ProjectMotif />
        <Container>
          <div className="social-hero-grid">
            <div className="social-hero-copy">
              <span className="social-eyebrow">{project.eyebrow}</span>
              <h2 id={`social-title-${projectId}`}>{project.title}</h2>
              <p className="social-tagline">{project.tagline}</p>
              <p className="social-introduction">{project.introduction}</p>
              <div className="social-actions">
                <Link to="/donate" className="social-button">
                  {project.supportLabel}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
                <Link to={galleryHref} className="social-text-link">
                  View photo gallery
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <div className="social-project-signature">
                <ProjectIcon size={19} strokeWidth={1.5} aria-hidden="true" />A
                Kadesh Hope community initiative
              </div>
            </div>
            <figure className="social-hero-photo">
              <img
                src={project.image}
                alt={project.imageAlt}
                fetchPriority="high"
              />
              <figcaption>{project.imageCaption}</figcaption>
              <span className="social-photo-mark" aria-hidden="true">
                <ProjectIcon size={26} strokeWidth={1.4} />
              </span>
            </figure>
          </div>
          <ul className="social-highlights" aria-label="Project focus">
            {project.highlights.map((text, index) => (
              <li key={text}>
                <span aria-hidden="true">0{index + 1}</span>
                {text}
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <ProjectMarquee items={project.marquee} />
      <section
        className="social-foundation"
        aria-labelledby={`social-purpose-${projectId}`}
      >
        <ProjectMotif side="left" />
        <Container>
          <ProgramReveal className="social-story-grid">
            <div>
              <span className="social-eyebrow">
                The purpose behind our work
              </span>
              <h3 id={`social-purpose-${projectId}`}>{project.storyTitle}</h3>
              <span className="project-heading-line" aria-hidden="true" />
            </div>
            <div className="social-story-copy">
              {project.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </ProgramReveal>
          <div className="social-purpose-grid">
            <ProgramReveal className="social-purpose-card social-vision">
              <Compass size={27} strokeWidth={1.5} aria-hidden="true" />
              <span className="social-eyebrow">The future we see</span>
              <h3>Our vision</h3>
              <p>{project.vision}</p>
            </ProgramReveal>
            <ProgramReveal
              className="social-purpose-card social-mission"
              delay={0.08}
            >
              <HandHeart size={27} strokeWidth={1.5} aria-hidden="true" />
              <span className="social-eyebrow">
                The work that takes us there
              </span>
              <h3>Our mission</h3>
              <p>{project.mission}</p>
            </ProgramReveal>
          </div>
          <div className="social-values">
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
        className="social-approach"
        aria-labelledby={`social-approach-${projectId}`}
      >
        <Container>
          <ProgramReveal className="social-section-heading">
            <div>
              <span className="social-eyebrow">Our work in action</span>
              <h3 id={`social-approach-${projectId}`}>
                {project.approachTitle}
              </h3>
            </div>
            <p>{project.approachIntro}</p>
          </ProgramReveal>
          <div className="social-approach-grid">
            {project.approach.map((item, index) => {
              const Icon = ICONS[item.icon];
              return (
                <ProgramReveal
                  className="social-approach-card"
                  key={item.title}
                  delay={index * 0.07}
                >
                  <div className="social-approach-top">
                    <Icon size={30} strokeWidth={1.4} aria-hidden="true" />
                    <span aria-hidden="true">0{index + 1}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </ProgramReveal>
              );
            })}
          </div>
        </Container>
      </section>
      <section
        className="social-impact"
        aria-labelledby={`social-impact-${projectId}`}
      >
        <Container>
          <ProgramReveal className="social-impact-panel">
            <span className="social-impact-symbol" aria-hidden="true">
              <ProjectIcon size={130} strokeWidth={0.6} />
            </span>
            <div>
              <span className="social-eyebrow">Why this work matters</span>
              <h3 id={`social-impact-${projectId}`}>{project.impactTitle}</h3>
              <p>{project.impactIntro}</p>
            </div>
            <ul>
              {project.impactPoints.map((point) => (
                <li key={point}>
                  <Check size={19} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </ProgramReveal>
        </Container>
      </section>
      <section
        className="social-gallery"
        aria-labelledby={`social-gallery-${projectId}`}
      >
        <Container>
          <ProgramReveal className="social-section-heading">
            <div>
              <span className="social-eyebrow">Our work in pictures</span>
              <h3 id={`social-gallery-${projectId}`}>{project.galleryTitle}</h3>
              <p>{project.galleryIntro}</p>
            </div>
            <Link to={galleryHref} className="social-text-link">
              View photo gallery
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </ProgramReveal>
          <div className="social-gallery-grid">
            {SOCIAL_GALLERY[projectId].map((photo, index) => (
              <ProgramReveal key={photo.src} delay={index * 0.07}>
                <Link
                  to={galleryHref}
                  className="social-gallery-link"
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
        </Container>
      </section>
    </ProjectSurface>
  );
}
