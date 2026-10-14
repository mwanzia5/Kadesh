import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Heart } from "lucide-react";
import Container from "@/components/ui/Container";
import SEO from "@/components/ui/SEO";
import { SITE_CONFIG } from "@/constants";
import { PROGRAM_CATEGORIES } from "@/lib/programs";
import {
  ProgramBreadcrumb,
  ProgramReveal,
  ProgramSupport,
} from "./ProgramElements";
import "./ProjectsOverview.css";

const CATEGORY_PRESENTATION = {
  education: {
    image: "/images/child to school/child project_1.jpeg",
    alt: "Children gathered outdoors for the Child to School project",
    label: "A future through learning",
  },
  healthcare: {
    alt: "A healthcare worker caring for a patient",
    label: "Care with compassion",
  },
  "social-development": {
    alt: "Bakery team members preparing bread",
    label: "Stronger communities",
  },
};

export default function ProjectsOverview() {
  return (
    <div className="program-page projects-overview">
      <SEO
        title="Our Projects"
        description="Explore Kadesh Hope Mission's projects in Education, Healthcare, and Social Development."
        url={`${SITE_CONFIG.url}/projects`}
      />
      <section className="projects-intro" aria-labelledby="projects-title">
        <Container>
          <ProgramBreadcrumb current="Our projects" />
          <div className="projects-intro-grid">
            <ProgramReveal className="projects-intro-copy">
              <span className="projects-eyebrow">
                <span aria-hidden="true" />
                Hope, put into action
              </span>
              <h1 id="projects-title">
                Three pathways.
                <em>One shared purpose.</em>
              </h1>
              <p>
                Through education, healthcare, and social development, we meet
                today’s essential needs and build lasting opportunity for
                generations.
              </p>
              <div className="projects-intro-actions">
                <a href="#our-programs" className="projects-explore-button">
                  Explore our projects
                  <ArrowDown size={17} aria-hidden="true" />
                </a>
                <Link to="/donate" className="projects-give-link">
                  Make a difference
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <div className="projects-intro-note">
                <span aria-hidden="true" />
                Rooted in compassion. Built around people.
              </div>
            </ProgramReveal>

            <ProgramReveal className="projects-hero-visual" delay={0.12}>
              <div className="projects-photo-frame">
                <img
                  src="/images/hero-children.jpg"
                  alt="Children sharing a joyful moment together"
                  width="1920"
                  height="1524"
                  fetchPriority="high"
                />
                <div className="projects-photo-caption">
                  <span>People at the heart of every project</span>
                  <p>
                    Small beginnings.
                    <br />
                    Lifelong possibilities.
                  </p>
                </div>
              </div>
              <div className="projects-hope-badge">
                <Heart size={19} strokeWidth={1.6} aria-hidden="true" />A shared
                hope. A brighter future.
              </div>
              <span className="projects-photo-credit">Kadesh Hope Mission</span>
            </ProgramReveal>
          </div>
        </Container>
      </section>

      <section
        id="our-programs"
        className="projects-pathways"
        aria-labelledby="projects-pathways-title"
        tabIndex={-1}
      >
        <Container>
          <ProgramReveal className="projects-section-heading">
            <div>
              <span className="projects-eyebrow">Our areas of focus</span>
              <h2 id="projects-pathways-title">Lasting change starts here.</h2>
            </div>
            <p>
              Discover the people, purpose, and projects behind each pathway.
            </p>
          </ProgramReveal>

          <div className="projects-pathway-grid">
            {PROGRAM_CATEGORIES.map((category, index) => {
              const presentation = CATEGORY_PRESENTATION[category.id];

              return (
                <ProgramReveal
                  key={category.id}
                  className="projects-pathway-reveal"
                  delay={index * 0.08}
                >
                  <Link
                    to={category.href}
                    className={`projects-pathway-card projects-pathway-${category.id}`}
                    aria-labelledby={`pathway-${category.id}`}
                  >
                    <div className="projects-pathway-photo">
                      <img
                        src={presentation?.image || category.image}
                        alt={presentation?.alt || category.title}
                        loading="lazy"
                        decoding="async"
                      />
                      <span
                        className="projects-pathway-number"
                        aria-hidden="true"
                      >
                        0{index + 1}
                      </span>
                      <span className="projects-pathway-photo-label">
                        {presentation?.label || category.title}
                      </span>
                    </div>
                    <div className="projects-pathway-copy">
                      <div className="projects-pathway-title">
                        <h3 id={`pathway-${category.id}`}>{category.title}</h3>
                        <ArrowUpRight size={21} aria-hidden="true" />
                      </div>
                      <p>{category.description}</p>
                      <ul
                        className="projects-pathway-projects"
                        aria-label="Projects"
                      >
                        {category.projects.map((project) => (
                          <li key={project.slug}>{project.title}</li>
                        ))}
                      </ul>
                      <span className="projects-pathway-cta">
                        Explore {category.title.toLowerCase()}
                        <ArrowRight size={17} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </ProgramReveal>
              );
            })}
          </div>
        </Container>
      </section>

      <ProgramSupport title="Help write the next chapter." />
    </div>
  );
}
