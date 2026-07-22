import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import SectionHeading from "@/components/ui/SectionHeading";
import { useProjects, useProject } from "@/hooks/useProjects";
import {
  ProjectHero,
  ProjectStory,
  ProjectGallery,
  ProjectImpact,
  ProjectCTA,
} from "@/components/projects/ProjectSections";

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data, isLoading } = useProject(slug);
  const project = data?.data;

  const { data: allProjectsData } = useProjects();
  const relatedProjects = (allProjectsData?.data ?? [])
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-vibrant-blue" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="font-display text-xl text-deep-navy mb-2">Project not found</p>
        <p className="font-body text-sm text-on-surface-variant mb-6">
          This project may have been moved or unpublished.
        </p>
        <Link to="/projects" className="font-body text-sm font-semibold text-vibrant-blue">
          View all projects
        </Link>
      </div>
    );
  }

  const content = project.content || {};

  return (
    <PageTransition>
      <ProjectHero title={project.title} hero={content.hero} />
      <ProjectStory story={content.story} />
      <ProjectGallery gallery={content.gallery} />
      <ProjectImpact impact={content.impact} />
      <ProjectCTA cta={content.cta} />

      {relatedProjects.length > 0 && (
        <Section background="white" className="section-padding">
          <Container>
            <SectionHeading title="Related Projects" subtitle="Explore more of our initiatives" />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {relatedProjects.map((p) => (
                <motion.div key={p.slug} variants={slideUp}>
                  <GlareHover className="h-full">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="group flex flex-col h-full rounded-xl overflow-hidden bg-white border border-soft-accent/50 shadow-card hover:shadow-card-hover transition-shadow duration-300"
                    >
                      <div className="relative overflow-hidden aspect-[16/10]">
                        <OptimizedImage
                          src={p.content?.hero?.image || p.content?.gallery?.[0]?.src}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-4 left-4 inline-block rounded-full bg-vibrant-blue px-4 py-1.5 font-body text-caption font-medium text-white">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 p-6">
                        <h3 className="font-display text-headline-md text-deep-navy mb-2 group-hover:text-vibrant-blue transition-colors">
                          {p.title}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 font-body text-label-bold text-vibrant-blue mt-auto">
                          Learn More
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </Link>
                  </GlareHover>
                </motion.div>
              ))}
            </motion.div>
          </Container>
        </Section>
      )}
    </PageTransition>
  );
}
