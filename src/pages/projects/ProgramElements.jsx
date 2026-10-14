import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import Container from "@/components/ui/Container";
import "./program-pages.css";

export function ProgramReveal({ children, className = "", delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduceMotion ? 0 : 0.6,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function ProgramBreadcrumb({ current, category }) {
  return (
    <nav aria-label="Breadcrumb" className="program-breadcrumb">
      <Link to="/">Home</Link>
      <ChevronRight size={13} aria-hidden="true" />
      {current === "Our projects" ? (
        <span aria-current="page">Our projects</span>
      ) : (
        <>
          <Link to="/projects">Our projects</Link>
          <ChevronRight size={13} aria-hidden="true" />
          {category && (
            <>
              <Link to={category.href}>{category.title}</Link>
              <ChevronRight size={13} aria-hidden="true" />
            </>
          )}
          <span aria-current="page">{current}</span>
        </>
      )}
    </nav>
  );
}

export function ProgramProjectCard({ project, index = 0 }) {
  return (
    <ProgramReveal delay={index * 0.1} className="h-full">
      <Link to={project.href} className="program-project-card">
        <div className="program-project-photo">
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            decoding="async"
          />
          <span className="program-photo-number" aria-hidden="true">
            0{index + 1}
          </span>
          <span className="program-photo-arrow" aria-hidden="true">
            <ArrowUpRight size={24} />
          </span>
        </div>
        <div className="program-project-copy">
          <span className="program-eyebrow">
            {project.slug === "lumina-charis"
              ? "Lumina Charis School of Africa"
              : "A Kadesh Hope initiative"}
          </span>
          <h3>{project.label || project.title}</h3>
          <p>{project.description}</p>
          <span className="program-text-link">
            Discover this project <ArrowRight size={18} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </ProgramReveal>
  );
}

export function ProgramSupport({
  title = "Be part of the next chapter.",
  description = "Help us turn shared hope into practical support for children, families, and communities.",
}) {
  return (
    <section className="program-support-section">
      <Container>
        <ProgramReveal>
          <div className="program-support">
            <div className="program-support-rings" aria-hidden="true" />
            <div className="relative">
              <span className="program-eyebrow">Together, we can do more</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <div className="program-support-actions">
              <Link
                to="/donate"
                className="program-button program-button-light"
              >
                Support our work <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/contact" className="program-support-contact">
                Get in touch <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </ProgramReveal>
      </Container>
    </section>
  );
}
